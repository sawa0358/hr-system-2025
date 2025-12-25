
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workclock/checklist/patterns/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const pattern = await (prisma as any).workClockChecklistPattern.findUnique({
            where: { id: params.id },
            include: {
                items: {
                    orderBy: { position: 'asc' }
                }
            }
        })

        if (!pattern) {
            return NextResponse.json({ error: 'パターンが見つかりません' }, { status: 404 })
        }

        return NextResponse.json({ pattern })
    } catch (error) {
        console.error('GET /api/workclock/checklist/patterns/[id] error:', error)
        return NextResponse.json({ error: 'パターンの取得に失敗しました' }, { status: 500 })
    }
}

// PUT /api/workclock/checklist/patterns/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json()
        const { name } = body

        const pattern = await (prisma as any).workClockChecklistPattern.update({
            where: { id: params.id },
            data: { name },
        })

        return NextResponse.json({ pattern })
    } catch (error) {
        console.error('PUT /api/workclock/checklist/patterns/[id] error:', error)
        return NextResponse.json({ error: 'パターンの更新に失敗しました' }, { status: 500 })
    }
}

// DELETE /api/workclock/checklist/patterns/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await (prisma as any).workClockChecklistPattern.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/workclock/checklist/patterns/[id] error:', error)
        return NextResponse.json({ error: 'パターンの削除に失敗しました' }, { status: 500 })
    }
}
