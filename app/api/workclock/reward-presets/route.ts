import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: プリセット一覧を取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')

    if (!workerId) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 })
    }

    // Prisma Clientの確認
    if (!(prisma as any).workClockRewardPreset) {
        console.error('[WorkClock API] WorkClockRewardPresetモデルがPrismaClientに存在しません。サーバー再起動が必要です。')
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

    const isOwner = worker.employeeId === userId
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const hasPermission = allowedRoles.includes(user?.role || '')

    if (!isOwner && !hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const presets = await (prisma as any).workClockRewardPreset.findMany({
      where: { workerId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(presets)
  } catch (error: any) {
    console.error('WorkClock presets取得エラー:', error)
    return NextResponse.json(
      { error: 'プリセットの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新しいプリセットを作成
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { workerId, amount, description } = body

    if (!workerId || amount === undefined || !description) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // Prisma Clientの確認
    if (!(prisma as any).workClockWorker || !(prisma as any).workClockRewardPreset) {
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

    const isOwner = worker.employeeId === userId
    const user = await prisma.employee.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const hasPermission = allowedRoles.includes(user?.role || '')

    if (!isOwner && !hasPermission) {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const preset = await (prisma as any).workClockRewardPreset.create({
      data: {
        workerId,
        amount: Number(amount),
        description,
        isEnabled: true,
      },
    })

    return NextResponse.json(preset)
  } catch (error: any) {
    console.error('WorkClock preset作成エラー:', error)
    return NextResponse.json(
      { error: 'プリセットの作成に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: プリセットを削除
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Prisma Clientの確認
        if (!(prisma as any).workClockRewardPreset) {
            console.error('[WorkClock API] WorkClockRewardPresetモデルがPrismaClientに存在しません。サーバー再起動が必要です。')
            return NextResponse.json(
              { error: 'システムエラー: データベースモデルが読み込まれていません。開発サーバーを再起動してください。' },
              { status: 503 }
            )
        }

        const preset = await (prisma as any).workClockRewardPreset.findUnique({
            where: { id },
            include: { worker: true }
        })

        if (!preset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const isOwner = preset.worker.employeeId === userId
        const user = await prisma.employee.findUnique({ where: { id: userId }, select: { role: true } })
        const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
        const hasPermission = allowedRoles.includes(user?.role || '')

        if (!isOwner && !hasPermission) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await (prisma as any).workClockRewardPreset.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete preset error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
