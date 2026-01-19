
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: 社員の評価設定一覧を取得、または特定社員の詳細を取得
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (id) {
            // 特定社員の詳細取得 (Entry画面などで使用)
            const employee = await prisma.employee.findUnique({
                where: { id },
                include: {
                    personnelEvaluationTeam: true,
                    personnelEvaluationPattern: true,
                    personnelEvaluationGoals: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            })

            if (!employee) {
                return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
            }

            return NextResponse.json(employee)
        }

        // 一覧取得
        const employees = await prisma.employee.findMany({
            where: {
                status: 'active',
                isPersonnelEvaluationTarget: true
            },
            include: {
                personnelEvaluationTeam: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                personnelEvaluationPattern: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                personnelEvaluationGoals: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                employeeNumber: 'asc'
            }
        })

        // 整形
        const formatted = employees.map((emp: any) => {
            const goal = emp.personnelEvaluationGoals[0]
            return {
                id: emp.id,
                name: emp.name,
                teamId: emp.personnelEvaluationTeam?.id || null, // UI Select用
                teamName: emp.personnelEvaluationTeam?.name || '未所属',
                patternId: emp.personnelEvaluationPattern?.id || null, // UI Select用
                patternName: emp.personnelEvaluationPattern?.name || '未設定',
                hasGoals: emp.isNumericGoalEnabled,
                contractGoal: goal ? Number(goal.contractTargetAmount) : 0,
                completionGoal: goal ? Number(goal.completionTargetAmount) : 0,
            }
        })

        return NextResponse.json(formatted)

    } catch (error) {
        console.error('GET /api/evaluations/settings/employees error:', error)
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }
}
