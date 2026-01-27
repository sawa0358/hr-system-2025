
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: 完工実績入力用の社員一覧と現在の実績値を取得
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateStr = searchParams.get('date') // yyyy-MM-dd
        const teamId = searchParams.get('teamId')
        const query = searchParams.get('query') || ''

        if (!dateStr) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        }

        // Period生成 (yyyy-MM-dd -> yyyy-MM)
        // ここでは単純に文字列操作で生成（ローカルタイム依存を避ける）
        const period = dateStr.slice(0, 7)

        const whereClause: any = {
            status: 'active',
            isPersonnelEvaluationTarget: true,
            isNumericGoalEnabled: true,
        }

        if (teamId && teamId !== 'all') {
            whereClause.personnelEvaluationTeamId = teamId
        }

        if (query) {
            whereClause.OR = [
                { name: { contains: query } },
                { employeeNumber: { contains: query } }
            ]
        }

        const employees = await prisma.employee.findMany({
            where: whereClause,
            include: {
                personnelEvaluationTeam: {
                    select: { name: true }
                },
                // 指定期間のGoalを取得
                personnelEvaluationGoals: {
                    where: {
                        period: period
                    },
                    take: 1
                }
            },
            orderBy: [
                { personnelEvaluationTeamId: 'asc' },
                { employeeNumber: 'asc' }
            ]
        })

        // 整形
        const formatted = employees.map((emp: any) => {
            const goal = emp.personnelEvaluationGoals[0]
            return {
                id: emp.id,
                name: emp.name,
                teamName: emp.personnelEvaluationTeam?.name || '未所属',
                period: period, // 確認用
                contractTarget: goal ? Number(goal.contractTargetAmount) : 0,
                contractAchieved: goal ? Number(goal.contractAchievedAmount) : 0,
                completionTarget: goal ? Number(goal.completionTargetAmount) : 0,
                completionAchieved: goal ? Number(goal.completionAchievedAmount) : 0,
                goalId: goal ? goal.id : null
            }
        })

        return NextResponse.json(formatted)

    } catch (error) {
        console.error('GET /api/evaluations/batch/completion error:', error)
        return NextResponse.json({ error: 'Failed to fetch batch data' }, { status: 500 })
    }
}

// POST: 完工実績の一括更新
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { date, items } = body // items: { employeeId: string, amount: number }[]

        if (!date || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const period = date.slice(0, 7)
        const updatedCount = 0

        // トランザクションで一括処理したいが、Upsertが必要なのでループ処理
        // パフォーマンス懸念がある場合は $transaction で囲む

        await prisma.$transaction(
            items.map((item: any) => {
                // 文字列で受け取るかもしれないので数値化
                const amount = item.amount === '' ? 0 : Number(item.amount)

                return prisma.personnelEvaluationGoal.upsert({
                    where: {
                        employeeId_period: {
                            employeeId: item.employeeId,
                            period: period
                        }
                    },
                    create: {
                        employeeId: item.employeeId,
                        period: period,
                        completionAchievedAmount: amount,
                        // 他はデフォルト0
                    },
                    update: {
                        completionAchievedAmount: amount
                    }
                })
            })
        )

        return NextResponse.json({ success: true, count: items.length })

    } catch (error) {
        console.error('POST /api/evaluations/batch/completion error:', error)
        return NextResponse.json({ error: 'Failed to update batch data' }, { status: 500 })
    }
}
