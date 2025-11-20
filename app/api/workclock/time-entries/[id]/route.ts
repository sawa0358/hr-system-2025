import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 先月以前のレコードがロック対象か判定するヘルパー（list/POST側と同一ロジック）
function isLockedPastEntry(entryDate: Date, now: Date = new Date()): boolean {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const firstOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thirdOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 3)

  return entryDate < firstOfCurrentMonth && today >= thirdOfCurrentMonth
}

function ensureCanEditLockedEntry(userRole: string | null | undefined) {
  const allowedRolesForLocked = ['hr', 'admin']
  if (!allowedRolesForLocked.includes(userRole || '')) {
    return NextResponse.json(
      {
        error:
          '先月以前の勤務記録は毎月3日以降、総務・管理者のみ編集できます。必要な場合は総務・管理者に依頼してください。',
      },
      { status: 403 }
    )
  }
  return null
}

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

    // WorkClockリーダー（role === 'admin'）は閲覧のみ許可し、更新は不可
    let isLeader = false
    if (!hasPermission) {
      try {
        const viewerWorker = await prisma.workClockWorker.findUnique({
          where: { employeeId: userId },
        })
        if (viewerWorker?.role === 'admin') {
          isLeader = true
        }
      } catch (e) {
        console.warn('[WorkClock API] leader check failed (time-entries PUT):', e)
      }
    }

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }
    if (isLeader) {
      return NextResponse.json({ error: 'リーダーは勤務記録を更新できません' }, { status: 403 })
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

    // WorkClockリーダー（role === 'admin'）は閲覧のみ許可し、削除は不可
    let isLeader = false
    if (!hasPermission) {
      try {
        const viewerWorker = await prisma.workClockWorker.findUnique({
          where: { employeeId: userId },
        })
        if (viewerWorker?.role === 'admin') {
          isLeader = true
        }
      } catch (e) {
        console.warn('[WorkClock API] leader check failed (time-entries DELETE):', e)
      }
    }

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }
    if (isLeader) {
      return NextResponse.json({ error: 'リーダーは勤務記録を削除できません' }, { status: 403 })
    }

    const body = await request.json()
    const { date, startTime, endTime, breakMinutes, notes, wagePattern } = body

    // ロック対象かどうか判定（body.date があればそれを優先、なければ既存の entry.date）
    try {
      const targetDate = date ? new Date(date) : entry.date
      if (isLockedPastEntry(targetDate)) {
        const lockError = ensureCanEditLockedEntry(user.role)
        if (lockError) {
          return lockError
        }
      }
    } catch (e) {
      console.warn('[WorkClock API] entryDate parse error (time-entries PUT):', e)
    }

    const updated = await prisma.workClockTimeEntry.update({
      where: { id: params.id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        breakMinutes,
        wagePattern:
          wagePattern && ['A', 'B', 'C'].includes(wagePattern)
            ? wagePattern
            : undefined,
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

    // 先月以前の勤務記録の削除は、当月3日以降は総務・管理者のみ許可
    try {
      if (isLockedPastEntry(entry.date)) {
        const lockError = ensureCanEditLockedEntry(user.role)
        if (lockError) {
          return lockError
        }
      }
    } catch (e) {
      console.warn('[WorkClock API] entryDate parse error (time-entries DELETE):', e)
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

