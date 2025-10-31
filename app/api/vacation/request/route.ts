import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateRequestTotalDays } from "@/lib/vacation-consumption"
import { loadAppConfig } from "@/lib/vacation-config"

/**
 * 有給申請API（TimeOffRequest対応）
 * POST /api/vacation/request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, startDate, endDate, unit = "DAY", hoursPerDay, usedDays, reason } = body || {}

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 })
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

    // 申請日数を計算（unitとhoursPerDayを考慮）
    // 期間を考慮して、4時間以内は0.5日、超過は0.5日単位で丸める
    let totalDays: number
    
    // 期間の日数を計算
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end.getTime() - start.getTime()
    const periodDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1 // 期間の日数（開始日と終了日を含む）
    
    if (unit === "HOUR" && hoursPerDay) {
      // 時間休の場合：時間から日数に変換（期間を考慮）
      const hours = usedDays || 0
      
      // 期間内の最大時間数（各日は最大1日まで）
      const maxHours = periodDays * hoursPerDay
      
      // 使用時間数が期間の最大時間数を超えていないか確認
      if (hours > maxHours) {
        return NextResponse.json(
          { error: `使用時間数が期間の最大時間数（${maxHours}時間）を超えています` },
          { status: 400 }
        )
      }
      
      // 4時間以内 → 0.5日
      if (hours <= 4) {
        totalDays = 0.5
      } else {
        // 4時間超過 → 0.5日単位で丸める
        const days = hours / hoursPerDay
        totalDays = Math.round(days * 2) / 2
        
        // 期間内の最大日数を超えないようにする
        totalDays = Math.min(totalDays, periodDays)
        
        // 期間に応じた時間数の範囲で調整
        // 2日間で1.5日を取る場合：8.5時間以上12時間で1.5日
        if (periodDays === 2) {
          // 2日間の場合の時間数範囲
          // 0-4時間 → 0.5日
          // 4-8時間 → 1.0日
          // 8.5-12時間 → 1.5日（1日目0.5日+2日目1日、または1日目1日+2日目0.5日）
          // 12-16時間 → 2.0日
          if (hours <= 4) {
            totalDays = 0.5
          } else if (hours > 4 && hours <= 8) {
            totalDays = 1.0
          } else if (hours >= 8.5 && hours <= 12) {
            totalDays = 1.5
          } else if (hours > 12 && hours <= 16) {
            totalDays = 2.0
          } else {
            // 計算された値をそのまま使用（16時間を超える場合は期間の最大日数）
            totalDays = Math.min(totalDays, periodDays)
          }
        } else if (periodDays === 1) {
          // 1日間の場合
          if (hours <= 4) {
            totalDays = 0.5
          } else if (hours > 4 && hours <= hoursPerDay) {
            totalDays = 1.0
          }
        } else {
          // 3日以上の場合も同様のロジックを適用
          totalDays = Math.min(totalDays, periodDays)
        }
      }
    } else {
      // 日単位の場合：0.5日単位で丸める
      const rawDays = usedDays || periodDays
      totalDays = Math.round(rawDays * 2) / 2 // 0.5日単位で丸める
      
      // 期間内の最大日数を超えないようにする
      const maxDays = periodDays
      totalDays = Math.min(totalDays, maxDays)
    }

    // TimeOffRequestを作成
    const created = await prisma.timeOffRequest.create({
      data: {
        employeeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        unit: unit as "DAY" | "HOUR",
        hoursPerDay: unit === "HOUR" ? (hoursPerDay || 8) : null,
        reason: reason ?? null,
        status: "PENDING",
        // totalDaysは承認時に確定
      },
    })

    return NextResponse.json({ request: created, calculatedDays: totalDays }, { status: 201 })
  } catch (error) {
    console.error("POST /api/vacation/request error", error)
    return NextResponse.json({ error: "申請の作成に失敗しました" }, { status: 500 })
  }
}


