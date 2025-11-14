import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // workerIdが指定されている場合、本人または権限者でないとアクセス不可
    if (workerId) {
      const worker = await (prisma as any).workClockWorker.findUnique({
        where: { id: workerId },
      })

      if (!worker) {
        return NextResponse.json({ error: 'ワーカーが見つかりません' }, { status: 404 })
      }

      const isOwner = worker.employeeId === userId
      if (!isOwner && !hasPermission) {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
      }
    } else if (!hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const where: any = {}
    if (workerId) {
      where.workerId = workerId
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
    const formattedEntries = entries.map((entry) => ({
      ...entry,
      date: entry.date.toISOString().split('T')[0], // YYYY-MM-DD形式
    }))

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
    const { workerId, date, startTime, endTime, breakMinutes, notes } = body

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

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const entry = await (prisma as any).workClockTimeEntry.create({
      data: {
        workerId,
        date: new Date(date),
        startTime,
        endTime,
        breakMinutes: breakMinutes || 0,
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
      ...entry,
      date: entry.date.toISOString().split('T')[0],
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

