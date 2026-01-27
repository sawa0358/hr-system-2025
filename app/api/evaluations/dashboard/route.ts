
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateStr = searchParams.get('date') // Selected Date e.g. 2026-01-06
        const teamId = searchParams.get('teamId')
        const employeeId = searchParams.get('employeeId')
        const storeManagerTeamId = searchParams.get('storeManagerTeamId') // 店長用チームフィルタ

        if (!dateStr) return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        const selectedDate = new Date(dateStr)
        const selectedMonthStart = startOfMonth(selectedDate)
        const selectedMonthEnd = endOfMonth(selectedDate)

        // 1. 今年度の期間を取得
        // 選択された日付が含まれる年度を探す
        let fiscalYear = await prisma.personnelEvaluationFiscalYear.findFirst({
            where: {
                startDate: { lte: selectedDate },
                endDate: { gte: selectedDate }
            }
        })

        // 設定がなければ4月開始の標準年度と仮定
        let fyStart: Date, fyEnd: Date
        if (fiscalYear) {
            fyStart = fiscalYear.startDate
            fyEnd = fiscalYear.endDate
        } else {
            const year = selectedDate.getFullYear()
            const month = selectedDate.getMonth() + 1
            const startYear = month >= 4 ? year : year - 1
            fyStart = new Date(startYear, 3, 1) // 4/1
            fyEnd = new Date(startYear + 1, 2, 31) // 3/31
        }

        // 2. カレンダーデータの取得（今月の提出数集計）
        const submissionCriteria: any = {
            date: {
                gte: selectedMonthStart,
                lte: selectedMonthEnd
            }
        }
        if (employeeId) {
            submissionCriteria.employeeId = employeeId
        }
        // 店長用フィルタ
        if (storeManagerTeamId) {
            const teamEmployees = await prisma.employee.findMany({
                where: { personnelEvaluationTeamId: storeManagerTeamId },
                select: { id: true }
            })
            submissionCriteria.employeeId = { in: teamEmployees.map(e => e.id) }
        }

        const monthlySubmissions = await prisma.personnelEvaluationSubmission.groupBy({
            by: ['date'],
            where: submissionCriteria,
            _count: {
                id: true
            }
        })

        const calendarStats: Record<string, { count: number, hasReceivedThankYou: boolean, thankYouCount: number }> = {}

        // ありがとう受信アイテムの取得 (対象社員がいる場合のみ)
        const receivedThankYouDates = new Set<string>()
        if (employeeId) {
            const receivedItems = await prisma.personnelEvaluationSubmissionItem.findMany({
                where: {
                    submission: {
                        date: {
                            gte: selectedMonthStart,
                            lte: selectedMonthEnd
                        }
                    },
                    title: 'ありがとう送信',
                    thankYouTo: {
                        contains: employeeId
                    }
                },
                select: {
                    thankYouTo: true,
                    submission: {
                        select: { date: true }
                    }
                }
            })

            receivedItems.forEach(item => {
                try {
                    // IDが確実に含まれているかチェック (JSON配列または単一文字列)
                    const to = JSON.parse(item.thankYouTo || '[]')
                    let isReceived = false
                    if (Array.isArray(to)) {
                        if (to.includes(employeeId)) isReceived = true
                    } else if (typeof to === 'string') {
                        if (to === employeeId) isReceived = true
                    }

                    if (isReceived) {
                        const d = item.submission.date.toISOString().split('T')[0]
                        receivedThankYouDates.add(d)
                    }
                } catch (e) {
                    // JSONパースエラー時はcontainsの結果を信じる（レガシー互換）
                    const d = item.submission.date.toISOString().split('T')[0]
                    receivedThankYouDates.add(d)
                }
            })
        }

        // ありがとう送信アイテムの日付別カウント（管理者ダッシュボード用）
        const thankYouItems = await prisma.personnelEvaluationSubmissionItem.findMany({
            where: {
                submission: {
                    date: {
                        gte: selectedMonthStart,
                        lte: selectedMonthEnd
                    },
                    ...(storeManagerTeamId ? {
                        employee: { personnelEvaluationTeamId: storeManagerTeamId }
                    } : {})
                },
                title: 'ありがとう送信'
            },
            select: {
                submission: {
                    select: { date: true }
                }
            }
        })

        const thankYouCountByDate = new Map<string, number>()
        thankYouItems.forEach(item => {
            const d = item.submission.date.toISOString().split('T')[0]
            thankYouCountByDate.set(d, (thankYouCountByDate.get(d) || 0) + 1)
        })

        // 月の日数をループして初期化（データがない日もオブジェクトを作るため）
        const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i)
            const dStr = d.toISOString().split('T')[0]
            calendarStats[dStr] = { count: 0, hasReceivedThankYou: false, thankYouCount: 0 }
        }

        // 提出数を反映
        monthlySubmissions.forEach(item => {
            const d = item.date.toISOString().split('T')[0]
            if (calendarStats[d]) {
                calendarStats[d].count = item._count.id
            }
        })

        // ありがとう受信フラグを反映
        receivedThankYouDates.forEach(d => {
            if (calendarStats[d]) {
                calendarStats[d].hasReceivedThankYou = true
            }
        })

        // ありがとう数を反映
        thankYouCountByDate.forEach((count, d) => {
            if (calendarStats[d]) {
                calendarStats[d].thankYouCount = count
            }
        })

        // 3. 社員リストの取得
        // 店長の場合は自分のチームのメンバーのみ表示
        const effectiveTeamId = storeManagerTeamId || teamId
        const employees = await prisma.employee.findMany({
            where: {
                status: 'active',
                isPersonnelEvaluationTarget: true,
                ...(effectiveTeamId ? { personnelEvaluationTeamId: effectiveTeamId } : {})
            },
            select: {
                id: true,
                name: true,
                personnelEvaluationTeam: { select: { name: true } }
            },
            orderBy: { employeeNumber: 'asc' }
        })

        if (employees.length === 0) {
            // 対象者がいない場合は空のリスト
        }

        const employeeIds = employees.map(e => e.id)

        // 4. ポイント集計（一括取得）

        // 当日ポイント
        const dailyPoints = await prisma.personnelEvaluationPointLog.groupBy({
            by: ['employeeId'],
            where: {
                date: selectedDate, // 時間部分を合わせる必要があるか？ PrismaのDateTimeは等価比較が厳しい場合がある
                // dateはPointLogではDateTimeだが、通常保存時に正規化(00:00:00)していればOK。
                // Submissions APIでは時間を正規化(setHours(0,0,0,0))して保存している。
                // しかし念のため範囲検索にするのが無難だが、groupByが使えなくなるので、
                // ここでは保存側が正規化されている前提で、selectedDate自体の正規化を行う。
            },
            _sum: { points: true }
        })

        // 今月ポイント
        const monthlyPoints = await prisma.personnelEvaluationPointLog.groupBy({
            by: ['employeeId'],
            where: {
                date: {
                    gte: selectedMonthStart,
                    lte: selectedMonthEnd
                }
            },
            _sum: { points: true }
        })

        // 今年度ポイント
        const fyPoints = await prisma.personnelEvaluationPointLog.groupBy({
            by: ['employeeId'],
            where: {
                date: {
                    gte: fyStart,
                    lte: fyEnd
                }
            },
            _sum: { points: true }
        })

        // マップ化
        const mapPoints = (arr: any[]) => {
            const m = new Map<string, number>()
            arr.forEach(a => m.set(a.employeeId, a._sum.points || 0))
            return m
        }
        const dailyMap = mapPoints(dailyPoints)
        const monthlyMap = mapPoints(monthlyPoints)
        const fyMap = mapPoints(fyPoints)

        // 5. 当日の提出状況取得
        const submissions = await prisma.personnelEvaluationSubmission.findMany({
            where: {
                date: selectedDate,
                employeeId: { in: employeeIds }
            },
            select: {
                employeeId: true,
                createdAt: true,
                status: true,
                note: true,
                items: {
                    where: { textValue: { not: null } },
                    select: { textValue: true }
                }
            }
        })
        const submissionMap = new Map()
        submissions.forEach(s => submissionMap.set(s.employeeId, s))

        // 6. データ結合
        const tableData = employees.map(emp => {
            const sub = submissionMap.get(emp.id)
            const pts = {
                daily: dailyMap.get(emp.id) || 0,
                monthly: monthlyMap.get(emp.id) || 0,
                fy: fyMap.get(emp.id) || 0
            }

            // コメント抽出（備考 + テキスト項目）
            const comments: string[] = []
            if (sub) {
                if (sub.note) comments.push(sub.note)
                sub.items.forEach((i: any) => {
                    if (i.textValue) comments.push(i.textValue)
                })
            }
            if (comments.length === 0 && sub) comments.push('記入なし')

            let displayStatus = '未登録'
            if (sub) {
                if (sub.status === 'approved') {
                    displayStatus = '承認済み'
                } else {
                    displayStatus = '登録済'
                }
            }

            return {
                id: emp.id,
                name: emp.name,
                team: emp.personnelEvaluationTeam?.name || '未所属',
                status: displayStatus,
                rawStatus: sub?.status || 'none',
                statusDate: sub ? sub.createdAt.toISOString().slice(5, 10).replace('-', '/') : '-', // MM/DD
                dailyPt: `${pts.daily.toLocaleString()}pt`,
                monthlyPt: `${pts.monthly.toLocaleString()}pt`,
                fyPt: `${pts.fy.toLocaleString()}pt`,
                comments: comments
            }
        })

        // ... (existing code)

        // 7. 目標数値の集計 (Stats)
        const aggregateGoals = async (start: Date, end: Date, filterEmployeeIds: string[]) => {
            const periods = []

            // Generate list of periods (yyyy-MM) from start to end
            // Use local date methods to construct strings properly
            let currentY = start.getFullYear()
            let currentM = start.getMonth() // 0-11

            const endY = end.getFullYear()
            const endM = end.getMonth() // 0-11

            // Loop until current month is past end month
            while (currentY < endY || (currentY === endY && currentM <= endM)) {
                periods.push(`${currentY}-${String(currentM + 1).padStart(2, '0')}`)

                currentM++
                if (currentM > 11) {
                    currentM = 0
                    currentY++
                }
            }

            // console.log(`Aggregating goals for periods: ${periods.join(', ')}`)

            const goals = await prisma.personnelEvaluationGoal.findMany({
                where: {
                    period: { in: periods },
                    employeeId: { in: filterEmployeeIds }
                }
            })

            let cTarget = 0, cAchieved = 0
            let compTarget = 0, compAchieved = 0

            goals.forEach((g: any) => {
                cTarget += Number(g.contractTargetAmount)
                cAchieved += Number(g.contractAchievedAmount)
                compTarget += Number(g.completionTargetAmount)
                compAchieved += Number(g.completionAchievedAmount)
            })

            return {
                contract: { target: cTarget, achieved: cAchieved, rate: cTarget ? ((cAchieved / cTarget) * 100).toFixed(1) : '0.0' },
                completion: { target: compTarget, achieved: compAchieved, rate: compTarget ? ((compAchieved / compTarget) * 100).toFixed(1) : '0.0' }
            }
        }

        // Current Month
        const currentMonthStats = await aggregateGoals(selectedMonthStart, selectedMonthEnd, employeeIds)

        // 2 Months Ago (Label remains 2 months ago, but we aggregate CURRENT month's completion data as per requirement)
        const twoMonthsAgoStart = new Date(selectedMonthStart)
        twoMonthsAgoStart.setMonth(twoMonthsAgoStart.getMonth() - 2)
        // const twoMonthsAgoEnd = endOfMonth(twoMonthsAgoStart)
        // User request: "Completion amount entered in individual screen (current month) should be aggregated in the middle section"
        // So we use current month data for this section's stats.
        const twoMonthsAgoStats = await aggregateGoals(selectedMonthStart, selectedMonthEnd, employeeIds)

        // Fiscal Year (Current)
        const fyStats = await aggregateGoals(fyStart, fyEnd, employeeIds)

        return NextResponse.json({
            calendar: calendarStats,
            table: tableData,
            periodLabel: format(selectedDate, 'yyyy年M月'),
            fiscalYearLabel: fiscalYear ? fiscalYear.name : `${fyStart.getFullYear()}年度`,
            stats: {
                currentMonth: currentMonthStats,
                twoMonthsAgo: twoMonthsAgoStats,
                fiscalYear: fyStats
            }
        })
    } catch (error) {
        // ...
        console.error('GET /api/evaluations/dashboard error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}
