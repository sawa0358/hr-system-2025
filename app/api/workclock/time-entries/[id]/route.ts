import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 勤務記録がロック対象か判定するヘルパー
// - 「2日前の記録以前」をロック対象とする
// - 今日が21日なら、19日以前の記録がロック対象（20日、21日は編集可能）
function isLockedPastEntry(entryDate: Date, now: Date = new Date()): boolean {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const targetDate = new Date(entryDate)
  targetDate.setHours(0, 0, 0, 0)

  // 2日前を計算
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(today.getDate() - 2)

  return targetDate <= twoDaysAgo
}

function ensureCanEditLockedEntry(userRole: string | null | undefined) {
  const allowedRolesForLocked = ['manager', 'hr', 'admin']
  if (!allowedRolesForLocked.includes(userRole || '')) {
    return NextResponse.json(
      {
        error:
          '2日前の記録以前の勤務記録は、マネージャー・総務・管理者のみ編集できます。必要な場合は上長に依頼してください。',
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

    // WorkClockリーダー（role === 'admin'）は、他人の勤務記録は更新不可（自分の分は更新可能）
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
    // リーダーでも「自分の勤務記録」であれば更新を許可する
    if (isLeader && !isOwner) {
      return NextResponse.json({ error: 'リーダーは他人の勤務記録を更新できません' }, { status: 403 })
    }

    const body = await request.json()
    const { date, startTime, endTime, breakMinutes, notes } = body as any

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

    // 時給パターン／回数パターンの更新値を解釈する
    const rawWagePattern = (body as any).wagePattern
    const rawCountPattern = (body as any).countPattern
    const rawCount = (body as any).count

    let wagePatternUpdate: 'A' | 'B' | 'C' | null | undefined = undefined
    if (rawWagePattern === null) {
      wagePatternUpdate = null
    } else if (rawWagePattern === 'A' || rawWagePattern === 'B' || rawWagePattern === 'C') {
      wagePatternUpdate = rawWagePattern
    }

    let countPatternUpdate: 'A' | 'B' | 'C' | null | undefined = undefined
    if (rawCountPattern === null) {
      countPatternUpdate = null
    } else if (rawCountPattern === 'A' || rawCountPattern === 'B' || rawCountPattern === 'C') {
      countPatternUpdate = rawCountPattern
    }

    let countUpdate: number | null | undefined = undefined
    if (rawCount === null) {
      countUpdate = null
    } else if (typeof rawCount === 'number' && !Number.isNaN(rawCount)) {
      countUpdate = rawCount
    }

    const updated = await prisma.workClockTimeEntry.update({
      where: { id: params.id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        breakMinutes,
        wagePattern: wagePatternUpdate,
        countPattern: countPatternUpdate,
        count: countUpdate,
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

