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

    // 全ワーカーのチーム情報を取得
    const workers = await prisma.workClockWorker.findMany({
      select: {
        teams: true,
      },
    })

    // 全てのチーム名を収集して重複を削除
    const teamSet = new Set<string>()
    workers.forEach((worker) => {
      if (worker.teams) {
        try {
          const teams = JSON.parse(worker.teams)
          if (Array.isArray(teams)) {
            teams.forEach((team: string) => teamSet.add(team))
          }
        } catch (error) {
          console.error('チーム情報のパースエラー:', error)
        }
      }
    })

    const teams = Array.from(teamSet).sort()

    return NextResponse.json({ teams })
  } catch (error: any) {
    console.error('WorkClock teams取得エラー:', error)
    return NextResponse.json(
      { error: 'チーム一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新しいチームを作成（実際にはチーム名の検証のみ）
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

    // 既存のチーム一覧を取得
    const workers = await prisma.workClockWorker.findMany({
      select: {
        teams: true,
      },
    })

    const teamSet = new Set<string>()
    workers.forEach((worker) => {
      if (worker.teams) {
        try {
          const teams = JSON.parse(worker.teams)
          if (Array.isArray(teams)) {
            teams.forEach((team: string) => teamSet.add(team))
          }
        } catch (error) {
          console.error('チーム情報のパースエラー:', error)
        }
      }
    })

    // 重複チェック
    if (teamSet.has(name.trim())) {
      return NextResponse.json(
        { error: 'このチーム名は既に登録されています' },
        { status: 400 }
      )
    }

    // チームはワーカーに紐づいて保存されるため、ここでは成功を返すのみ
    return NextResponse.json({ success: true, name: name.trim() })
  } catch (error: any) {
    console.error('WorkClock team作成エラー:', error)
    
    return NextResponse.json(
      { error: 'チームの作成に失敗しました: ' + (error.message || '不明なエラー') },
      { status: 500 }
    )
  }
}

// DELETE: チームを削除（全ワーカーから該当チーム名を削除）
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

    // 該当チームを持つ全ワーカーを取得
    const workers = await prisma.workClockWorker.findMany({
      select: {
        id: true,
        teams: true,
      },
    })

    let updatedCount = 0

    // 各ワーカーのteamsフィールドから該当チームを削除
    for (const worker of workers) {
      if (worker.teams) {
        try {
          const teams = JSON.parse(worker.teams)
          if (Array.isArray(teams) && teams.includes(teamName)) {
            const updatedTeams = teams.filter((t: string) => t !== teamName)
            await prisma.workClockWorker.update({
              where: { id: worker.id },
              data: {
                teams: JSON.stringify(updatedTeams),
              },
            })
            updatedCount++
          }
        } catch (error) {
          console.error(`ワーカー ${worker.id} のチーム情報更新エラー:`, error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${updatedCount}人のワーカーからチーム「${teamName}」を削除しました` 
    })
  } catch (error: any) {
    console.error('WorkClock team削除エラー:', error)
    return NextResponse.json(
      { error: 'チームの削除に失敗しました' },
      { status: 500 }
    )
  }
}

