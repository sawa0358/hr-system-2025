import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// マスターデータを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const where = type ? { type, isActive: true } : { isActive: true }
    
    const masterData = await prisma.masterData.findMany({
      where,
      orderBy: { order: 'asc' }
    })

    // タイプ別にグループ化
    const groupedData: { [key: string]: any[] } = {}
    masterData.forEach(item => {
      if (!groupedData[item.type]) {
        groupedData[item.type] = []
      }
      groupedData[item.type].push({
        value: item.value,
        label: item.label || item.value
      })
    })

    return NextResponse.json(groupedData)
  } catch (error) {
    console.error('マスターデータ取得エラー:', error)
    return NextResponse.json(
      { error: 'マスターデータの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// マスターデータを保存
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'マスターデータが正しい形式ではありません' },
        { status: 400 }
      )
    }

    // 既存のデータを削除
    await prisma.masterData.deleteMany({
      where: { type }
    })

    // 新しいデータを追加
    if (data.length > 0) {
      await prisma.masterData.createMany({
        data: data.map((item: any, index: number) => ({
          type,
          value: item.value,
          label: item.label || item.value,
          order: index
        }))
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('マスターデータ保存エラー:', error)
    return NextResponse.json(
      { error: 'マスターデータの保存に失敗しました' },
      { status: 500 }
    )
  }
}