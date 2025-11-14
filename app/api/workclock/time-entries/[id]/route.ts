import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 特定の時間記録を取得
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

    const entry = await prisma.workClockTimeEntry.findUnique({
      where: { id: params.id },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: '時間記録が見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const isOwner = entry.worker.employeeId === userId
    const hasPermission = allowedRoles.includes(user.role || '')

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    return NextResponse.json({
      ...entry,
      date: entry.date.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('WorkClock time entry取得エラー:', error)
    return NextResponse.json(
      { error: '時間記録の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: 時間記録を更新
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

    const entry = await prisma.workClockTimeEntry.findUnique({
      where: { id: params.id },
      include: {
        worker: true,
      },
    })

    if (!entry) {
      return NextResponse.json({ error: '時間記録が見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const isOwner = entry.worker.employeeId === userId
    const hasPermission = allowedRoles.includes(user.role || '')

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const body = await request.json()
    const { date, startTime, endTime, breakMinutes, notes } = body

    const updated = await prisma.workClockTimeEntry.update({
      where: { id: params.id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        breakMinutes,
        notes,
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...updated,
      date: updated.date.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('WorkClock time entry更新エラー:', error)
    return NextResponse.json(
      { error: '時間記録の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: 時間記録を削除
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

    const entry = await prisma.workClockTimeEntry.findUnique({
      where: { id: params.id },
      include: {
        worker: true,
      },
    })

    if (!entry) {
      return NextResponse.json({ error: '時間記録が見つかりません' }, { status: 404 })
    }

    // 権限チェック
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const isOwner = entry.worker.employeeId === userId
    const hasPermission = allowedRoles.includes(user.role || '')

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    await prisma.workClockTimeEntry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WorkClock time entry削除エラー:', error)
    return NextResponse.json(
      { error: '時間記録の削除に失敗しました' },
      { status: 500 }
    )
  }
}

