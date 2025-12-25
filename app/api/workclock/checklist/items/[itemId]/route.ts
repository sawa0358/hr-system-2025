
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/workclock/checklist/items/[itemId]
export async function PUT(request: Request, { params }: { params: { itemId: string } }) {
    try {
        const body = await request.json()
        const { title, reward, isMandatory, isFreeText, category, position } = body

        const item = await (prisma as any).workClockChecklistItem.update({
            where: { id: params.itemId },
            data: {
                title,
                reward: reward !== undefined ? Number(reward) : undefined,
                isMandatory: isMandatory !== undefined ? !!isMandatory : undefined,
                isFreeText: isFreeText !== undefined ? !!isFreeText : undefined,
                category,
                position: position !== undefined ? Number(position) : undefined,
            },
        })

        return NextResponse.json({ item })
    } catch (error) {
        console.error('PUT /api/workclock/checklist/items/[itemId] error:', error)
        return NextResponse.json({ error: '項目の更新に失敗しました' }, { status: 500 })
    }
}

// DELETE /api/workclock/checklist/items/[itemId]
export async function DELETE(request: Request, { params }: { params: { itemId: string } }) {
    try {
        await (prisma as any).workClockChecklistItem.delete({
            where: { id: params.itemId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/workclock/checklist/items/[itemId] error:', error)
        return NextResponse.json({ error: '項目の削除に失敗しました' }, { status: 500 })
    }
}
