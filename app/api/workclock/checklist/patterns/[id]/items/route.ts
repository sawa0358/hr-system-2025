
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/workclock/checklist/patterns/[id]/items
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json()
        const { title, reward, isMandatory, isFreeText, category, position } = body

        if (!title) {
            return NextResponse.json({ error: '項目名は必須です' }, { status: 400 })
        }

        const item = await (prisma as any).workClockChecklistItem.create({
            data: {
                patternId: params.id,
                title,
                reward: Number(reward) || 0,
                isMandatory: !!isMandatory,
                isFreeText: !!isFreeText,
                category,
                position: position || 0,
            },
        })

        return NextResponse.json({ item })
    } catch (error: any) {
        console.error('POST /api/workclock/checklist/patterns/[id]/items error:', error)
        return NextResponse.json({
            error: '項目の作成に失敗しました',
            details: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
