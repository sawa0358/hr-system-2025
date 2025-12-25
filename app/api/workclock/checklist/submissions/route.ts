
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
            if (startDate) {
                const parts = startDate.split('-').map(Number);
                where.date.gte = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
            }
            if (endDate) {
                const parts = endDate.split('-').map(Number);
                where.date.lte = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
            }
        }

        const submissions = await (prisma as any).workClockChecklistSubmission.findMany({
            where,
            include: {
                worker: {
                    select: { name: true, teams: true, role: true }
                },
                items: true,
            },
            orderBy: { date: 'desc' }, // 日付順
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

        // 日付を正規化 (yyyy-mm-dd形式の文字列から直接年月日を抽出することで、タイムゾーンのズレを防ぐ)
        const dateParts = date.split('-').map(Number);
        const startOfDay = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0, 0);
        const endOfDay = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 23, 59, 59, 999);

        // デバッグログ
        console.log(`Processing submission for worker: ${workerId}, date: ${date} -> Range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

        // 同じ日の既存の提出をすべて検索して削除（重複防止の徹底）
        const existingSubmissions = await (prisma as any).workClockChecklistSubmission.findMany({
            where: {
                workerId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            select: { id: true },
        })

        if (existingSubmissions.length > 0) {
            const ids = existingSubmissions.map((s: any) => s.id)
            // 既存の項目を一括削除
            await (prisma as any).workClockChecklistSubmissionItem.deleteMany({
                where: { submissionId: { in: ids } },
            })
            // 既存の提出本体を一括削除
            await (prisma as any).workClockChecklistSubmission.deleteMany({
                where: { id: { in: ids } },
            })
            console.log(`Deleted ${ids.length} existing submissions for worker ${workerId} on ${date}`)
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
