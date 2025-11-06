// 有給申請承認API
// 設計メモ準拠：LIFO消化と承認処理

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { consumeLIFO } from "@/lib/vacation-consumption"
import { calculateRequestTotalDays, applyRounding } from "@/lib/vacation-consumption"
import { loadAppConfig } from "@/lib/vacation-config"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: requestId } = params
    const body = await request.json()
    const { approverId } = body

    if (!approverId) {
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
            totalDays: daysToUse,
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

      // 上司が選択された上司と一致するか確認
      if (req.supervisorId !== approverId) {
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
      await tx.timeOffRequest.update({
        where: { id: req.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: approverId,
          totalDays: daysToUse,
          // finalizedByはnullのまま（決済待ち）
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

      return NextResponse.json({ success: true, approved: true, pendingFinalization: true })
    })
  } catch (error) {
    console.error("POST /api/vacation/requests/[id]/approve error", error)
    if (error instanceof Error && error.message.includes("INSUFFICIENT_BALANCE")) {
      return NextResponse.json(
        { error: "残高不足のため承認できません", details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "承認処理に失敗しました" }, { status: 500 })
  }
}

