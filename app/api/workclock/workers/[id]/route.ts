import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 特定のワーカーを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報を取得
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const worker = await prisma.workClockWorker.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!worker) {
      return NextResponse.json({ error: 'ワーカーが見つかりません' }, { status: 404 })
    }

    // 権限チェック: 本人またはサブマネージャー以上
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const isOwner = worker.employeeId === userId
    const hasPermission = allowedRoles.includes(user.role || '')

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    return NextResponse.json({
      ...worker,
      teams: worker.teams ? JSON.parse(worker.teams) : [],
    })
  } catch (error) {
    console.error('WorkClock worker取得エラー:', error)
    return NextResponse.json(
      { error: 'ワーカーの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: ワーカーを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報を取得
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const worker = await prisma.workClockWorker.findUnique({
      where: { id: params.id },
    })

    if (!worker) {
      return NextResponse.json({ error: 'ワーカーが見つかりません' }, { status: 404 })
    }

    // 権限チェック: サブマネージャー以上のみ
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      password,
      companyName,
      qualifiedInvoiceNumber,
      chatworkId,
      email,
      phone,
      address,
      hourlyRate,
      teams,
      role,
      notes,
    } = body

    const updated = await prisma.workClockWorker.update({
      where: { id: params.id },
      data: {
        name,
        password: password !== undefined ? password : undefined,
        companyName,
        qualifiedInvoiceNumber,
        chatworkId,
        email,
        phone,
        address,
        hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : undefined,
        teams: teams !== undefined ? (Array.isArray(teams) ? JSON.stringify(teams) : null) : undefined,
        role,
        notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...updated,
      teams: updated.teams ? JSON.parse(updated.teams) : [],
    })
  } catch (error) {
    console.error('WorkClock worker更新エラー:', error)
    return NextResponse.json(
      { error: 'ワーカーの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: ワーカーを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報を取得
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // 権限チェック: サブマネージャー以上のみ
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    if (!allowedRoles.includes(user.role || '')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    await prisma.workClockWorker.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WorkClock worker削除エラー:', error)
    return NextResponse.json(
      { error: 'ワーカーの削除に失敗しました' },
      { status: 500 }
    )
  }
}

