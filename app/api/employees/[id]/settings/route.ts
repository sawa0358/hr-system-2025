import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ユーザー設定を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const settings = await prisma.userSettings.findMany({
      where: { employeeId: params.id }
    })

    // 設定をオブジェクト形式に変換
    const settingsObj: { [key: string]: any } = {}
    settings.forEach(setting => {
      try {
        settingsObj[setting.key] = JSON.parse(setting.value)
      } catch {
        settingsObj[setting.key] = setting.value
      }
    })

    return NextResponse.json(settingsObj)
  } catch (error) {
    console.error('ユーザー設定取得エラー:', error)
    return NextResponse.json(
      { error: 'ユーザー設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// ユーザー設定を保存
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: '設定キーが指定されていません' },
        { status: 400 }
      )
    }

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

    await prisma.userSettings.upsert({
      where: {
        employeeId_key: {
          employeeId: params.id,
          key: key
        }
      },
      update: {
        value: valueStr
      },
      create: {
        employeeId: params.id,
        key: key,
        value: valueStr
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ユーザー設定保存エラー:', error)
    return NextResponse.json(
      { error: 'ユーザー設定の保存に失敗しました' },
      { status: 500 }
    )
  }
}
