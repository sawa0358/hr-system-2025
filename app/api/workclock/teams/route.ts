import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: チーム一覧を取得
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

    // 権限チェック（総務・管理者のみ）
    const allowedRoles = ['hr', 'admin']
    const hasPermission = allowedRoles.includes(user.role || '')

    if (!hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // Prisma Clientの確認
    if (!(prisma as any).workClockTeam) {
      console.error('[WorkClock API] WorkClockTeamモデルがPrismaClientに存在しません。サーバー再起動が必要です。')
      return NextResponse.json(
        { error: 'システムエラー: データベースモデルが読み込まれていません。開発サーバーを再起動してください。' },
        { status: 503 }
      )
    }

    const teams = await (prisma as any).workClockTeam.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(teams)
  } catch (error: any) {
    console.error('WorkClock teams取得エラー:', error)
    return NextResponse.json(
      { error: 'チーム一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新しいチームを作成
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
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'チーム名が必要です' },
        { status: 400 }
      )
    }

    // 権限チェック（総務・管理者のみ）
    const allowedRoles = ['hr', 'admin']
    const hasPermission = allowedRoles.includes(user.role || '')

    if (!hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // Prisma Clientの確認
    if (!(prisma as any).workClockTeam) {
      console.error('[WorkClock API] WorkClockTeamモデルがPrismaClientに存在しません。サーバー再起動が必要です。')
      return NextResponse.json(
        { error: 'システムエラー: データベースモデルが読み込まれていません。開発サーバーを再起動してください。' },
        { status: 503 }
      )
    }

    // 重複チェック
    const existingTeam = await (prisma as any).workClockTeam.findUnique({
      where: { name: name.trim() },
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'このチーム名は既に登録されています' },
        { status: 400 }
      )
    }

    const team = await (prisma as any).workClockTeam.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json(team)
  } catch (error: any) {
    console.error('WorkClock team作成エラー:', error)
    if (error.code) console.error('Prisma Error Code:', error.code)
    
    return NextResponse.json(
      { error: 'チームの作成に失敗しました: ' + (error.message || '不明なエラー') },
      { status: 500 }
    )
  }
}

// DELETE: チームを削除
export async function DELETE(request: NextRequest) {
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

    // 権限チェック（総務・管理者のみ）
    const allowedRoles = ['hr', 'admin']
    const hasPermission = allowedRoles.includes(user.role || '')

    if (!hasPermission) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const teamName = searchParams.get('name')

    if (!teamName) {
      return NextResponse.json(
        { error: 'チーム名が必要です' },
        { status: 400 }
      )
    }

    // Prisma Clientの確認
    if (!(prisma as any).workClockTeam) {
      console.error('[WorkClock API] WorkClockTeamモデルがPrismaClientに存在しません。サーバー再起動が必要です。')
      return NextResponse.json(
        { error: 'システムエラー: データベースモデルが読み込まれていません。開発サーバーを再起動してください。' },
        { status: 503 }
      )
    }

    const team = await (prisma as any).workClockTeam.findUnique({
      where: { name: teamName },
    })

    if (!team) {
      return NextResponse.json({ error: 'チームが見つかりません' }, { status: 404 })
    }

    await (prisma as any).workClockTeam.delete({
      where: { name: teamName },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('WorkClock team削除エラー:', error)
    return NextResponse.json(
      { error: 'チームの削除に失敗しました' },
      { status: 500 }
    )
  }
}

