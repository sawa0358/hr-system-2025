import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// キー: MasterData.type/value で標準税率を管理
const TAX_TYPE = 'workclock_tax'
const TAX_VALUE_STANDARD = 'standard_rate'

// GET: 現在の標準消費税率を取得
export async function GET() {
  try {
    const record = await prisma.masterData.findUnique({
      where: {
        type_value: {
          type: TAX_TYPE,
          value: TAX_VALUE_STANDARD,
        },
      },
    })

    const rate =
      record && !isNaN(parseFloat(record.label))
        ? parseFloat(record.label)
        : 10

    return NextResponse.json({ rate })
  } catch (error) {
    console.error('WorkClock tax-settings GET error:', error)
    return NextResponse.json(
      { error: '標準消費税率の取得に失敗しました' },
      { status: 500 },
    )
  }
}

// PUT: 標準消費税率を更新し、課税対象ワーカーに自動反映
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // 標準税率の変更は総務・管理者のみ
    const allowedRoles = ['hr', 'admin', 'manager']
    if (!allowedRoles.includes(user.role || '')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const body = await request.json()
    const rawRate = body?.rate
    const rateNumber = Number(rawRate)

    if (!Number.isFinite(rateNumber) || rateNumber < 0) {
      return NextResponse.json(
        { error: '有効な消費税率を入力してください' },
        { status: 400 },
      )
    }

    const rateLabel = rateNumber.toString()

    // MasterData に標準税率を保存 / 更新
    await prisma.masterData.upsert({
      where: {
        type_value: {
          type: TAX_TYPE,
          value: TAX_VALUE_STANDARD,
        },
      },
      update: {
        label: rateLabel,
      },
      create: {
        type: TAX_TYPE,
        value: TAX_VALUE_STANDARD,
        label: rateLabel,
        order: 0,
      },
    })

    // 課税対象ワーカーに一括反映
    if ('workClockWorker' in prisma) {
      await (prisma as any).workClockWorker.updateMany({
        where: {
          billingTaxEnabled: true,
        },
        data: {
          billingTaxRate: rateNumber,
        },
      })
    }

    return NextResponse.json({ success: true, rate: rateNumber })
  } catch (error) {
    console.error('WorkClock tax-settings PUT error:', error)
    return NextResponse.json(
      { error: '標準消費税率の更新に失敗しました' },
      { status: 500 },
    )
  }
}



