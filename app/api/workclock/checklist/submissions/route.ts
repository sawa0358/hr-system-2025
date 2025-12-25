
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

        const submission = await (prisma as any).workClockChecklistSubmission.create({
            data: {
                workerId,
                date: new Date(date),
                memo,
                hasPhoto: !!hasPhoto,
                isSafetyAlert: !!isSafetyAlert,
                items: {
                    create: items.map((item: any) => ({
                        title: item.title,
                        reward: Number(item.reward) || 0,
                        isMandatory: !!item.isMandatory,
                        isChecked: !!item.isChecked,
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
