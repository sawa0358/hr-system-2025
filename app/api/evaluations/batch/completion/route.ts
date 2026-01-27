
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: 完工実績入力用の社員一覧と現在の実績値を取得
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateStr = searchParams.get('date') // yyyy-MM-dd
        const teamIdParam = searchParams.get('teamId')
        const query = searchParams.get('query') || ''

        const employeeId = request.headers.get('x-employee-id')
        const employeeRole = request.headers.get('x-employee-role')

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

        // 権限による制限
        if (employeeRole === 'store_manager' && employeeId) {
            const currentUser = await prisma.employee.findUnique({
                where: { id: employeeId },
                select: { personnelEvaluationTeamId: true }
            })
            if (currentUser?.personnelEvaluationTeamId) {
                whereClause.personnelEvaluationTeamId = currentUser.personnelEvaluationTeamId
            } else {
                // チーム未設定の店長は誰も見れない
                return NextResponse.json([])
            }
        } else if (teamIdParam && teamIdParam !== 'all') {
            whereClause.personnelEvaluationTeamId = teamIdParam
        }

        if (query) {
            whereClause.AND = [
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

        const employeeId = request.headers.get('x-employee-id')
        const employeeRole = request.headers.get('x-employee-role')

        if (!date || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const period = date.slice(0, 7)
        // const updatedCount = 0 // This variable is no longer used after the transaction change.

        // トランザクションで一括処理したいが、Upsertが必要なのでループ処理
        // パフォーマンス懸念がある場合は $transaction で囲む

        // 店長の場合のセキュリティチェック
        let allowedEmployeeIds: string[] | null = null
        if (employeeRole === 'store_manager' && employeeId) {
            const currentUser = await prisma.employee.findUnique({
                where: { id: employeeId },
                select: { personnelEvaluationTeamId: true }
            })
            if (currentUser?.personnelEvaluationTeamId) {
                const teamMembers = await prisma.employee.findMany({
                    where: { personnelEvaluationTeamId: currentUser.personnelEvaluationTeamId },
                    select: { id: true }
                })
                allowedEmployeeIds = teamMembers.map(m => m.id)
            } else {
                return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
            }
        }

        await prisma.$transaction(
            items.filter((item: any) => {
                if (allowedEmployeeIds) {
                    return allowedEmployeeIds.includes(item.employeeId)
                }
                return true
            }).map((item: any) => {
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
