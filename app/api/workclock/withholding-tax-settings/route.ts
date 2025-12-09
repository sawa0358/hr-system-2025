import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// キー: MasterData.type/value で源泉徴収率を管理
const WITHHOLDING_TAX_TYPE = 'workclock_withholding_tax'
const RATE_UNDER_1M = 'rate_under_1m' // 100万円以下の税率
const RATE_OVER_1M = 'rate_over_1m'   // 100万円超の税率

// デフォルト値（現行法律）
const DEFAULT_RATE_UNDER_1M = 10.21
const DEFAULT_RATE_OVER_1M = 20.42

// GET: 現在の源泉徴収率を取得
export async function GET() {
  try {
    const recordUnder1M = await prisma.masterData.findUnique({
      where: {
        type_value: {
          type: WITHHOLDING_TAX_TYPE,
          value: RATE_UNDER_1M,
        },
      },
    })

    const recordOver1M = await prisma.masterData.findUnique({
      where: {
        type_value: {
          type: WITHHOLDING_TAX_TYPE,
          value: RATE_OVER_1M,
        },
      },
    })

    const rateUnder1M =
      recordUnder1M && !isNaN(parseFloat(recordUnder1M.label))
        ? parseFloat(recordUnder1M.label)
        : DEFAULT_RATE_UNDER_1M

    const rateOver1M =
      recordOver1M && !isNaN(parseFloat(recordOver1M.label))
        ? parseFloat(recordOver1M.label)
        : DEFAULT_RATE_OVER_1M

    return NextResponse.json({
      rateUnder1M,
      rateOver1M,
    })
  } catch (error) {
    console.error('WorkClock withholding-tax-settings GET error:', error)
    return NextResponse.json(
      { error: '源泉徴収率の取得に失敗しました' },
      { status: 500 },
    )
  }
}

// PUT: 源泉徴収率を更新
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

    // 源泉徴収率の変更は総務・管理者のみ
    const allowedRoles = ['hr', 'admin', 'manager']
    if (!allowedRoles.includes(user.role || '')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const body = await request.json()
    const { rateUnder1M, rateOver1M } = body

    const rateUnder1MNumber = Number(rateUnder1M)
    const rateOver1MNumber = Number(rateOver1M)

    if (!Number.isFinite(rateUnder1MNumber) || rateUnder1MNumber < 0) {
      return NextResponse.json(
        { error: '100万円以下の税率に有効な値を入力してください' },
        { status: 400 },
      )
    }

    if (!Number.isFinite(rateOver1MNumber) || rateOver1MNumber < 0) {
      return NextResponse.json(
        { error: '100万円超の税率に有効な値を入力してください' },
        { status: 400 },
      )
    }

    // MasterData に源泉徴収率を保存 / 更新
    await prisma.masterData.upsert({
      where: {
        type_value: {
          type: WITHHOLDING_TAX_TYPE,
          value: RATE_UNDER_1M,
        },
      },
      update: {
        label: rateUnder1MNumber.toString(),
      },
      create: {
        type: WITHHOLDING_TAX_TYPE,
        value: RATE_UNDER_1M,
        label: rateUnder1MNumber.toString(),
        order: 0,
      },
    })

    await prisma.masterData.upsert({
      where: {
        type_value: {
          type: WITHHOLDING_TAX_TYPE,
          value: RATE_OVER_1M,
        },
      },
      update: {
        label: rateOver1MNumber.toString(),
      },
      create: {
        type: WITHHOLDING_TAX_TYPE,
        value: RATE_OVER_1M,
        label: rateOver1MNumber.toString(),
        order: 1,
      },
    })

    return NextResponse.json({
      success: true,
      rateUnder1M: rateUnder1MNumber,
      rateOver1M: rateOver1MNumber,
    })
  } catch (error) {
    console.error('WorkClock withholding-tax-settings PUT error:', error)
    return NextResponse.json(
      { error: '源泉徴収率の更新に失敗しました' },
      { status: 500 },
    )
  }
}

