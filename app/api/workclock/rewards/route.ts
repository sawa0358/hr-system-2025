import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 特別報酬一覧を取得
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

    // Prisma Clientの確認
    if (!(prisma as any).workClockReward) {
       console.error('[WorkClock API] WorkClockRewardモデルがPrismaClientに存在しません。サーバー再起動が必要です。')
       return NextResponse.json(
         { error: 'システムエラー: データベースモデルが読み込まれていません。開発サーバーを再起動してください。' },
         { status: 503 }
       )
    }

    // workerIdが指定されている場合の権限チェック
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

    const rewards = await (prisma as any).workClockReward.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(rewards)
  } catch (error: any) {
    console.error('WorkClock rewards取得エラー:', error)
    return NextResponse.json(
      { error: '特別報酬の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新しい特別報酬を作成
export async function POST(request: NextRequest) {
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
    const { workerId, date, amount, description } = body

    if (!workerId || !date || amount === undefined || !description) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // Prisma Clientの確認
    if (!(prisma as any).workClockWorker || !(prisma as any).workClockReward) {
        console.error('[WorkClock API] モデルがPrismaClientに存在しません。サーバー再起動が必要です。')
        return NextResponse.json(
          { error: 'システムエラー: データベースモデルが読み込まれていません。開発サーバーを再起動してください。' },
          { status: 503 }
        )
    }

    // 権限チェック
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

    const reward = await (prisma as any).workClockReward.create({
      data: {
        workerId,
        date: new Date(date),
        amount: Number(amount),
        description,
      },
    })

    return NextResponse.json(reward)
  } catch (error: any) {
    console.error('WorkClock reward作成エラー:', error)
    if (error.code) console.error('Prisma Error Code:', error.code)
    
    return NextResponse.json(
      { error: '特別報酬の作成に失敗しました: ' + (error.message || '不明なエラー') },
      { status: 500 }
    )
  }
}
