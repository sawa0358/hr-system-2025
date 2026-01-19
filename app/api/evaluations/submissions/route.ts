
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

        // 追加: 月次ゴール情報の取得
        const period = dateStr.slice(0, 7)
        const goal = await prisma.personnelEvaluationGoal.findUnique({
            where: {
                employeeId_period: {
                    employeeId: targetUserId,
                    period: period
                }
            }
        })

        // ポイント集計 (当日、今月、今年度)
        // 今年度の計算: 4月始まりとする
        const year = date.getFullYear()
        const month = date.getMonth() + 1 // 1-12
        const fiscalYearStartYear = month >= 4 ? year : year - 1
        const fiscalYearStartDate = new Date(fiscalYearStartYear, 3, 1) // 4月1日
        const fiscalYearEndDate = new Date(fiscalYearStartYear + 1, 2, 31, 23, 59, 59) // 翌3月31日

        const startOfMonthDate = new Date(year, month - 1, 1)
        const endOfMonthDate = new Date(year, month, 0, 23, 59, 59)

        const startOfDayDate = new Date(year, month - 1, date.getDate(), 0, 0, 0)
        const endOfDayDate = new Date(year, month - 1, date.getDate(), 23, 59, 59)

        // 集計クエリの並列実行
        const [dailyPoints, monthlyPoints, yearlyPoints] = await Promise.all([
            // 当日
            prisma.personnelEvaluationPointLog.aggregate({
                _sum: { points: true },
                where: {
                    employeeId: targetUserId,
                    date: {
                        gte: startOfDayDate,
                        lte: endOfDayDate
                    }
                }
            }),
            // 今月
            prisma.personnelEvaluationPointLog.aggregate({
                _sum: { points: true },
                where: {
                    employeeId: targetUserId,
                    date: {
                        gte: startOfMonthDate,
                        lte: endOfMonthDate
                    }
                }
            }),
            // 今年度
            prisma.personnelEvaluationPointLog.aggregate({
                _sum: { points: true },
                where: {
                    employeeId: targetUserId,
                    date: {
                        gte: fiscalYearStartDate,
                        lte: fiscalYearEndDate
                    }
                }
            })
        ])

        return NextResponse.json({
            submission,
            goal,
            isLocked: locked,
            stats: {
                daily: dailyPoints._sum.points || 0,
                monthly: monthlyPoints._sum.points || 0,
                yearly: yearlyPoints._sum.points || 0
            }
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
        const { date, items, thankYous, employeeId, goals } = body
        // employeeId in body specifies target. If missing, assume self (requesterId).
        const targetUserId = employeeId || requesterId

        console.log(`[Submission POST] Start. requesterId=${requesterId}, targetUserId=${targetUserId}`)

        if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 })

        // 権限チェック (他人のデータを保存する場合)
        if (targetUserId !== requesterId) {
            const requester = await prisma.employee.findUnique({ where: { id: requesterId }, select: { role: true } })
            console.log(`[Submission POST] Proxy check. requesterRole=${requester?.role}`)

            const allowedRoles = ['admin', 'hr', 'manager']
            if (!requester || !allowedRoles.includes(requester.role || '')) {
                console.log(`[Submission POST] Proxy denied.`)
                return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
            }
        }

        const targetDate = new Date(date)

        // 1. ロックチェック
        const isLocked = isLockedPastEntry(targetDate)
        console.log(`[Submission POST] Lock check. date=${date}, isLocked=${isLocked}`)

        if (isLocked) {
            // 権限チェック (ロック解除権限)
            // Note: 上記の「他人のデータ」チェックとは別に、ロック期間外の編集権限も確認
            const requester = await prisma.employee.findUnique({ where: { id: requesterId }, select: { role: true } })
            const bypassRoles = ['admin', 'hr', 'manager']

            console.log(`[Submission POST] Lock bypass check. requesterRole=${requester?.role}`)

            if (!requester || !bypassRoles.includes(requester.role || '')) {
                console.log(`[Submission POST] Lock bypass denied.`)
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

                    await (tx.personnelEvaluationSubmissionItem.create as any)({
                        data: {
                            submissionId: submission.id,
                            itemId: item.itemId || null, // パターン項目ID
                            title: item.title || '',
                            description: item.description || null,
                            points: points,
                            isChecked: isChecked,
                            textValue: item.textValue || null
                        }
                    })
                }
            }

            // 設定値の取得 (デフォルト値を考慮)
            const configs = await (tx as any).personnelEvaluationConfig.findMany()
            const getConfig = (key: string, def: number) => {
                const c = configs.find((x: any) => x.key === key)
                return c ? Number(c.value) : def
            }
            const sendPoints = getConfig('thankYouSendPoints', 5)
            const receivePoints = getConfig('thankYouReceivePoints', 10)
            const dailyLimit = getConfig('thankYouDailyLimit', 50)

            // ありがとうアイテム
            if (Array.isArray(thankYous)) {
                for (const ty of thankYous) {
                    await tx.personnelEvaluationSubmissionItem.create({
                        data: {
                            submissionId: submission.id,
                            title: 'ありがとう送信',
                            points: sendPoints,
                            isChecked: true,
                            thankYouTo: JSON.stringify(ty.to || []), // 配列をJSON化
                            thankYouMessage: ty.message || '',
                            textValue: ty.recipientType || '' // Save recipientType here to restore it
                        }
                    })

                    // 送信者へのポイント加算ログ
                    // 当日の獲得済みptを確認して上限内なら加算
                    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0)
                    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999)

                    const senderTodayPoints = await tx.personnelEvaluationPointLog.aggregate({
                        _sum: { points: true },
                        where: {
                            employeeId: targetUserId,
                            date: { gte: startOfDay, lte: endOfDay },
                            type: { in: ['thank_you_sent', 'thank_you_received'] }
                        }
                    })
                    const currentSenderPoints = senderTodayPoints._sum.points || 0
                    const pointsToAddSender = Math.max(0, Math.min(sendPoints, dailyLimit - currentSenderPoints))

                    if (pointsToAddSender > 0) {
                        await tx.personnelEvaluationPointLog.create({
                            data: {
                                employeeId: targetUserId,
                                date: targetDate,
                                points: pointsToAddSender,
                                type: 'thank_you_sent',
                                sourceId: submission.id
                            }
                        })
                    }

                    // 受信者へのポイント加算ログ
                    if (Array.isArray(ty.to)) {
                        for (const recipientId of ty.to) {
                            const recipientTodayPoints = await tx.personnelEvaluationPointLog.aggregate({
                                _sum: { points: true },
                                where: {
                                    employeeId: recipientId,
                                    date: { gte: startOfDay, lte: endOfDay },
                                    type: { in: ['thank_you_sent', 'thank_you_received'] }
                                }
                            })
                            const currentRecipientPoints = recipientTodayPoints._sum.points || 0
                            const pointsToAddRecipient = Math.max(0, Math.min(receivePoints, dailyLimit - currentRecipientPoints))

                            if (pointsToAddRecipient > 0) {
                                await tx.personnelEvaluationPointLog.create({
                                    data: {
                                        employeeId: recipientId,
                                        date: targetDate,
                                        points: pointsToAddRecipient,
                                        type: 'thank_you_received',
                                        sourceId: submission.id
                                    }
                                })
                            }
                        }
                    }
                }
            }

            // 写真の保存
            // まず既存の写真を削除
            await tx.personnelEvaluationPhoto.deleteMany({
                where: { submissionId: submission.id }
            })

            const submittedPhotos = body.photos || [] // { url, comment }[]
            if (Array.isArray(submittedPhotos)) {
                for (const photo of submittedPhotos) {
                    if (photo.url) {
                        await (tx.personnelEvaluationPhoto.create as any)({
                            data: {
                                submissionId: submission.id,
                                url: photo.url,
                                comment: photo.comment || null
                            }
                        })
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

            // 5. 目標実績の更新 (Optional)
            // 5. 目標実績の更新 (Optional)
            if (goals) {
                // date文字列 (yyyy-MM-dd) からPeriod (yyyy-MM) を生成
                // targetDate.toISOString() だとUTCで日付がずれる可能性があるため、入力文字列を使用
                const period = (typeof date === 'string' ? date : targetDate.toISOString()).slice(0, 7)

                try {
                    // upsertの代わりにfindFirst -> update/create (安全策)
                    const existingGoal = await tx.personnelEvaluationGoal.findUnique({
                        where: {
                            employeeId_period: {
                                employeeId: targetUserId,
                                period: period
                            }
                        }
                    })

                    if (existingGoal) {
                        await tx.personnelEvaluationGoal.update({
                            where: { id: existingGoal.id },
                            data: {
                                contractAchievedAmount: String(Number(goals.contractAchieved) || 0),
                                completionAchievedAmount: String(Number(goals.completionAchieved) || 0)
                            }
                        })
                    } else {
                        await tx.personnelEvaluationGoal.create({
                            data: {
                                employeeId: targetUserId,
                                period: period,
                                contractTargetAmount: 0,
                                completionTargetAmount: 0,
                                contractAchievedAmount: String(Number(goals.contractAchieved) || 0),
                                completionAchievedAmount: String(Number(goals.completionAchieved) || 0)
                            }
                        })
                    }
                } catch (e) {
                    console.error("Failed to update goals:", e)
                    // ゴール更新失敗で全体をロールバックさせたくない場合はここで握りつぶすが、
                    // データの整合性を考えるとエラーにした方が気づける。
                    // 今回はログを出して再スローする。
                    throw e
                }
            }

            return submission
        })

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('POST /api/evaluations/submissions error:', error)
        return NextResponse.json({
            error: 'Failed to save submission',
            details: error?.message || String(error),
            // stack: error?.stack // Stack is optional
        }, { status: 500 })
    }
}
