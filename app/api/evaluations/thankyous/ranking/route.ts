import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ありがとうランキングを取得
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const teamId = searchParams.get('teamId') // チームフィルタ

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
        }

        // 日付範囲を作成
        const startDateObj = new Date(startDate)
        startDateObj.setHours(0, 0, 0, 0)
        const endDateObj = new Date(endDate)
        endDateObj.setHours(23, 59, 59, 999)

        // 評価対象の社員を取得
        const employeeFilter: any = {
            isPersonnelEvaluationTarget: true,
            status: 'active'
        }
        if (teamId && teamId !== 'all') {
            employeeFilter.personnelEvaluationTeamId = teamId
        }

        const employees = await prisma.employee.findMany({
            where: employeeFilter,
            select: {
                id: true,
                name: true,
                personnelEvaluationTeam: {
                    select: { id: true, name: true }
                }
            }
        })

        const employeeMap = new Map(employees.map(e => [e.id, e]))
        const employeeIds = employees.map(e => e.id)

        // 送信した「ありがとう」を取得
        const sentItems = await prisma.personnelEvaluationSubmissionItem.findMany({
            where: {
                title: 'ありがとう送信',
                submission: {
                    employeeId: { in: employeeIds },
                    date: {
                        gte: startDateObj,
                        lte: endDateObj
                    }
                }
            },
            select: {
                id: true,
                points: true,
                thankYouTo: true,
                textValue: true, // recipientType
                submission: {
                    select: {
                        employeeId: true
                    }
                }
            }
        })

        // 全期間中に送られた「ありがとう」を取得（受信集計用）
        const allSentItems = await prisma.personnelEvaluationSubmissionItem.findMany({
            where: {
                title: 'ありがとう送信',
                submission: {
                    date: {
                        gte: startDateObj,
                        lte: endDateObj
                    }
                }
            },
            select: {
                id: true,
                points: true,
                thankYouTo: true,
                textValue: true,
                submission: {
                    select: {
                        employeeId: true
                    }
                }
            }
        })

        // 送信集計
        const sentStats: { [employeeId: string]: { pts: number, count: number } } = {}
        employeeIds.forEach(id => {
            sentStats[id] = { pts: 0, count: 0 }
        })

        sentItems.forEach(item => {
            const senderId = item.submission.employeeId
            if (sentStats[senderId]) {
                sentStats[senderId].pts += item.points || 0
                sentStats[senderId].count += 1
            }
        })

        // 受信集計
        const receivedStats: { [employeeId: string]: { pts: number, count: number } } = {}
        employeeIds.forEach(id => {
            receivedStats[id] = { pts: 0, count: 0 }
        })

        allSentItems.forEach(item => {
            try {
                const toIds = JSON.parse(item.thankYouTo || '[]')
                const recipientType = item.textValue || 'individual'

                if (Array.isArray(toIds)) {
                    // 個人・チーム・全員宛てすべて同様に処理
                    toIds.forEach(toId => {
                        if (receivedStats[toId]) {
                            receivedStats[toId].pts += item.points || 0
                            receivedStats[toId].count += 1
                        }
                    })
                }
            } catch (e) {
                // JSONパースエラーは無視
            }
        })

        // ランキングデータを作成
        const ranking = employeeIds.map(id => {
            const employee = employeeMap.get(id)
            return {
                id,
                name: employee?.name || '不明',
                teamId: employee?.personnelEvaluationTeam?.id || null,
                teamName: employee?.personnelEvaluationTeam?.name || null,
                received: {
                    pts: receivedStats[id]?.pts || 0,
                    count: receivedStats[id]?.count || 0
                },
                sent: {
                    pts: sentStats[id]?.pts || 0,
                    count: sentStats[id]?.count || 0
                }
            }
        })

        // 受信ポイント順にソート（同点の場合は受信数で）
        ranking.sort((a, b) => {
            if (b.received.pts !== a.received.pts) {
                return b.received.pts - a.received.pts
            }
            return b.received.count - a.received.count
        })

        // チーム一覧を取得（フィルター用）
        const teams = await prisma.personnelEvaluationTeam.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true }
        })

        return NextResponse.json({
            ranking,
            teams,
            period: {
                start: startDate,
                end: endDate
            },
            totalEmployees: ranking.length
        })
    } catch (error) {
        console.error('GET /api/evaluations/thankyous/ranking error:', error)
        return NextResponse.json({ error: 'Failed to fetch ranking' }, { status: 500 })
    }
}
