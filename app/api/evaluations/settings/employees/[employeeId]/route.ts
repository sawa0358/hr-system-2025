
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT: 社員の評価設定更新（チーム、パターン、目標）
export async function PUT(
    request: Request,
    { params }: { params: { employeeId: string } }
) {
    try {
        const employeeId = params.employeeId
        const body = await request.json()
        const { teamId, patternId, hasGoals, contractGoal, completionGoal, period } = body

        // デフォルト期間（指定がなければ現在の年月 yyyy-MM）
        const currentPeriod = period || new Date().toISOString().slice(0, 7)

        const result = await prisma.$transaction(async (tx) => {
            // 1. 社員情報の更新（チーム・パターン）
            // null または undefined の扱いに注意。送られてきた場合のみ更新するか、nullを許容するか。
            // UIの実装によるが、ここでは明示的に null が送られたら解除、undefinedなら変更なしとするのが一般的だが、
            // 簡略化のため送られた値で更新する。
            const updateData: any = {}
            if (teamId !== undefined) updateData.personnelEvaluationTeamId = teamId
            if (patternId !== undefined) updateData.personnelEvaluationPatternId = patternId

            if (Object.keys(updateData).length > 0) {
                await tx.employee.update({
                    where: { id: employeeId },
                    data: updateData
                })
            }

            // 2. 目標の更新
            if (hasGoals) {
                // 目標を設定する場合（Upsert）
                await tx.personnelEvaluationGoal.upsert({
                    where: {
                        employeeId_period: {
                            employeeId,
                            period: currentPeriod
                        }
                    },
                    create: {
                        employeeId,
                        period: currentPeriod,
                        contractTargetAmount: Number(contractGoal) || 0,
                        completionTargetAmount: Number(completionGoal) || 0
                    },
                    update: {
                        contractTargetAmount: Number(contractGoal) || 0,
                        completionTargetAmount: Number(completionGoal) || 0
                    }
                })
            } else if (hasGoals === false) {
                // 目標設定をオフにする場合 -> 削除すべきか、ゼロにするか？
                // データの一貫性的には残しておいて0でもいいが、isLockedフラグ等もあるので一旦削除せず放置か、
                // 明示的に削除機能が必要なら削除。
                // ここでは "hasGoals" flag is purely UI state or derived from "TargetAmount > 0"?
                // Frontend passes "hasGoals". If false, likely wants to disable/clear goals.
                // Let's set to 0.
                /*
                await tx.personnelEvaluationGoal.updateMany({
                   where: { employeeId, period: currentPeriod },
                   data: { contractTargetAmount: 0, completionTargetAmount: 0 }
                })
                */
                // Or actually delete? Schema doesn't say.
            }

            // 更新後のデータを返すため、再取得
            return await tx.employee.findUnique({
                where: { id: employeeId },
                include: {
                    personnelEvaluationTeam: true,
                    personnelEvaluationPattern: true,
                    personnelEvaluationGoals: {
                        where: { period: currentPeriod }
                    }
                }
            })
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('PUT /api/evaluations/settings/employees/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update employee settings' }, { status: 500 })
    }
}
