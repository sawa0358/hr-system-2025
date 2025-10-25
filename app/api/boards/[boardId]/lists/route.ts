import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const lists = await prisma.list.findMany({
      where: {
        boardId: params.boardId
      },
      include: {
        cards: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(lists)
  } catch (error) {
    console.error('リスト取得エラー:', error)
    return NextResponse.json(
      { error: 'リストの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const body = await request.json()
    const { title, order } = body

    const list = await prisma.list.create({
      data: {
        title,
        order: order || 0,
        boardId: params.boardId
      }
    })

    return NextResponse.json(list, { status: 201 })
  } catch (error) {
    console.error('リスト作成エラー:', error)
    return NextResponse.json(
      { error: 'リストの作成に失敗しました' },
      { status: 500 }
    )
  }
}