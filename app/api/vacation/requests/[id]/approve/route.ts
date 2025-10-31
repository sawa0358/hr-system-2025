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

      if (req.status !== "PENDING") {
        return NextResponse.json({ error: "この申請は既に処理済みです" }, { status: 400 })
      }

      // 設定を読み込み
      const cfg = await loadAppConfig(req.employee.configVersion || undefined)

      // 申請日数を計算
      let daysToUse: number
      if (req.totalDays) {
        // 既に計算されている場合はそれを使用
        daysToUse = Number(req.totalDays)
      } else {
        // 計算する
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
      
      // 簡易版：期間全体を均等に分配
      // 実際には稼働日のみを考慮する必要がある
      let lotIndex = 0
      let lotRemaining = breakdown.breakdown[lotIndex]?.days || 0
      let currentLotId = breakdown.breakdown[lotIndex]?.lotId

      for (let i = 0; i < daysDiff && currentLotId; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)

        // 各ロットから1日分を使用
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

          // ロットを使い切ったら次へ
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
      // 1. ロットの残日数を減算
      for (const b of breakdown.breakdown) {
        await tx.grantLot.update({
          where: { id: b.lotId },
          data: { daysRemaining: { decrement: b.days } },
        })
      }

      // 2. Consumptionレコードを作成
      for (const c of consumptions) {
        await tx.consumption.create({
          data: c,
        })
      }

      // 3. 申請を承認済みに更新
      await tx.timeOffRequest.update({
        where: { id: req.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          totalDays: daysToUse,
          breakdownJson: JSON.stringify(breakdown),
        },
      })

      // 4. 監査ログを追加
      await tx.auditLog.create({
        data: {
          employeeId: req.employeeId,
          actor: approverId ? `user:${approverId}` : "system",
          action: "REQUEST_APPROVE",
          entity: `TimeOffRequest:${req.id}`,
          payload: JSON.stringify({ breakdown, daysToUse }),
        },
      })

      return NextResponse.json({ success: true, breakdown })
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

