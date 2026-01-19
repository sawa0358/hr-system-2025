
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: パターン一覧の取得 または 個別取得
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (id) {
            // 詳細取得
            const pattern = await prisma.personnelEvaluationPattern.findUnique({
                where: { id },
                include: { items: { orderBy: { position: 'asc' } } }
            })

            if (!pattern) {
                return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
            }

            // UI形式に整形して返す
            return NextResponse.json({
                ...pattern,
                items: pattern.items.map(item => ({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    type: item.type,
                    points: item.points,
                    mandatory: item.isMandatory
                }))
            })
        }

        // 一覧取得
        const patterns = await prisma.personnelEvaluationPattern.findMany({
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        // UIに合わせて整形
        const formatted = patterns.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            itemsCount: p._count.items,
            lastUpdated: p.updatedAt.toISOString().split('T')[0]
        }))

        return NextResponse.json(formatted)
    } catch (error) {
        console.error('GET /api/evaluations/settings/patterns error:', error)
        return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 })
    }
}

// POST: パターンの作成または更新 (itemsも含む)
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id, name, description, items } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // 既存パターンの更新（IDが 'new-' で始まらない場合）
        const isNew = !id || id.startsWith('new-') || id.startsWith('copy-')

        const result = await prisma.$transaction(async (tx) => {
            let pattern;
            if (isNew) {
                // 新規作成
                pattern = await tx.personnelEvaluationPattern.create({
                    data: {
                        name,
                        description
                    }
                })
            } else {
                // 更新
                pattern = await tx.personnelEvaluationPattern.update({
                    where: { id },
                    data: {
                        name,
                        description
                    }
                })

                // 既存の項目を一旦削除（完全洗い替え）
                await tx.personnelEvaluationItem.deleteMany({
                    where: { patternId: id }
                })
            }

            // 項目の作成
            if (items && Array.isArray(items)) {
                // positionをindexに基づいて設定
                for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    await tx.personnelEvaluationItem.create({
                        data: {
                            patternId: pattern.id,
                            title: item.title,
                            description: item.description,
                            type: item.type,
                            points: Number(item.points) || 0,
                            isMandatory: !!item.mandatory,
                            position: i // 並び順
                        }
                    })
                }
            }

            return pattern
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('POST /api/evaluations/settings/patterns error:', error)
        return NextResponse.json({ error: 'Failed to save pattern' }, { status: 500 })
    }
}

// DELETE: パターンの削除
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        await prisma.personnelEvaluationPattern.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('DELETE /api/evaluations/settings/patterns error:', error)
        return NextResponse.json({ error: 'Failed to delete pattern' }, { status: 500 })
    }
}
