import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE: 特別報酬を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const rewardId = params.id
    const reward = await (prisma as any).workClockReward.findUnique({
      where: { id: rewardId },
      include: { worker: true },
    })

    if (!reward) {
      return NextResponse.json({ error: '特別報酬が見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const isOwner = reward.worker.employeeId === userId
    const hasPermission = allowedRoles.includes(user.role || '')

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    await (prisma as any).workClockReward.delete({
      where: { id: rewardId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('WorkClock reward削除エラー:', error)
    return NextResponse.json(
      { error: '特別報酬の削除に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: 特別報酬を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { amount, description, date } = body

    const rewardId = params.id
    const reward = await (prisma as any).workClockReward.findUnique({
      where: { id: rewardId },
      include: { worker: true },
    })

    if (!reward) {
      return NextResponse.json({ error: '特別報酬が見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const isOwner = reward.worker.employeeId === userId
    const hasPermission = allowedRoles.includes(user.role || '')

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const updatedReward = await (prisma as any).workClockReward.update({
      where: { id: rewardId },
      data: {
        amount: amount !== undefined ? Number(amount) : undefined,
        description: description !== undefined ? description : undefined,
        date: date ? new Date(date) : undefined,
      },
    })

    return NextResponse.json(updatedReward)
  } catch (error: any) {
    console.error('WorkClock reward更新エラー:', error)
    return NextResponse.json(
      { error: '特別報酬の更新に失敗しました' },
      { status: 500 }
    )
  }
}

