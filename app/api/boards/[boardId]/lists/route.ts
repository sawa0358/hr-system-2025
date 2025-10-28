import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const lists = await prisma.boardList.findMany({
      where: {
        boardId: params.boardId
      },
      include: {
        cards: true
      },
      orderBy: {
        position: 'asc'
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
    const { title, position } = body

    // titleのバリデーション
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'リスト名は必須です' },
        { status: 400 }
      )
    }

    // ボードが存在するか確認
    const board = await prisma.board.findUnique({
      where: { id: params.boardId }
    })

    if (!board) {
      return NextResponse.json(
        { error: 'ボードが見つかりません' },
        { status: 404 }
      )
    }

    // 新しいリストの位置を決定（既存リストの最大位置+1）
    const maxPosition = await prisma.boardList.findFirst({
      where: { boardId: params.boardId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const newPosition = position !== undefined ? position : (maxPosition?.position ?? -1) + 1

    const list = await prisma.boardList.create({
      data: {
        title,
        position: newPosition,
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