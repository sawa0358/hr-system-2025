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

    // workerIdが指定されている場合、本人または権限者でないとアクセス不可
    if (workerId) {
      const worker = await prisma.workClockWorker.findUnique({
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

    const entries = await prisma.workClockTimeEntry.findMany({
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
  } catch (error) {
    console.error('WorkClock time entries取得エラー:', error)
    return NextResponse.json(
      { error: '時間記録の取得に失敗しました' },
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

    // ワーカーの存在確認と権限チェック
    const worker = await prisma.workClockWorker.findUnique({
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

    const entry = await prisma.workClockTimeEntry.create({
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
  } catch (error) {
    console.error('WorkClock time entry作成エラー:', error)
    return NextResponse.json(
      { error: '時間記録の作成に失敗しました' },
      { status: 500 }
    )
  }
}

