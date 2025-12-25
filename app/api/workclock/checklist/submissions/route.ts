
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workclock/checklist/submissions
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const workerId = searchParams.get('workerId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        const where: any = {}
        if (workerId) where.workerId = workerId
        if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = new Date(startDate)
            if (endDate) where.date.lte = new Date(endDate)
        }

        const submissions = await (prisma as any).workClockChecklistSubmission.findMany({
            where,
            include: {
                worker: {
                    select: { name: true, teams: true, role: true }
                },
                items: true,
            },
            orderBy: { date: 'desc' },
        })

        return NextResponse.json({ submissions })
    } catch (error) {
        console.error('GET /api/workclock/checklist/submissions error:', error)
        return NextResponse.json({ error: '報告の取得に失敗しました' }, { status: 500 })
    }
}

// POST /api/workclock/checklist/submissions
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { workerId, date, memo, hasPhoto, isSafetyAlert, items } = body

        if (!workerId || !date || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
        }

        const dateObj = new Date(date)
        // 日付の開始と終了を計算（その日の0時から23時59分59秒まで）
        const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
        const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1)

        // 同じ日の既存の提出を削除（上書き保存）
        const existingSubmissions = await (prisma as any).workClockChecklistSubmission.findMany({
            where: {
                workerId,
                date: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
            },
            select: { id: true },
        })

        if (existingSubmissions.length > 0) {
            // 既存の項目を先に削除
            await (prisma as any).workClockChecklistSubmissionItem.deleteMany({
                where: {
                    submissionId: {
                        in: existingSubmissions.map((s: any) => s.id),
                    },
                },
            })
            // 既存の提出を削除
            await (prisma as any).workClockChecklistSubmission.deleteMany({
                where: {
                    id: {
                        in: existingSubmissions.map((s: any) => s.id),
                    },
                },
            })
        }

        // 新規作成
        const submission = await (prisma as any).workClockChecklistSubmission.create({
            data: {
                workerId,
                date: startOfDay,
                memo,
                hasPhoto: !!hasPhoto,
                isSafetyAlert: !!isSafetyAlert,
                items: {
                    create: items.map((item: any) => ({
                        title: item.title,
                        reward: Number(item.reward) || 0,
                        isMandatory: !!item.isMandatory,
                        isChecked: !!item.isChecked,
                        isFreeText: !!item.isFreeText,
                        freeTextValue: item.freeTextValue || null,
                        category: item.category,
                    }))
                }
            },
            include: {
                items: true
            }
        })

        return NextResponse.json({ submission })
    } catch (error) {
        console.error('POST /api/workclock/checklist/submissions error:', error)
        return NextResponse.json({ error: '報告の提出に失敗しました' }, { status: 500 })
    }
}
