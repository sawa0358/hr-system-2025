
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/workclock/checklist/patterns/[id]/reorder
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { itemIds } = body

        if (!itemIds || !Array.isArray(itemIds)) {
            return NextResponse.json({ message: 'Invalid itemIds' }, { status: 400 })
        }

        // トランザクションで一括更新
        await prisma.$transaction(
            itemIds.map((itemId: string, index: number) =>
                (prisma as any).workClockChecklistItem.update({
                    where: { id: itemId },
                    data: { position: index }
                })
            )
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Checklist reorder error:', error)
        return NextResponse.json({ error: '並び替えの保存に失敗しました' }, { status: 500 })
    }
}
