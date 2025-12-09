import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// MasterDataのタイプ定義
const TEAM_TYPE = 'workclock_team'

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

    // MasterDataからチーム一覧を取得
    const teamRecords = await prisma.masterData.findMany({
      where: {
        type: TEAM_TYPE,
      },
      orderBy: {
        order: 'asc',
      },
    })

    // MasterDataに保存されているチーム名を取得
    const masterTeams = teamRecords.map(r => r.value)

    // 互換性のため: ワーカーに紐づいているチームも取得（既存データ用）
    const workers = await prisma.workClockWorker.findMany({
      select: {
        teams: true,
      },
    })

    const workerTeamSet = new Set<string>()
    workers.forEach((worker) => {
      if (worker.teams) {
        try {
          const teams = JSON.parse(worker.teams)
          if (Array.isArray(teams)) {
            teams.forEach((team: string) => workerTeamSet.add(team))
          }
        } catch (error) {
          console.error('チーム情報のパースエラー:', error)
        }
      }
    })

    // MasterDataとワーカーのチームを結合して重複排除
    const allTeams = new Set([...masterTeams, ...workerTeamSet])
    const teams = Array.from(allTeams).sort()

    return NextResponse.json({ teams })
  } catch (error: any) {
    console.error('WorkClock teams取得エラー:', error)
    return NextResponse.json(
      { error: 'チーム一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新しいチームを作成（MasterDataに永続保存）
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

    const teamName = name.trim()

    // MasterDataに既存のチームがあるかチェック
    const existingTeam = await prisma.masterData.findUnique({
      where: {
        type_value: {
          type: TEAM_TYPE,
          value: teamName,
        },
      },
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'このチーム名は既に登録されています' },
        { status: 400 }
      )
    }

    // ワーカーに紐づいているチームもチェック（互換性のため）
    const workers = await prisma.workClockWorker.findMany({
      select: {
        teams: true,
      },
    })

    const workerTeamSet = new Set<string>()
    workers.forEach((worker) => {
      if (worker.teams) {
        try {
          const teams = JSON.parse(worker.teams)
          if (Array.isArray(teams)) {
            teams.forEach((team: string) => workerTeamSet.add(team))
          }
        } catch (error) {
          console.error('チーム情報のパースエラー:', error)
        }
      }
    })

    if (workerTeamSet.has(teamName)) {
      return NextResponse.json(
        { error: 'このチーム名は既に登録されています' },
        { status: 400 }
      )
    }

    // 現在のチーム数を取得して順序番号を決定
    const existingCount = await prisma.masterData.count({
      where: {
        type: TEAM_TYPE,
      },
    })

    // MasterDataに新しいチームを保存
    await prisma.masterData.create({
      data: {
        type: TEAM_TYPE,
        value: teamName,
        label: teamName,
        order: existingCount,
      },
    })

    console.log(`[WorkClock] チーム「${teamName}」をMasterDataに保存しました`)

    return NextResponse.json({ success: true, name: teamName })
  } catch (error: any) {
    console.error('WorkClock team作成エラー:', error)
    
    return NextResponse.json(
      { error: 'チームの作成に失敗しました: ' + (error.message || '不明なエラー') },
      { status: 500 }
    )
  }
}

// DELETE: チームを削除（MasterDataと全ワーカーから削除）
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

    // MasterDataから削除
    try {
      await prisma.masterData.delete({
        where: {
          type_value: {
            type: TEAM_TYPE,
            value: teamName,
          },
        },
      })
      console.log(`[WorkClock] チーム「${teamName}」をMasterDataから削除しました`)
    } catch (e) {
      // MasterDataに存在しない場合は無視（ワーカーに紐づいているだけの古いデータの可能性）
      console.log(`[WorkClock] チーム「${teamName}」はMasterDataに存在しませんでした`)
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
      message: `チーム「${teamName}」を削除しました（${updatedCount}人のワーカーから除外）` 
    })
  } catch (error: any) {
    console.error('WorkClock team削除エラー:', error)
    return NextResponse.json(
      { error: 'チームの削除に失敗しました' },
      { status: 500 }
    )
  }
}

