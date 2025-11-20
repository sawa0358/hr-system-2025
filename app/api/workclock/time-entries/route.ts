import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 先月以前のレコードがロック対象か判定するヘルパー
// - 今日が当月3日以降 かつ 対象日が「当月1日より前」の場合 => true
function isLockedPastEntry(entryDate: Date, now: Date = new Date()): boolean {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const firstOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thirdOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 3)

  return entryDate < firstOfCurrentMonth && today >= thirdOfCurrentMonth
}

// ロック対象レコードに対して、HR/管理者以外をブロックする
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

// GET: 時間記録一覧を取得
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    // 権限チェック
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const hasPermission = allowedRoles.includes(user.role || '')

    // Prisma Clientが古く、WorkClockモデルを持っていない場合の防御
    const hasWorkClockWorkerModel =
      (prisma as any)?.workClockWorker &&
      typeof (prisma as any).workClockWorker.findUnique === 'function'
    const hasWorkClockTimeEntryModel =
      (prisma as any)?.workClockTimeEntry &&
      typeof (prisma as any).workClockTimeEntry.findMany === 'function'

    if (!hasWorkClockWorkerModel || !hasWorkClockTimeEntryModel) {
      console.warn('[WorkClock API] Prisma Client が古いか、WorkClockモデルが未定義です。')
      return NextResponse.json([], { status: 200 })
    }

    // workerIdが指定されている場合、本人または権限者、
    // もしくは WorkClock 上でリーダー（role === 'admin'）かつ同じチームのメンバーでないとアクセス不可
    if (workerId) {
      const worker = await (prisma as any).workClockWorker.findUnique({
        where: { id: workerId },
      })

      if (!worker) {
        return NextResponse.json({ error: 'ワーカーが見つかりません' }, { status: 404 })
      }

      const isOwner = worker.employeeId === userId
      let isLeaderOfSameTeam = false

      if (!isOwner && !hasPermission) {
        try {
          const viewerWorker = await (prisma as any).workClockWorker.findUnique({
            where: { employeeId: userId },
          })

          if (viewerWorker?.role === 'admin') {
            let viewerTeams: string[] = []
            let targetTeams: string[] = []
            try {
              if (viewerWorker.teams) {
                viewerTeams = JSON.parse(viewerWorker.teams || '[]')
              }
            } catch (e) {
              console.warn('[WorkClock API] viewerWorker teams parse error:', e)
            }
            try {
              if (worker.teams) {
                targetTeams = JSON.parse(worker.teams || '[]')
              }
            } catch (e) {
              console.warn('[WorkClock API] worker teams parse error:', e)
            }

            if (viewerTeams.length > 0 && targetTeams.length > 0) {
              isLeaderOfSameTeam = targetTeams.some((t) => viewerTeams.includes(t))
            }
          }
        } catch (e) {
          console.warn('[WorkClock API] leader same-team check failed (time-entries GET):', e)
        }
      }

      if (!isOwner && !hasPermission && !isLeaderOfSameTeam) {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
      }
    } else if (!hasPermission) {
      // workerId が指定されていない場合でも、
      // WorkClock 上でリーダー（role === 'admin'）なら、自分と同じチームのメンバーの記録だけ閲覧可能にする
      let viewerWorker: any = null
      try {
        viewerWorker = await (prisma as any).workClockWorker.findUnique({
          where: { employeeId: userId },
        })
      } catch (e) {
        console.warn('[WorkClock API] viewerWorker fetch failed (time-entries GET, no workerId):', e)
      }

      if (!viewerWorker || viewerWorker.role !== 'admin') {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
      }
      // この後の where 構築時に、同じチームのワーカーに絞り込む
    }

    const where: any = {}
    if (workerId) {
      where.workerId = workerId
    } else if (!hasPermission) {
      // HRの管理権限は無いが、WorkClockリーダーとして自分と同じチームのメンバーだけを対象にする
      let viewerWorker: any = null
      try {
        viewerWorker = await (prisma as any).workClockWorker.findUnique({
          where: { employeeId: userId },
        })
      } catch (e) {
        console.warn('[WorkClock API] viewerWorker fetch failed for where filter:', e)
      }

      if (viewerWorker && viewerWorker.role === 'admin') {
        let viewerTeams: string[] = []
        try {
          if (viewerWorker.teams) {
            viewerTeams = JSON.parse(viewerWorker.teams || '[]')
          }
        } catch (e) {
          console.warn('[WorkClock API] viewerWorker teams parse error (no workerId):', e)
        }

        if (viewerTeams.length > 0) {
          const allWorkers = await (prisma as any).workClockWorker.findMany()
          const allowedWorkerIds = allWorkers
            .filter((w: any) => {
              if (w.id === viewerWorker.id) return true
              let wTeams: string[] = []
              try {
                if (w.teams) {
                  wTeams = JSON.parse(w.teams || '[]')
                }
              } catch {
                // パース失敗時は除外
              }
              return wTeams.some((t) => viewerTeams.includes(t))
            })
            .map((w: any) => w.id)

          if (allowedWorkerIds.length === 0) {
            // 閲覧可能なワーカーがいない場合は空配列を返す
            return NextResponse.json([], { status: 200 })
          }

          where.workerId = { in: allowedWorkerIds }
        } else {
          // チーム未設定なら自分だけ
          where.workerId = viewerWorker.id
        }
      }
    }
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    const entries = await (prisma as any).workClockTimeEntry.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeId: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // 日付を文字列形式に変換
    const formattedEntries = entries.map((entry) => {
      const d = new Date(entry.date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')

      return {
        ...entry,
        date: `${year}-${month}-${day}`, // ローカルタイム基準のYYYY-MM-DD形式
      }
    })

    return NextResponse.json(formattedEntries)
  } catch (error: any) {
    console.error('WorkClock time entries取得エラー:', error)
    console.error('エラー詳細:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    })
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      {
        error: '時間記録の取得に失敗しました',
        ...(isDev && {
          details: error?.message || 'Unknown error',
          code: error?.code,
          name: error?.name,
        }),
      },
      { status: 500 }
    )
  }
}

// POST: 新しい時間記録を作成
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { workerId, date, startTime, endTime, breakMinutes, notes } = body as any

    // 必須項目チェック
    if (!workerId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // Prisma Clientが古く、WorkClockモデルを持っていない場合の防御
    const hasWorkClockWorkerModel =
      (prisma as any)?.workClockWorker &&
      typeof (prisma as any).workClockWorker.findUnique === 'function'
    const hasWorkClockTimeEntryModel =
      (prisma as any)?.workClockTimeEntry &&
      typeof (prisma as any).workClockTimeEntry.create === 'function'

    if (!hasWorkClockWorkerModel || !hasWorkClockTimeEntryModel) {
      console.warn('[WorkClock API] Prisma Client が古いか、WorkClockモデルが未定義です。')
      return NextResponse.json(
        { error: 'データベースモデルが利用できません。Prisma Client の再生成が必要です。' },
        { status: 503 }
      )
    }

    // ワーカーの存在確認と権限チェック
    const worker = await (prisma as any).workClockWorker.findUnique({
      where: { id: workerId },
    })

    if (!worker) {
      return NextResponse.json({ error: 'ワーカーが見つかりません' }, { status: 404 })
    }

    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const isOwner = worker.employeeId === userId
    const hasPermission = allowedRoles.includes(user.role || '')

    // WorkClock上のリーダー（role === 'admin'）は、閲覧のみ許可し、追加は不可
    let isLeader = false
    if (!hasPermission) {
      try {
        const viewerWorker = await (prisma as any).workClockWorker.findUnique({
          where: { employeeId: userId },
        })
        if (viewerWorker?.role === 'admin') {
          isLeader = true
        }
      } catch (e) {
        console.warn('[WorkClock API] leader check failed (time-entries POST):', e)
      }
    }

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }
    if (isLeader) {
      return NextResponse.json({ error: 'リーダーは勤務記録を追加できません' }, { status: 403 })
    }

    // 先月以前の勤務記録の新規追加は、当月3日以降は総務・管理者のみ許可
    try {
      const entryDate = new Date(date)
      if (isLockedPastEntry(entryDate)) {
        const lockError = ensureCanEditLockedEntry(user.role)
        if (lockError) {
          return lockError
        }
      }
    } catch (e) {
      console.warn('[WorkClock API] entryDate parse error (time-entries POST):', e)
    }

    // 時給パターン／回数パターンを正しく保存する
    const rawWagePattern = (body as any).wagePattern
    const rawCountPattern = (body as any).countPattern
    const rawCount = (body as any).count

    // wagePattern:
    //  - フロントから何も送られてこない（undefined）の場合のみ A をデフォルトにする
    //  - null が明示的に送られてきた場合は「時給なし」として null を保存
    let wagePatternToSave: 'A' | 'B' | 'C' | null
    if (rawWagePattern === undefined) {
      wagePatternToSave = 'A'
    } else if (rawWagePattern === null) {
      wagePatternToSave = null
    } else if (rawWagePattern === 'A' || rawWagePattern === 'B' || rawWagePattern === 'C') {
      wagePatternToSave = rawWagePattern
    } else {
      wagePatternToSave = null
    }

    // countPattern: A/B/C 以外は無視
    let countPatternToSave: 'A' | 'B' | 'C' | null = null
    if (rawCountPattern === 'A' || rawCountPattern === 'B' || rawCountPattern === 'C') {
      countPatternToSave = rawCountPattern
    }

    // count: 数値のみ採用（それ以外はnull）
    const countToSave =
      typeof rawCount === 'number' && !Number.isNaN(rawCount) ? rawCount : null

    const entry = await (prisma as any).workClockTimeEntry.create({
      data: {
        workerId,
        date: new Date(date),
        startTime,
        endTime,
        breakMinutes: breakMinutes || 0,
        notes,
        wagePattern: wagePatternToSave,
        countPattern: countPatternToSave,
        count: countToSave,
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

    const d = new Date(entry.date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return NextResponse.json({
      ...entry,
      date: `${year}-${month}-${day}`,
    })
  } catch (error: any) {
    console.error('WorkClock time entry作成エラー:', error)
    console.error('エラー詳細:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    })
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      {
        error: '時間記録の作成に失敗しました',
        ...(isDev && {
          details: error?.message || 'Unknown error',
          code: error?.code,
          name: error?.name,
        }),
      },
      { status: 500 }
    )
  }
}

