import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNextGrantDate, getPreviousGrantDate, chooseGrantDaysForEmployee, diffInYearsHalfStep } from "@/lib/vacation-grant-lot"
import { loadAppConfig } from "@/lib/vacation-config"

/**
 * 特定時点での有効ロットの残日数を計算（失効していないもの）
 * @param employeeId 社員ID
 * @param grantDate 付与日時点
 * @returns 残日数
 */
async function calculateCarryOverDaysAtGrantDate(
  employeeId: string,
  grantDate: Date
): Promise<number> {
  // 付与日時点で有効なロットを取得（失効していないもの）
  const validLots = await prisma.grantLot.findMany({
    where: {
      employeeId,
      grantDate: { lt: grantDate }, // 付与日より前のロット
      expiryDate: { gte: grantDate }, // 付与日時点でまだ有効（2年有効期限を考慮）
      daysRemaining: { gt: 0 }, // 残日数が0より大きい
    },
    orderBy: { grantDate: 'desc' },
  })

  // 残日数の合計
  const carryOverDays = validLots.reduce((sum, lot) => sum + Number(lot.daysRemaining), 0)
  return Math.round(carryOverDays * 2) / 2
}

/**
 * 総付与数の計算詳細を取得するAPI
 * GET /api/vacation/grant-calculation/[employeeId]
 * 
 * 一昨年前までのデータを取得して、繰越し日数、新付与日数、時点総付与日数などを計算
 * 期間は付与日ベースで計算（例: 2023/09/01 ~ 2024/09/01）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params
    if (!employeeId) {
      return NextResponse.json({ error: "employeeId が必要です" }, { status: 400 })
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        joinDate: true,
        configVersion: true,
        vacationPattern: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: "社員が見つかりません" }, { status: 404 })
    }

    const today = new Date()
    const joinDate = new Date(employee.joinDate)
    const cfg = await loadAppConfig(employee.configVersion || undefined)

    // 現在から過去3回の付与日を取得
    // 今期の開始付与日（直近の付与日）
    const currentGrantDate = getPreviousGrantDate(joinDate, cfg, today)
    if (!currentGrantDate) {
      // まだ初回付与前の場合はデータなし
      return NextResponse.json({
        twoYearsAgo: null,
        lastYear: null,
        currentYear: null,
      })
    }

    // 昨年の開始付与日（1年前の付与日）
    const lastYearGrantDate = getPreviousGrantDate(joinDate, cfg, new Date(currentGrantDate.getTime() - 1))
    // 一昨年の開始付与日（2年前の付与日）
    const twoYearsAgoGrantDate = lastYearGrantDate ? getPreviousGrantDate(joinDate, cfg, new Date(lastYearGrantDate.getTime() - 1)) : null

    // 各期間の終了日（次の付与日）
    const currentGrantDateNext = getNextGrantDate(joinDate, cfg, currentGrantDate)
    const lastYearGrantDateNext = lastYearGrantDate ? getNextGrantDate(joinDate, cfg, lastYearGrantDate) : null
    const twoYearsAgoGrantDateNext = twoYearsAgoGrantDate ? getNextGrantDate(joinDate, cfg, twoYearsAgoGrantDate) : null

    // 一昨年1年間のデータを取得
    let twoYearsAgoData: any = null
    if (twoYearsAgoGrantDate && twoYearsAgoGrantDateNext) {
      // 一昨年1年間の使用日数を先に計算
      const twoYearsAgoRequests = await prisma.timeOffRequest.findMany({
        where: {
          employeeId,
          status: "APPROVED",
        },
      })
      const twoYearsAgoUsedDays = twoYearsAgoRequests
        .filter(req => {
          const reqStartDate = new Date(req.startDate)
          const reqEndDate = new Date(req.endDate)
          return (reqStartDate >= twoYearsAgoGrantDate && reqStartDate < twoYearsAgoGrantDateNext) ||
            (reqEndDate >= twoYearsAgoGrantDate && reqEndDate < twoYearsAgoGrantDateNext) ||
            (reqStartDate < twoYearsAgoGrantDate && reqEndDate >= twoYearsAgoGrantDateNext)
        })
        .reduce((sum, req) => sum + Number(req.totalDays || 0), 0)

      // 一昨年の開始時点の繰越し日数（失効していないもの）
      const carryOverDays = await calculateCarryOverDaysAtGrantDate(
        employeeId,
        twoYearsAgoGrantDate
      )

      // 一昨年の付与ロットを取得（一昨年の新付与日に作成されたロット）
      const twoYearsAgoLots = await prisma.grantLot.findMany({
        where: {
          employeeId,
          grantDate: {
            gte: new Date(twoYearsAgoGrantDate.getTime() - 24 * 60 * 60 * 1000), // 新付与日の前日以降
            lte: new Date(twoYearsAgoGrantDate.getTime() + 24 * 60 * 60 * 1000), // 新付与日の翌日まで
          },
        },
        orderBy: { grantDate: 'asc' },
      })

      // 一昨年の新付与日数
      const newGrantLot = twoYearsAgoLots.find(lot => {
        const lotDate = new Date(lot.grantDate)
        const grantDate = new Date(twoYearsAgoGrantDate)
        return lotDate.getFullYear() === grantDate.getFullYear() &&
          lotDate.getMonth() === grantDate.getMonth() &&
          lotDate.getDate() === grantDate.getDate()
      })
      const newGrantDays = newGrantLot ? Number(newGrantLot.daysGranted) : 0

      // 一昨年の時点総付与日数（繰越し+新付与）
      const totalAtGrantDate = carryOverDays + newGrantDays

      // 一昨年の総付与数（繰越し+新付与）
      const twoYearsAgoTotalGranted = carryOverDays + newGrantDays

      // 一昨年期間終了時点での繰越し日数（昨年への繰越し）
      // LIFO方式：新付与日数から使用日数を引いた残りが繰越し
      const carryOverToLastYear = Math.max(0, newGrantDays - twoYearsAgoUsedDays)

      twoYearsAgoData = {
        startDate: twoYearsAgoGrantDate.toISOString().slice(0, 10).replaceAll('-', '/'),
        endDate: twoYearsAgoGrantDateNext.toISOString().slice(0, 10).replaceAll('-', '/'), // 次の付与日（期間の終了日として表示）
        usedDays: Math.round(twoYearsAgoUsedDays * 2) / 2,
        totalGranted: Math.round(twoYearsAgoTotalGranted * 2) / 2,
        carryOverDays: Math.round(carryOverDays * 2) / 2,
        carryOverToDate: twoYearsAgoGrantDate.toISOString().slice(0, 10).replaceAll('-', ''), // 繰越し先の日付
        newGrantDate: twoYearsAgoGrantDate.toISOString().slice(0, 10).replaceAll('-', ''),
        newGrantDays: Math.round(newGrantDays * 2) / 2,
        totalAtGrantDate: Math.round(totalAtGrantDate * 2) / 2,
        carryOverToNextPeriod: lastYearGrantDate ? lastYearGrantDate.toISOString().slice(0, 10).replaceAll('-', '') : null,
        carryOverToNextPeriodDays: lastYearGrantDate ? carryOverToLastYear : 0,
      }
    }

    // 昨年1年間のデータを取得
    let lastYearData: any = null
    if (lastYearGrantDate && lastYearGrantDateNext) {
      // 昨年1年間の使用日数を先に計算
      const lastYearRequests = await prisma.timeOffRequest.findMany({
        where: {
          employeeId,
          status: "APPROVED",
        },
      })
      const lastYearUsedDays = lastYearRequests
        .filter(req => {
          const reqStartDate = new Date(req.startDate)
          const reqEndDate = new Date(req.endDate)
          return (reqStartDate >= lastYearGrantDate && reqStartDate < lastYearGrantDateNext) ||
            (reqEndDate >= lastYearGrantDate && reqEndDate < lastYearGrantDateNext) ||
            (reqStartDate < lastYearGrantDate && reqEndDate >= lastYearGrantDateNext)
        })
        .reduce((sum, req) => sum + Number(req.totalDays || 0), 0)

      // 昨年の開始時点の繰越し日数（一昨年期間終了時点での繰越し日数）
      // 一昨年期間終了時点での繰越し日数を使う（今期と同様のロジック）
      const carryOverDays = twoYearsAgoData?.carryOverToNextPeriodDays || 0

      // 昨年の付与ロットを取得（昨年の新付与日に作成されたロット）
      const lastYearLots = await prisma.grantLot.findMany({
        where: {
          employeeId,
          grantDate: {
            gte: new Date(lastYearGrantDate.getTime() - 24 * 60 * 60 * 1000), // 新付与日の前日以降
            lte: new Date(lastYearGrantDate.getTime() + 24 * 60 * 60 * 1000), // 新付与日の翌日まで
          },
        },
        orderBy: { grantDate: 'asc' },
      })

      // 昨年の新付与日数
      const newGrantLot = lastYearLots.find(lot => {
        const lotDate = new Date(lot.grantDate)
        const grantDate = new Date(lastYearGrantDate)
        return lotDate.getFullYear() === grantDate.getFullYear() &&
          lotDate.getMonth() === grantDate.getMonth() &&
          lotDate.getDate() === grantDate.getDate()
      })
      const newGrantDays = newGrantLot ? Number(newGrantLot.daysGranted) : 0

      // 昨年の時点総付与日数（繰越し+新付与）
      const totalAtGrantDate = carryOverDays + newGrantDays

      // 昨年の総付与数（繰越し+新付与）
      const lastYearTotalGranted = carryOverDays + newGrantDays

      // 昨年期間終了時点での繰越し日数（今期への繰越し）
      // LIFO方式：新付与日数から使用日数を引いた残りが繰越し
      const carryOverToCurrent = Math.max(0, newGrantDays - lastYearUsedDays)

      lastYearData = {
        startDate: lastYearGrantDate.toISOString().slice(0, 10).replaceAll('-', '/'),
        endDate: lastYearGrantDateNext.toISOString().slice(0, 10).replaceAll('-', '/'), // 次の付与日（期間の終了日として表示）
        usedDays: Math.round(lastYearUsedDays * 2) / 2,
        totalGranted: Math.round(lastYearTotalGranted * 2) / 2,
        carryOverDays: Math.round(carryOverDays * 2) / 2,
        carryOverToDate: lastYearGrantDate.toISOString().slice(0, 10).replaceAll('-', ''), // 繰越し先の日付
        newGrantDate: lastYearGrantDate.toISOString().slice(0, 10).replaceAll('-', ''),
        newGrantDays: Math.round(newGrantDays * 2) / 2,
        totalAtGrantDate: Math.round(totalAtGrantDate * 2) / 2,
        carryOverToNextPeriod: currentGrantDate ? currentGrantDate.toISOString().slice(0, 10).replaceAll('-', '') : null,
        carryOverToNextPeriodDays: currentGrantDate ? carryOverToCurrent : 0,
      }
    }

    // 今期1年間のデータを取得
    let currentYearData: any = null
    if (currentGrantDate && currentGrantDateNext) {
      // 今期1年間の使用日数を先に計算
      const currentYearRequests = await prisma.timeOffRequest.findMany({
        where: {
          employeeId,
          status: "APPROVED",
        },
      })
      const currentYearUsedDays = currentYearRequests
        .filter(req => {
          const reqStartDate = new Date(req.startDate)
          const reqEndDate = new Date(req.endDate)
          return (reqStartDate >= currentGrantDate && reqStartDate < currentGrantDateNext) ||
            (reqEndDate >= currentGrantDate && reqEndDate < currentGrantDateNext) ||
            (reqStartDate < currentGrantDate && reqEndDate >= currentGrantDateNext)
        })
        .reduce((sum, req) => sum + Number(req.totalDays || 0), 0)

      // 今期の開始時点の繰越し日数（昨年期間終了時点での繰越し日数）
      // 昨年期間終了時点での繰越し日数を使う
      const carryOverDays = lastYearData?.carryOverToNextPeriodDays || 0

      // 今期の付与ロットを取得（今期の新付与日に作成されたロット）
      const currentYearLots = await prisma.grantLot.findMany({
        where: {
          employeeId,
          grantDate: {
            gte: new Date(currentGrantDate.getTime() - 24 * 60 * 60 * 1000), // 新付与日の前日以降
            lte: new Date(currentGrantDate.getTime() + 24 * 60 * 60 * 1000), // 新付与日の翌日まで
          },
        },
        orderBy: { grantDate: 'asc' },
      })

      // 今期の新付与日数
      const newGrantLot = currentYearLots.find(lot => {
        const lotDate = new Date(lot.grantDate)
        const grantDate = new Date(currentGrantDate)
        return lotDate.getFullYear() === grantDate.getFullYear() &&
          lotDate.getMonth() === grantDate.getMonth() &&
          lotDate.getDate() === grantDate.getDate()
      })
      const newGrantDays = newGrantLot ? Number(newGrantLot.daysGranted) : 0

      // 今期の時点総付与日数（繰越し+新付与）
      const totalAtGrantDate = carryOverDays + newGrantDays

      // 今期の総付与数（繰越し+新付与）
      const currentYearTotalGranted = carryOverDays + newGrantDays

      // 今期期間終了時点での繰越し日数（来期への繰越し）
      // LIFO方式：新付与日数から使用日数を引いた残りが繰越し
      const nextGrantDate = currentGrantDateNext
      const carryOverToNext = nextGrantDate ? Math.max(0, newGrantDays - currentYearUsedDays) : 0

      currentYearData = {
        startDate: currentGrantDate.toISOString().slice(0, 10).replaceAll('-', '/'),
        endDate: currentGrantDateNext.toISOString().slice(0, 10).replaceAll('-', '/'), // 次の付与日（期間の終了日として表示）
        usedDays: Math.round(currentYearUsedDays * 2) / 2,
        totalGranted: Math.round(currentYearTotalGranted * 2) / 2,
        carryOverDays: Math.round(carryOverDays * 2) / 2,
        carryOverToDate: currentGrantDate.toISOString().slice(0, 10).replaceAll('-', ''), // 繰越し先の日付
        newGrantDate: currentGrantDate.toISOString().slice(0, 10).replaceAll('-', ''),
        newGrantDays: Math.round(newGrantDays * 2) / 2,
        totalAtGrantDate: Math.round(totalAtGrantDate * 2) / 2,
        carryOverToNextPeriod: nextGrantDate ? nextGrantDate.toISOString().slice(0, 10).replaceAll('-', '') : null,
        carryOverToNextPeriodDays: nextGrantDate ? carryOverToNext : 0,
      }
    }

    // 来期のデータを取得
    let nextYearData: any = null
    if (currentGrantDateNext) {
      // 来期の開始付与日は現在の付与日の次（currentGrantDateNext）
      const nextYearGrantDate = currentGrantDateNext
      // 来期の終了日（次の次の付与日）
      const nextYearGrantDateNext = getNextGrantDate(joinDate, cfg, nextYearGrantDate)

      // 来期の予定付与日数を計算
      const yearsAtNextGrant = diffInYearsHalfStep(joinDate, nextYearGrantDate)
      const nextGrantDays = chooseGrantDaysForEmployee(employee.vacationPattern, yearsAtNextGrant, cfg)

      // 今期から来期への繰越予定日数
      // LIFO方式：今期の新付与日数から今期の使用日数を引いた残りが繰越
      const currentYearUsedDays = currentYearData?.usedDays || 0
      const currentYearNewGrantDays = currentYearData?.newGrantDays || 0
      const carryOverToNextYear = Math.max(0, currentYearNewGrantDays - currentYearUsedDays)

      // 来期の総付与予定数 = 繰越予定 + 新付与予定
      const nextYearTotalGranted = carryOverToNextYear + nextGrantDays

      // 来期の申請中日数を取得
      const nextYearPendingRequests = await prisma.timeOffRequest.findMany({
        where: {
          employeeId,
          status: 'PENDING',
          startDate: { gte: nextYearGrantDate },
        },
      })
      const nextYearPendingDays = nextYearPendingRequests.reduce(
        (sum, req) => sum + Number(req.totalDays || 0),
        0
      )

      nextYearData = {
        startDate: nextYearGrantDate.toISOString().slice(0, 10).replaceAll('-', '/'),
        endDate: nextYearGrantDateNext ? nextYearGrantDateNext.toISOString().slice(0, 10).replaceAll('-', '/') : null,
        usedDays: 0, // 来期はまだ使用日数がない
        pendingDays: Math.round(nextYearPendingDays * 2) / 2,
        totalGranted: Math.round(nextYearTotalGranted * 2) / 2,
        carryOverDays: Math.round(carryOverToNextYear * 2) / 2,
        carryOverToDate: nextYearGrantDate.toISOString().slice(0, 10).replaceAll('-', ''),
        newGrantDate: nextYearGrantDate.toISOString().slice(0, 10).replaceAll('-', ''),
        newGrantDays: Math.round(nextGrantDays * 2) / 2,
        totalAtGrantDate: Math.round(nextYearTotalGranted * 2) / 2,
      }
    }

    // periods配列を構築（3期前以降の追加期間も含む）
    const periods: Array<{
      label: string
      periodKey: string
      startDate: string
      endDate: string | null
      usedDays: number
      pendingDays?: number
      totalGranted: number
      carryOverDays: number
      newGrantDate: string
      newGrantDays: number
      totalAtGrantDate: number
      carryOverToNextPeriod?: string | null
      carryOverToNextPeriodDays?: number
    }> = []

    // 来期データを追加
    if (nextYearData) {
      periods.push({
        label: '来期',
        periodKey: 'next',
        ...nextYearData,
      })
    }

    // 今期データを追加
    if (currentYearData) {
      periods.push({
        label: '今期',
        periodKey: 'current',
        ...currentYearData,
      })
    }

    // 昨年データを追加
    if (lastYearData) {
      periods.push({
        label: '昨年',
        periodKey: 'last',
        ...lastYearData,
      })
    }

    // 一昨年データを追加
    if (twoYearsAgoData) {
      periods.push({
        label: '一昨年',
        periodKey: 'twoYearsAgo',
        ...twoYearsAgoData,
      })
    }

    // 3期前以降のデータを追加（最大10期前まで）
    let prevGrantDate = twoYearsAgoGrantDate
    let prevPeriodData = twoYearsAgoData
    let periodCount = 3 // 3期前から開始

    while (prevGrantDate && periodCount <= 10) {
      // さらに1つ前の付与日を取得
      const olderGrantDate = getPreviousGrantDate(joinDate, cfg, new Date(prevGrantDate.getTime() - 1))
      if (!olderGrantDate) break

      // 入社日より前なら終了
      if (olderGrantDate < new Date(joinDate.getTime() - 30 * 24 * 60 * 60 * 1000)) break

      const olderGrantDateNext = getNextGrantDate(joinDate, cfg, olderGrantDate)
      if (!olderGrantDateNext) break

      // この期間の使用日数を計算
      const olderRequests = await prisma.timeOffRequest.findMany({
        where: { employeeId, status: "APPROVED" },
      })
      const olderUsedDays = olderRequests
        .filter(req => {
          const s = new Date(req.startDate)
          const e = new Date(req.endDate)
          return (s >= olderGrantDate && s < olderGrantDateNext) ||
            (e >= olderGrantDate && e < olderGrantDateNext) ||
            (s < olderGrantDate && e >= olderGrantDateNext)
        })
        .reduce((sum, req) => sum + Number(req.totalDays || 0), 0)

      // 繰越し日数を計算
      const olderCarryOverDays = await calculateCarryOverDaysAtGrantDate(employeeId, olderGrantDate)

      // 付与ロットを取得
      const olderLots = await prisma.grantLot.findMany({
        where: {
          employeeId,
          grantDate: {
            gte: new Date(olderGrantDate.getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(olderGrantDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { grantDate: 'asc' },
      })
      const olderLot = olderLots.find(lot => {
        const d = new Date(lot.grantDate)
        return d.getFullYear() === olderGrantDate.getFullYear() &&
          d.getMonth() === olderGrantDate.getMonth() &&
          d.getDate() === olderGrantDate.getDate()
      })
      const olderNewGrantDays = olderLot ? Number(olderLot.daysGranted) : 0
      const olderTotalAtGrantDate = olderCarryOverDays + olderNewGrantDays
      const olderCarryOverOut = Math.max(0, olderNewGrantDays - olderUsedDays)

      periods.push({
        label: `${periodCount}期前`,
        periodKey: `minus${periodCount}`,
        startDate: olderGrantDate.toISOString().slice(0, 10).replaceAll('-', '/'),
        endDate: olderGrantDateNext.toISOString().slice(0, 10).replaceAll('-', '/'),
        usedDays: Math.round(olderUsedDays * 2) / 2,
        totalGranted: Math.round(olderTotalAtGrantDate * 2) / 2,
        carryOverDays: Math.round(olderCarryOverDays * 2) / 2,
        newGrantDate: olderGrantDate.toISOString().slice(0, 10).replaceAll('-', ''),
        newGrantDays: Math.round(olderNewGrantDays * 2) / 2,
        totalAtGrantDate: Math.round(olderTotalAtGrantDate * 2) / 2,
        carryOverToNextPeriod: prevGrantDate ? prevGrantDate.toISOString().slice(0, 10).replaceAll('-', '') : null,
        carryOverToNextPeriodDays: Math.round(olderCarryOverOut * 2) / 2,
      })

      prevGrantDate = olderGrantDate
      prevPeriodData = periods[periods.length - 1]
      periodCount++
    }

    return NextResponse.json({
      // 既存の互換性を維持
      twoYearsAgo: twoYearsAgoData,
      lastYear: lastYearData,
      currentYear: currentYearData,
      nextYear: nextYearData,
      // 新規: periods配列（動的プルダウン用）
      periods,
    })
  } catch (error: any) {
    console.error("GET /api/vacation/grant-calculation/[employeeId] error", error)
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
    })
    return NextResponse.json({
      error: "計算詳細取得に失敗しました",
      details: error?.message || "Unknown error"
    }, { status: 500 })
  }
}

