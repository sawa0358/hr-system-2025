
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workclock/checklist/patterns
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const includeItems = searchParams.get('items') === 'true'

        const patterns = await (prisma as any).workClockChecklistPattern.findMany({
            include: {
                _count: {
                    select: { items: true }
                },
                items: includeItems,
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ patterns })
    } catch (error) {
        console.error('GET /api/workclock/checklist/patterns error:', error)
        return NextResponse.json({ error: 'パターンの取得に失敗しました' }, { status: 500 })
    }
}

// POST /api/workclock/checklist/patterns
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json({ error: 'パターン名は必須です' }, { status: 400 })
        }

        const pattern = await (prisma as any).workClockChecklistPattern.create({
            data: { name },
        })

        return NextResponse.json({ pattern })
    } catch (error) {
        console.error('POST /api/workclock/checklist/patterns error:', error)
        return NextResponse.json({ error: 'パターンの作成に失敗しました' }, { status: 500 })
    }
}
