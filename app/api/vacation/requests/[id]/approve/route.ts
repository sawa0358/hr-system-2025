// 有給申請承認API
// 設計メモ準拠：LIFO消化と承認処理

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { consumeLIFO } from "@/lib/vacation-consumption"
import { calculateRequestTotalDays, applyRounding } from "@/lib/vacation-consumption"
import { loadAppConfig } from "@/lib/vacation-config"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: requestId } = params
    const body = await request.json().catch((e) => {
      console.error("=== POST /api/vacation/requests/[id]/approve JSON parse error ===")
      console.error("Error:", e)
      console.error("Request ID:", requestId)
      console.error("================================")
      throw new Error("リクエストボディの解析に失敗しました")
    })
    const { approverId } = body

    console.log(`[POST /api/vacation/requests/${requestId}/approve] リクエスト受信`)
    console.log(`[POST /api/vacation/requests/${requestId}/approve] Approver ID:`, approverId)

    if (!approverId) {
      console.error(`[POST /api/vacation/requests/${requestId}/approve] 承認者IDがありません`)
      return NextResponse.json({ error: "承認者IDが必要です" }, { status: 400 })
    }

    // 承認者の権限を確認
    const approver = await prisma.employee.findUnique({
      where: { id: approverId },
      select: { id: true, role: true, name: true },
    })

    if (!approver) {
      return NextResponse.json({ error: "承認者が見つかりません" }, { status: 404 })
    }

    const isHrOrAdmin = approver.role === 'hr' || approver.role === 'admin'

    return await prisma.$transaction(async (tx) => {
      // 申請を取得
      const req = await tx.timeOffRequest.findUnique({
        where: { id: requestId },
        include: {
          employee: {
            select: {
              id: true,
              configVersion: true,
            },
          },
        },
      })

      if (!req) {
        return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 })
      }

      // 決済待ちの申請を総務・管理者が決済する場合
      if (req.status === "APPROVED" && req.approvedBy && !req.finalizedBy) {
        if (!isHrOrAdmin) {
          return NextResponse.json({ error: "決済権限がありません" }, { status: 403 })
        }

        // 設定を読み込み
        const cfg = await loadAppConfig(req.employee.configVersion || undefined)

        // 申請日数を計算
        let daysToUse: number
        if (req.totalDays) {
          daysToUse = Number(req.totalDays)
        } else {
          daysToUse = calculateRequestTotalDays(
            req.startDate,
            req.endDate,
            req.unit,
            req.hoursPerDay || 8,
            cfg.rounding
          )
        }

        // LIFOで消化を実行
        const breakdown = await consumeLIFO(req.employeeId, daysToUse, req.startDate, tx)

        // Consumptionレコードを作成（日毎）
        const consumptions = []
        const startDate = new Date(req.startDate)
        const endDate = new Date(req.endDate)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        let lotIndex = 0
        let lotRemaining = breakdown.breakdown[lotIndex]?.days || 0
        let currentLotId = breakdown.breakdown[lotIndex]?.lotId

        for (let i = 0; i < daysDiff && currentLotId; i++) {
          const date = new Date(startDate)
          date.setDate(date.getDate() + i)

          if (lotRemaining > 0 && currentLotId) {
            const daysPerDate = daysToUse / daysDiff
            const actualDays = Math.min(lotRemaining, daysPerDate)

            consumptions.push({
              employeeId: req.employeeId,
              requestId: req.id,
              lotId: currentLotId,
              date,
              daysUsed: actualDays,
            })

            lotRemaining -= actualDays

            if (lotRemaining <= 0) {
              lotIndex++
              if (lotIndex < breakdown.breakdown.length) {
                lotRemaining = breakdown.breakdown[lotIndex].days
                currentLotId = breakdown.breakdown[lotIndex].lotId
              } else {
                currentLotId = undefined
              }
            }
          }
        }

        // データベース更新
        for (const b of breakdown.breakdown) {
          await tx.grantLot.update({
            where: { id: b.lotId },
            data: { daysRemaining: { decrement: b.days } },
          })
        }

        for (const c of consumptions) {
          await tx.consumption.create({
            data: c,
          })
        }

        // 決済完了を更新
        await tx.timeOffRequest.update({
          where: { id: req.id },
          data: {
            finalizedBy: approverId,
            // totalDaysは既に上司承認時に設定されているので、そのまま使用
            breakdownJson: JSON.stringify(breakdown),
          },
        })

        // 監査ログを追加
        await tx.auditLog.create({
          data: {
            employeeId: req.employeeId,
            actor: `user:${approverId}`,
            action: "REQUEST_FINALIZE",
            entity: `TimeOffRequest:${req.id}`,
            payload: JSON.stringify({ breakdown, daysToUse }),
          },
        })

        return NextResponse.json({ success: true, breakdown, finalized: true })
      }

      // 通常の承認待ちの申請を上司が承認する場合
      if (req.status !== "PENDING") {
        return NextResponse.json({ error: "この申請は既に処理済みです" }, { status: 400 })
      }

      // 上司が選択された上司と一致するか確認（総務・管理者はスキップ）
      // approverは既にトランザクション外で取得済み
      if (!isHrOrAdmin && req.supervisorId !== approverId) {
        return NextResponse.json({ error: "選択された上司のみ承認できます" }, { status: 403 })
      }

      // 設定を読み込み
      const cfg = await loadAppConfig(req.employee.configVersion || undefined)

      // 申請日数を計算（決済時に使用するため保存）
      let daysToUse: number
      if (req.totalDays) {
        daysToUse = Number(req.totalDays)
      } else {
        daysToUse = calculateRequestTotalDays(
          req.startDate,
          req.endDate,
          req.unit,
          req.hoursPerDay || 8,
          cfg.rounding
        )
      }

      // 上司承認時はLIFO消化を行わない（決済時に実行）
      // 申請を承認済み（決済待ち）に更新
      const updated = await tx.timeOffRequest.update({
        where: { id: req.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: approverId,
          totalDays: new Prisma.Decimal(daysToUse), // Prisma.Decimalに変換
          // finalizedByはnullのまま（決済待ち）
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // 4. 監査ログを追加
      await tx.auditLog.create({
        data: {
          employeeId: req.employeeId,
          actor: `user:${approverId}`,
          action: "REQUEST_APPROVE",
          entity: `TimeOffRequest:${req.id}`,
          payload: JSON.stringify({ daysToUse, pendingFinalization: true }),
        },
      })

      // 管理者・総務へメール通知（決済待ち）
      const hrAndAdmins = await tx.employee.findMany({
        where: {
          OR: [
            { role: 'admin' },
            { role: 'hr' },
          ],
          email: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      if (hrAndAdmins.length > 0) {
        const { sendMail } = await import('@/lib/mail')
        const { format } = await import('date-fns')
        
        const recipientEmails = hrAndAdmins.map(u => u.email).filter((email): email is string => Boolean(email))
        
        if (recipientEmails.length > 0) {
          const subject = `【決済待ち】${updated.employee.name}さんの有給申請が承認されました`
          const formattedStart = format(updated.startDate, 'yyyy年MM月dd日')
          const formattedEnd = format(updated.endDate, 'yyyy年MM月dd日')
          
          const textBody = [
            '管理者・総務各位',
            '',
            `${updated.employee.name}さんの有給申請が上司により承認されました。`,
            `期間：${formattedStart} 〜 ${formattedEnd}`,
            `日数：${daysToUse}日`,
            updated.reason ? `理由：${updated.reason}` : undefined,
            `承認者：${approver.name}`,
            '',
            '決済処理をお願いします。',
            'https://hr-system-2025-33b161f586cd.herokuapp.com/leave/admin',
          ].filter(Boolean).join('\n')
          
          const htmlBody = [
            '<p>管理者・総務各位</p>',
            `<p><strong>${updated.employee.name}さんの有給申請が上司により承認されました。</strong></p>`,
            `<p>期間：${formattedStart} 〜 ${formattedEnd}</p>`,
            `<p>日数：<strong>${daysToUse}日</strong></p>`,
            updated.reason ? `<p>理由：${updated.reason}</p>` : '',
            `<p>承認者：${approver.name}</p>`,
            '<p>決済処理をお願いします。</p>',
            '<p><a href="https://hr-system-2025-33b161f586cd.herokuapp.com/leave/admin">https://hr-system-2025-33b161f586cd.herokuapp.com/leave/admin</a></p>',
          ].join('')
          
          const mailResult = await sendMail({
            to: recipientEmails,
            subject,
            text: textBody,
            html: htmlBody,
          })
          
          if (mailResult.success) {
            console.log('[POST /api/vacation/requests/approve] 管理者・総務へのメール通知送信成功:', recipientEmails.length, '名')
          } else if (!mailResult.skipped) {
            console.error('[POST /api/vacation/requests/approve] 管理者・総務へのメール通知送信失敗:', mailResult.error)
          }
        }
      }

      return NextResponse.json({ success: true, approved: true, pendingFinalization: true })
    })
  } catch (error: any) {
    console.error("=== POST /api/vacation/requests/[id]/approve ERROR ===")
    console.error("Error:", error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Error name:", error?.name)
    console.error("Error code:", error?.code)
    console.error("Request ID:", params?.id)
    console.error("================================")
    
    if (error instanceof Error && error.message.includes("INSUFFICIENT_BALANCE")) {
      return NextResponse.json(
        { error: "残高不足のため承認できません", details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ 
      error: "承認処理に失敗しました",
      details: error?.message || "Unknown error",
      code: error?.code || "NO_CODE"
    }, { status: 500 })
  }
}

