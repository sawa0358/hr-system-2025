import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateRemainingDays, calculatePendingDays } from "@/lib/vacation-stats"
import { loadAppConfig } from "@/lib/vacation-config"

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
    const { employeeId, startDate, endDate, unit = "DAY", hoursPerDay, usedDays, reason } = body || {}

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 })
    }

    // 申請が存在し、承認されていないことを確認
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

    if (existingRequest.employeeId !== employeeId) {
      return NextResponse.json({ error: "この申請を編集する権限がありません" }, { status: 403 })
    }

    if (existingRequest.status !== "PENDING") {
      return NextResponse.json({ error: "承認待ちの申請のみ編集できます" }, { status: 400 })
    }

    // 日付の妥当性チェック
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    if (start < today) {
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
  } catch (error) {
    console.error("PUT /api/vacation/requests/[id] error", error)
    return NextResponse.json({ error: "申請の更新に失敗しました" }, { status: 500 })
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
    const { employeeId } = body

    // 申請が存在し、承認されていないことを確認
    const existingRequest = await prisma.timeOffRequest.findUnique({
      where: { id: params.id },
      select: { 
        id: true, 
        employeeId: true, 
        status: true,
      },
    })

    if (!existingRequest) {
      return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 })
    }

    if (employeeId && existingRequest.employeeId !== employeeId) {
      return NextResponse.json({ error: "この申請を削除する権限がありません" }, { status: 403 })
    }

    if (existingRequest.status !== "PENDING") {
      return NextResponse.json({ error: "承認待ちの申請のみ削除できます" }, { status: 400 })
    }

    // 申請を削除
    await prisma.timeOffRequest.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "申請を削除しました" }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/vacation/requests/[id] error", error)
    return NextResponse.json({ error: "申請の削除に失敗しました" }, { status: 500 })
  }
}

