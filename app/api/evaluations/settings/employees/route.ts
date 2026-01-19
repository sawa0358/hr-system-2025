
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: 社員の評価設定一覧を取得
export async function GET(request: Request) {
    try {
        const employees = await prisma.employee.findMany({
            where: {
                status: 'active',
                isPersonnelEvaluationTarget: true
            },
            select: {
                id: true,
                name: true,
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
                    // 最新の目標などのフィルタリングが必要だが、
                    // ここではとりあえず全目標を取得して、クライアントまたはサーバー側で現在の期間のものをフィルタする想定
                    // 簡易的に直近のものを取得するか、期間指定パラメータを受け取るべき。
                    // 現状は "period" フィールドがあるので、現在の月/期に一致するものが必要。
                    // ひとまず最新1件を取得する形にするか、あるいは期間指定ロジックを入れる。
                    // User Request: "Phase 1... UI shows monthly/term goals".
                    // Let's grab goals for current period if possible.
                    // For now, return recent ones.
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                employeeNumber: 'asc' // or ID
            }
        })

        // 整形
        const formatted = employees.map(emp => {
            const goal = emp.personnelEvaluationGoals[0]
            return {
                id: emp.id,
                name: emp.name,
                teamId: emp.personnelEvaluationTeam?.id || null, // UI Select用
                teamName: emp.personnelEvaluationTeam?.name || '未所属',
                patternId: emp.personnelEvaluationPattern?.id || null, // UI Select用
                patternName: emp.personnelEvaluationPattern?.name || '未設定',
                hasGoals: !!goal,
                contractGoal: goal ? Number(goal.contractTargetAmount) : 0,
                completionGoal: goal ? Number(goal.completionTargetAmount) : 0,
                // period: goal?.period // 前回の期間
            }
        })

        return NextResponse.json(formatted)

    } catch (error) {
        console.error('GET /api/evaluations/settings/employees error:', error)
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }
}
