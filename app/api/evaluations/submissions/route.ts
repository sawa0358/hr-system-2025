
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ヘルパー: 3日以上前か判定
function isLockedPastEntry(entryDate: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const target = new Date(entryDate)
    target.setHours(0, 0, 0, 0)

    // 差分日数
    const diffTime = today.getTime() - target.getTime()
    const diffDays = diffTime / (1000 * 3600 * 24)

    return diffDays >= 3
}

// GET: 指定日の提出データを取得
export async function GET(request: Request) {
    try {
        const requesterId = request.headers.get('x-employee-id')
        if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const dateStr = searchParams.get('date')
        let targetUserId = searchParams.get('userId') || requesterId // Default to self if not specified

        if (!dateStr) return NextResponse.json({ error: 'Date required' }, { status: 400 })

        // 権限チェック (他人のデータを見る場合)
        if (targetUserId !== requesterId) {
            const requester = await prisma.employee.findUnique({ where: { id: requesterId }, select: { role: true } })
            const allowedRoles = ['admin', 'hr', 'manager']
            if (!requester || !allowedRoles.includes(requester.role || '')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const date = new Date(dateStr)

        // 提出データ取得
        const submission = await prisma.personnelEvaluationSubmission.findUnique({
            where: {
                employeeId_date: {
                    employeeId: targetUserId,
                    date: date
                }
            },
            include: {
                items: true,
                photos: true
            }
        })

        // ロック状態判定
        const locked = isLockedPastEntry(date)

        return NextResponse.json({
            submission,
            isLocked: locked
        })

    } catch (error) {
        console.error('GET /api/evaluations/submissions error:', error)
        return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
    }
}

// POST: 提出データの保存
export async function POST(request: Request) {
    try {
        const requesterId = request.headers.get('x-employee-id')
        if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { date, items, thankYous, employeeId } = body
        // employeeId in body specifies target. If missing, assume self (requesterId).
        const targetUserId = employeeId || requesterId

        if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 })

        // 権限チェック (他人のデータを保存する場合)
        if (targetUserId !== requesterId) {
            const requester = await prisma.employee.findUnique({ where: { id: requesterId }, select: { role: true } })
            const allowedRoles = ['admin', 'hr', 'manager']
            if (!requester || !allowedRoles.includes(requester.role || '')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const targetDate = new Date(date)

        // 1. ロックチェック
        if (isLockedPastEntry(targetDate)) {
            // 権限チェック (ロック解除権限)
            // Note: 上記の「他人のデータ」チェックとは別に、ロック期間外の編集権限も確認
            const requester = await prisma.employee.findUnique({ where: { id: requesterId }, select: { role: true } })
            const bypassRoles = ['admin', 'hr', 'manager']

            if (!requester || !bypassRoles.includes(requester.role || '')) {
                return NextResponse.json({ error: 'この日付の日報は編集期間が過ぎているため変更できません' }, { status: 403 })
            }
        }

        // トランザクション処理
        const result = await prisma.$transaction(async (tx) => {
            // 2. Submission作成/更新
            const submission = await tx.personnelEvaluationSubmission.upsert({
                where: {
                    employeeId_date: {
                        employeeId: targetUserId,
                        date: targetDate
                    }
                },
                create: {
                    employeeId: targetUserId,
                    date: targetDate,
                    status: 'submitted'
                },
                update: {
                    status: 'submitted',
                    updatedAt: new Date()
                }
            })

            // 3. アイテムの更新（既存削除 -> 再作成）
            // SubmissionIDに紐づくアイテムを全削除
            await tx.personnelEvaluationSubmissionItem.deleteMany({
                where: { submissionId: submission.id }
            })

            // アイテム作成
            let totalChecklistPoints = 0

            // 通常アイテム
            if (Array.isArray(items)) {
                for (const item of items) {
                    const isChecked = !!item.checked
                    const points = Number(item.points) || 0

                    if (isChecked) {
                        totalChecklistPoints += points
                    }

                    await tx.personnelEvaluationSubmissionItem.create({
                        data: {
                            submissionId: submission.id,
                            itemId: item.itemId || null, // パターン項目ID
                            title: item.title || '',
                            points: points,
                            isChecked: isChecked,
                            textValue: item.textValue || null
                        }
                    })
                }
            }

            // ありがとうアイテム
            if (Array.isArray(thankYous)) {
                for (const ty of thankYous) {
                    await tx.personnelEvaluationSubmissionItem.create({
                        data: {
                            submissionId: submission.id,
                            title: 'ありがとう送信',
                            points: 5, // 送信ポイント？
                            isChecked: true,
                            thankYouTo: JSON.stringify(ty.to || []), // 配列をJSON化
                            thankYouMessage: ty.message || ''
                        }
                    })

                    // 送信者へのポイント加算ログ（送信サンクスポイント）
                    await tx.personnelEvaluationPointLog.create({
                        data: {
                            employeeId: targetUserId,
                            date: targetDate,
                            points: 5, // 送信ボーナス固定
                            type: 'thank_you_sent',
                            sourceId: submission.id // 簡易的にSubmissionID
                        }
                    })

                    // 受信者へのポイント加算ログ
                    if (Array.isArray(ty.to)) {
                        for (const recipientId of ty.to) {
                            await tx.personnelEvaluationPointLog.create({
                                data: {
                                    employeeId: recipientId,
                                    date: targetDate,
                                    points: 10, // 受信ボーナス？（仮）
                                    type: 'thank_you_received',
                                    sourceId: submission.id
                                }
                            })
                        }
                    }
                }
            }

            // 4. ポイントログの更新 (Checklist分)
            // まずこのユーザー・この日・Checklistタイプのログを削除
            await tx.personnelEvaluationPointLog.deleteMany({
                where: {
                    employeeId: targetUserId,
                    date: targetDate,
                    type: 'checklist'
                }
            })

            // 新しいポイントでログ作成
            if (totalChecklistPoints > 0) {
                await tx.personnelEvaluationPointLog.create({
                    data: {
                        employeeId: targetUserId,
                        date: targetDate,
                        points: totalChecklistPoints,
                        type: 'checklist',
                        sourceId: submission.id
                    }
                })
            }

            return submission
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('POST /api/evaluations/submissions error:', error)
        return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }
}
