import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// カスタムフォルダを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'employee'

    const folders = await prisma.customFolder.findMany({
      where: { 
        employeeId: params.id,
        category: category
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(folders.map(f => f.name))
  } catch (error) {
    console.error('カスタムフォルダ取得エラー:', error)
    return NextResponse.json(
      { error: 'カスタムフォルダの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// カスタムフォルダを保存
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { folders, category = 'employee' } = body

    if (!Array.isArray(folders)) {
      return NextResponse.json(
        { error: 'フォルダデータが正しい形式ではありません' },
        { status: 400 }
      )
    }

    // 既存のフォルダを削除
    await prisma.customFolder.deleteMany({
      where: { 
        employeeId: params.id,
        category: category
      }
    })

    // 新しいフォルダを追加
    if (folders.length > 0) {
      await prisma.customFolder.createMany({
        data: folders.map((name: string, index: number) => ({
          employeeId: params.id,
          category: category,
          name: name,
          order: index
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('カスタムフォルダ保存エラー:', error)
    return NextResponse.json(
      { error: 'カスタムフォルダの保存に失敗しました' },
      { status: 500 }
    )
  }
}
