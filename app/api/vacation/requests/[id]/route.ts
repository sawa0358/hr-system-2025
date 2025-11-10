import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateRemainingDays, calculatePendingDays } from "@/lib/vacation-stats"
import { loadAppConfig } from "@/lib/vacation-config"
import { consumeLIFO } from "@/lib/vacation-consumption"

/**
 * 申請を更新するAPI
 * PUT /api/vacation/requests/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { employeeId, startDate, endDate, unit = "DAY", hoursPerDay, usedDays, reason, force } = body || {}

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 })
    }

    // 申請が存在することを確認
    const existingRequest = await prisma.timeOffRequest.findUnique({
      where: { id: params.id },
      select: { 
        id: true, 
        employeeId: true, 
        status: true,
        totalDays: true,
      },
    })

    if (!existingRequest) {
      return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 })
    }

    const isPending = existingRequest.status === "PENDING"
    const isApproved = existingRequest.status === "APPROVED"
    const isRejected = existingRequest.status === "REJECTED"

    // 承認済み・却下の編集にはforceフラグが必要（総務・管理者権限のみ）
    if (!isPending && !force) {
      return NextResponse.json({ error: "承認待ちの申請のみ編集できます" }, { status: 400 })
    }

    // 権限チェック（承認済み・却下の編集の場合）
    if (!isPending && force) {
      // 総務・管理者権限をチェック（リクエストヘッダーから取得）
      const requesterId = request.headers.get("x-employee-id")
      if (!requesterId) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
      }

      const requester = await prisma.employee.findUnique({
        where: { id: requesterId },
        select: { role: true },
      })

      if (!requester || (requester.role !== "hr" && requester.role !== "admin")) {
        return NextResponse.json({ error: "総務・管理者権限が必要です" }, { status: 403 })
      }
    }

    // 日付の妥当性チェック
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    // 承認済み・却下の申請を編集する場合（force=true）は過去の日付も許可
    if (!force && start < today) {
      return NextResponse.json({ error: "開始日は今日以降の日付を選択してください" }, { status: 400 })
    }

    if (start > end) {
      return NextResponse.json({ error: "開始日は終了日以前の日付を選択してください" }, { status: 400 })
    }

    // 社員存在チェック
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, configVersion: true },
    })
    if (!employee) {
      return NextResponse.json({ error: "社員が見つかりません" }, { status: 404 })
    }

    // 設定を読み込み
    const cfg = await loadAppConfig(employee.configVersion || undefined)

    // 申請日数を計算
    let totalDays: number
    
    // 期間の日数を計算
    const diffMs = end.getTime() - start.getTime()
    const periodDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1 // 期間の日数（開始日と終了日を含む）
    
    if (unit === "HOUR" && hoursPerDay) {
      // 時間休の場合
      const hours = usedDays || 0
      const maxHours = periodDays * hoursPerDay
      
      if (hours > maxHours) {
        return NextResponse.json(
          { error: `使用時間数が期間の最大時間数（${maxHours}時間）を超えています` },
          { status: 400 }
        )
      }
      
      if (hours <= 4) {
        totalDays = 0.5
      } else {
        const days = hours / hoursPerDay
        totalDays = Math.round(days * 2) / 2
        totalDays = Math.min(totalDays, periodDays)
      }
    } else {
      // 日単位の場合
      const rawDays = usedDays || periodDays
      totalDays = Math.round(rawDays * 2) / 2
      totalDays = Math.min(totalDays, periodDays)
    }

    // 承認済みの申請の場合、既存の消化を戻す処理を実行
    if (isApproved && force) {
      return await prisma.$transaction(async (tx) => {
        // 1. 申請に関連するConsumptionレコードを取得
        const consumptions = await tx.consumption.findMany({
          where: { requestId: params.id },
        })

        // 2. 各Consumptionレコードのロットに残日数を戻す
        for (const consumption of consumptions) {
          await tx.grantLot.update({
            where: { id: consumption.lotId },
            data: { daysRemaining: { increment: consumption.daysUsed } },
          })
        }

        // 3. Consumptionレコードを削除
        await tx.consumption.deleteMany({
          where: { requestId: params.id },
        })

        // 4. 残日数チェック（既に消化を戻した後、トランザクション内で直接計算）
        const lots = await tx.grantLot.findMany({
          where: {
            employeeId,
            expiryDate: { gte: new Date() },
            daysRemaining: { gt: 0 },
          },
        })
        const remainingDays = Math.round(lots.reduce((sum, lot) => sum + Number(lot.daysRemaining), 0) * 2) / 2

        const pendingRequests = await tx.timeOffRequest.findMany({
          where: {
            employeeId,
            status: 'PENDING',
            id: { not: params.id }, // 編集中の申請を除外
          },
        })
        const pendingDays = Math.round(pendingRequests.reduce((sum, req) => sum + Number(req.totalDays || 0), 0) * 2) / 2

        const availableDays = remainingDays - pendingDays

        if (totalDays > availableDays) {
          throw new Error(`残日数が不足しています。利用可能日数: ${availableDays}日（残日数: ${remainingDays}日、申請中: ${pendingDays}日）`)
        }

        // 5. 新しい申請として再承認処理を実行（承認済みのままにする）
        // LIFOで消化を実行
        const breakdown = await consumeLIFO(employeeId, totalDays, new Date(startDate), tx)

        // Consumptionレコードを作成（日毎）
        const newConsumptions = []
        const startDateObj = new Date(startDate)
        const endDateObj = new Date(endDate)
        const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
        
        let lotIndex = 0
        let lotRemaining = breakdown.breakdown[lotIndex]?.days || 0
        let currentLotId = breakdown.breakdown[lotIndex]?.lotId

        for (let i = 0; i < daysDiff && currentLotId; i++) {
          const date = new Date(startDateObj)
          date.setDate(date.getDate() + i)

          if (lotRemaining > 0 && currentLotId) {
            const daysPerDate = totalDays / daysDiff
            const actualDays = Math.min(lotRemaining, daysPerDate)

            newConsumptions.push({
              employeeId: employeeId,
              requestId: params.id,
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

        // 6. ロットの残日数を減算
        for (const b of breakdown.breakdown) {
          await tx.grantLot.update({
            where: { id: b.lotId },
            data: { daysRemaining: { decrement: b.days } },
          })
        }

        // 7. Consumptionレコードを作成
        for (const c of newConsumptions) {
          await tx.consumption.create({
            data: c,
          })
        }

        // 8. 申請を承認済みのまま更新
        const updated = await tx.timeOffRequest.update({
          where: { id: params.id },
          data: {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            unit: unit as "DAY" | "HOUR",
            hoursPerDay: unit === "HOUR" ? (hoursPerDay || 8) : null,
            reason: reason ?? null,
            totalDays: totalDays,
            status: "APPROVED",
            approvedAt: new Date(), // 再承認日時
            breakdownJson: JSON.stringify(breakdown),
          },
        })

        return NextResponse.json({ 
          request: updated, 
          calculatedDays: totalDays,
          refunded: true,
          reapproved: true 
        }, { status: 200 })
      })
    }

    // 却下の申請の場合、単純に更新（消化されていないので）
    if (isRejected && force) {
      // 残日数チェック
      const remainingDays = await calculateRemainingDays(employeeId)
      const pendingDays = await calculatePendingDays(employeeId)
      const availableDays = remainingDays - pendingDays

      if (totalDays > availableDays) {
        return NextResponse.json(
          { 
            error: `残日数が不足しています。利用可能日数: ${availableDays}日（残日数: ${remainingDays}日、申請中: ${pendingDays}日）` 
          }, 
          { status: 400 }
        )
      }

      // 申請をPENDING状態に戻して更新
      const updated = await prisma.timeOffRequest.update({
        where: { id: params.id },
        data: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          unit: unit as "DAY" | "HOUR",
          hoursPerDay: unit === "HOUR" ? (hoursPerDay || 8) : null,
          reason: reason ?? null,
          totalDays: totalDays,
          status: "PENDING",
        },
      })

      return NextResponse.json({ request: updated, calculatedDays: totalDays }, { status: 200 })
    }

    // 承認待ちの申請の場合（従来の処理）
    // 既存の申請日数を除いた残日数チェック
    const remainingDays = await calculateRemainingDays(employeeId)
    const pendingDays = await calculatePendingDays(employeeId)
    const oldPendingDays = existingRequest.totalDays ? Number(existingRequest.totalDays) : 0
    const availableDays = remainingDays - pendingDays + oldPendingDays // 既存の申請日数を戻す

    if (totalDays > availableDays) {
      return NextResponse.json(
        { 
          error: `残日数が不足しています。利用可能日数: ${availableDays}日（残日数: ${remainingDays}日、申請中: ${pendingDays}日）` 
        }, 
        { status: 400 }
      )
    }

    // 申請を更新
    const updated = await prisma.timeOffRequest.update({
      where: { id: params.id },
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        unit: unit as "DAY" | "HOUR",
        hoursPerDay: unit === "HOUR" ? (hoursPerDay || 8) : null,
        reason: reason ?? null,
        totalDays: totalDays,
      },
    })

    return NextResponse.json({ request: updated, calculatedDays: totalDays }, { status: 200 })
  } catch (error: any) {
    console.error("=== PUT /api/vacation/requests/[id] ERROR ===")
    console.error("Error:", error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Request ID:", params?.id)
    console.error("================================")
    return NextResponse.json({ 
      error: "申請の更新に失敗しました",
      details: error?.message || "Unknown error"
    }, { status: 500 })
  }
}

/**
 * 申請を削除するAPI
 * DELETE /api/vacation/requests/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}))
    const { employeeId, force } = body

    // 申請が存在することを確認
    const existingRequest = await prisma.timeOffRequest.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    })

    if (!existingRequest) {
      return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 })
    }

    const isPending = existingRequest.status === "PENDING"
    const isApproved = existingRequest.status === "APPROVED"
    const isRejected = existingRequest.status === "REJECTED"

    // 承認済み・却下の削除にはforceフラグが必要（総務・管理者権限のみ）
    if (!isPending && !force) {
      return NextResponse.json({ error: "承認待ちの申請のみ削除できます" }, { status: 400 })
    }

    // 権限チェック（承認済み・却下の削除の場合）
    if (!isPending && force) {
      // 総務・管理者権限をチェック（リクエストヘッダーから取得）
      const requesterId = request.headers.get("x-employee-id")
      if (!requesterId) {
        return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
      }

      const requester = await prisma.employee.findUnique({
        where: { id: requesterId },
        select: { role: true },
      })

      if (!requester || (requester.role !== "hr" && requester.role !== "admin")) {
        return NextResponse.json({ error: "総務・管理者権限が必要です" }, { status: 403 })
      }
    }

    // 承認済みの申請の場合、消化を戻す処理を実行
    if (isApproved && force) {
      return await prisma.$transaction(async (tx) => {
        // 1. 申請に関連するConsumptionレコードを取得
        const consumptions = await tx.consumption.findMany({
          where: { requestId: params.id },
        })

        // 2. 各Consumptionレコードのロットに残日数を戻す
        for (const consumption of consumptions) {
          await tx.grantLot.update({
            where: { id: consumption.lotId },
            data: { daysRemaining: { increment: consumption.daysUsed } },
          })
        }

        // 3. Consumptionレコードを削除
        await tx.consumption.deleteMany({
          where: { requestId: params.id },
        })

        // 4. 申請を削除
        await tx.timeOffRequest.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ 
          message: "申請を削除しました。承認済みの場合は消化された有給が戻りました。" 
        }, { status: 200 })
      })
    }

    // 承認待ち・却下の申請を削除（却下の場合は消化されていないので単純削除）
    await prisma.timeOffRequest.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "申請を削除しました" }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/vacation/requests/[id] error", error)
    return NextResponse.json({ error: "申請の削除に失敗しました" }, { status: 500 })
  }
}

