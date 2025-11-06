import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { calculateRequestTotalDays, consumeLIFO } from "@/lib/vacation-consumption"
import { loadAppConfig } from "@/lib/vacation-config"
import { calculateRemainingDays, calculatePendingDays } from "@/lib/vacation-stats"

/**
 * 有給申請API（TimeOffRequest対応）
 * POST /api/vacation/request
 */
export async function POST(request: NextRequest) {
  console.log('[POST /api/vacation/request] リクエスト受信')
  try {
    const body = await request.json()
    console.log('[POST /api/vacation/request] リクエストボディ:', JSON.stringify(body, null, 2))
    const { employeeId, startDate, endDate, unit = "DAY", hoursPerDay, usedDays, reason, requestId, requestedBy, requestedByName, supervisorId } = body || {}

    // requestIdが指定されている場合は修正処理（PUT）を呼び出すべき
    if (requestId) {
      console.warn('[POST /api/vacation/request] requestIdが指定されていますが、POSTリクエストです。修正の場合はPUTリクエストを使用してください。')
      return NextResponse.json({ 
        error: "修正の場合はPUTリクエストを使用してください" 
      }, { status: 400 })
    }

    if (!employeeId || !startDate || !endDate) {
      console.error('[POST /api/vacation/request] 必須項目が不足:', { employeeId, startDate, endDate })
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 })
    }

    // 上司選択のバリデーション
    console.log('[POST /api/vacation/request] supervisorId:', supervisorId, 'type:', typeof supervisorId)
    
    // supervisorIdが有効なIDであることを確認
    if (!supervisorId || 
        typeof supervisorId !== 'string' || 
        supervisorId.trim() === '' || 
        supervisorId === "_loading_" || 
        supervisorId === "_no_supervisors_") {
      console.error('[POST /api/vacation/request] 上司選択が無効:', supervisorId)
      return NextResponse.json({ error: "直属上司を選択してください" }, { status: 400 })
    }
    
    // 有効なsupervisorIdを取得（空白を削除）
    const validSupervisorId = supervisorId.trim()

    // 日付の妥当性チェック
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    // 代理申請かどうかを判定
    const isProxyRequest = requestedBy && requestedBy !== employeeId

    // 過去の日付かつ代理申請の場合のみ許可
    if (start < today && !isProxyRequest) {
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

    // 申請日数を計算（unitとhoursPerDayを考慮）
    // 期間を考慮して、4時間以内は0.5日、超過は0.5日単位で丸める
    let totalDays: number
    
    // 期間の日数を計算（既に定義されているstartとendを使用）
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

    // TimeOffRequestを作成（totalDaysを保存）
    // 代理申請の場合は理由に申請者情報を追記
    let finalReason = reason ?? null
    if (requestedBy && requestedBy !== employeeId && requestedByName) {
      // 代理申請の場合、理由に申請者情報を追記
      const proxyInfo = `（代理申請: ${requestedByName}）`
      finalReason = finalReason ? `${finalReason} ${proxyInfo}` : proxyInfo
    }

    // 過去の日付かつ代理申請の場合、自動承認処理を実行
    const isPastDateAndProxy = start < today && isProxyRequest

    if (isPastDateAndProxy) {
      // トランザクション内で申請を作成してから承認処理を実行
      return await prisma.$transaction(async (tx) => {
        // 申請を作成
        const createData: any = {
          employeeId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          unit: unit as "DAY" | "HOUR",
          hoursPerDay: unit === "HOUR" ? (hoursPerDay || 8) : null,
          reason: finalReason,
          status: "PENDING" as const,
          totalDays: new Prisma.Decimal(totalDays), // 申請時に計算された日数を保存
          supervisorId: validSupervisorId, // 選択した上司ID
        }
        
        // supervisorIdがnullやundefinedでないことを再確認
        if (!createData.supervisorId) {
          console.error('[POST /api/vacation/request] 代理申請: supervisorIdが空です')
          return NextResponse.json({ error: "直属上司を選択してください" }, { status: 400 })
        }

        console.log('[POST /api/vacation/request] 代理申請データ作成:', JSON.stringify({ ...createData, totalDays: totalDays.toString() }, null, 2))
        const created = await tx.timeOffRequest.create({
          data: createData,
        })
        console.log('[POST /api/vacation/request] 代理申請作成成功:', created.id)

        // 自動承認処理を実行
        const daysToUse = totalDays

        // LIFOで消化を実行
        const breakdown = await consumeLIFO(employeeId, daysToUse, new Date(startDate), tx)

        // Consumptionレコードを作成（日毎）
        const consumptions = []
        const startDateObj = new Date(startDate)
        const endDateObj = new Date(endDate)
        const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
        
        let lotIndex = 0
        let lotRemaining = breakdown.breakdown[lotIndex]?.days || 0
        let currentLotId = breakdown.breakdown[lotIndex]?.lotId

        for (let i = 0; i < daysDiff && currentLotId; i++) {
          const date = new Date(startDateObj)
          date.setDate(date.getDate() + i)

          // 各ロットから1日分を使用
          if (lotRemaining > 0 && currentLotId) {
            const daysPerDate = daysToUse / daysDiff
            const actualDays = Math.min(lotRemaining, daysPerDate)

            consumptions.push({
              employeeId: created.employeeId,
              requestId: created.id,
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
        const approved = await tx.timeOffRequest.update({
          where: { id: created.id },
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
            employeeId: created.employeeId,
            actor: requestedBy ? `user:${requestedBy}` : "system",
            action: "REQUEST_APPROVE",
            entity: `TimeOffRequest:${created.id}`,
            payload: JSON.stringify({ breakdown, daysToUse, autoApproved: true }),
          },
        })

        return NextResponse.json({ 
          request: approved, 
          calculatedDays: totalDays,
          autoApproved: true 
        }, { status: 201 })
      })
    } else {
      // 通常の申請（承認待ち）
      const createData: any = {
        employeeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        unit: unit as "DAY" | "HOUR",
        hoursPerDay: unit === "HOUR" ? (hoursPerDay || 8) : null,
        reason: finalReason,
        status: "PENDING" as const,
        totalDays: new Prisma.Decimal(totalDays), // 申請時に計算された日数を保存
        supervisorId: validSupervisorId, // 選択した上司ID
      }
      
      // supervisorIdがnullやundefinedでないことを再確認
      if (!createData.supervisorId) {
        console.error('[POST /api/vacation/request] supervisorIdが空です')
        return NextResponse.json({ error: "直属上司を選択してください" }, { status: 400 })
      }

      console.log('[POST /api/vacation/request] 申請データ作成:', JSON.stringify({ ...createData, totalDays: totalDays.toString() }, null, 2))
      const created = await prisma.timeOffRequest.create({
        data: createData,
      })
      console.log('[POST /api/vacation/request] 申請作成成功:', created.id)

      return NextResponse.json({ request: created, calculatedDays: totalDays }, { status: 201 })
    }
  } catch (error: any) {
    console.error("=== POST /api/vacation/request ERROR ===")
    console.error("Error:", error)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Error name:", error?.name)
    console.error("Error code:", error?.code)
    console.error("================================")
    return NextResponse.json({ 
      error: "申請の作成に失敗しました",
      details: error?.message || "Unknown error",
      code: error?.code || "NO_CODE"
    }, { status: 500 })
  }
}


