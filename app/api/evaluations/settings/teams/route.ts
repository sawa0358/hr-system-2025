
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: チーム一覧取得
export async function GET(request: Request) {
    try {
        const teams = await prisma.personnelEvaluationTeam.findMany({
            include: {
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(teams)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }
}

// POST: チーム作成
export async function POST(request: Request) {
    try {
        const { name } = await request.json()
        if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

        const team = await prisma.personnelEvaluationTeam.create({
            data: { name }
        })
        return NextResponse.json(team)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
    }
}

// DELETE: チーム削除
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await prisma.personnelEvaluationTeam.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
    }
}
