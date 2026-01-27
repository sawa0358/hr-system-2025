import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 指定日のありがとう一覧を取得
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateStr = searchParams.get('date')
        const teamId = searchParams.get('teamId') // 店長用フィルタ

        if (!dateStr) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        }

        // 日付範囲を作成（その日の0時から23時59分59秒まで）
        const targetDateStart = new Date(dateStr)
        targetDateStart.setHours(0, 0, 0, 0)
        const targetDateEnd = new Date(dateStr)
        targetDateEnd.setHours(23, 59, 59, 999)

        console.log('[thankyous API] dateStr:', dateStr)
        console.log('[thankyous API] targetDateStart:', targetDateStart.toISOString())
        console.log('[thankyous API] targetDateEnd:', targetDateEnd.toISOString())

        // ありがとう送信アイテムを取得
        const thankYouItems = await prisma.personnelEvaluationSubmissionItem.findMany({
            where: {
                submission: {
                    date: {
                        gte: targetDateStart,
                        lte: targetDateEnd
                    },
                    ...(teamId ? {
                        employee: { personnelEvaluationTeamId: teamId }
                    } : {})
                },
                title: 'ありがとう送信'
            },
            select: {
                id: true,
                thankYouTo: true,
                thankYouMessage: true,
                textValue: true, // recipientType
                submission: {
                    select: {
                        employee: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        })

        console.log('[thankyous API] Found items:', thankYouItems.length)

        // 受信者のID一覧を取得
        const recipientIds = new Set<string>()
        thankYouItems.forEach(item => {
            try {
                const to = JSON.parse(item.thankYouTo || '[]')
                if (Array.isArray(to)) {
                    to.forEach(id => recipientIds.add(id))
                } else if (typeof to === 'string') {
                    recipientIds.add(to)
                }
            } catch (e) {
                // ignore
            }
        })

        // 受信者の名前を取得
        const recipients = await prisma.employee.findMany({
            where: { id: { in: Array.from(recipientIds) } },
            select: { id: true, name: true }
        })
        const recipientMap = new Map(recipients.map(r => [r.id, r.name]))

        // レスポンス用データを整形
        const result = thankYouItems.map(item => {
            let toIds: string[] = []
            let recipientType = item.textValue || 'individual'

            try {
                const to = JSON.parse(item.thankYouTo || '[]')
                if (Array.isArray(to)) {
                    toIds = to
                } else if (typeof to === 'string') {
                    toIds = [to]
                }
            } catch (e) {
                // ignore
            }

            const recipientNames = toIds.map(id => recipientMap.get(id) || '不明').join('、')

            return {
                id: item.id,
                fromName: item.submission.employee.name,
                fromId: item.submission.employee.id,
                toNames: recipientNames,
                toIds,
                recipientType,
                message: item.thankYouMessage || ''
            }
        })

        return NextResponse.json({ thankyous: result })
    } catch (error) {
        console.error('GET /api/evaluations/thankyous error:', error)
        return NextResponse.json({ error: 'Failed to fetch thank yous' }, { status: 500 })
    }
}
