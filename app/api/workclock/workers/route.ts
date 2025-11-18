import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: ワーカー一覧を取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報を取得
    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true, employeeType: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    // 権限チェック: サブマネージャー以上、または業務委託・外注先のワーカー
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const isAdmin = allowedRoles.includes(user.role || '')
    const employeeType = user.employeeType || ''
    const isWorker = employeeType.includes('業務委託') || employeeType.includes('外注先')
    
    if (!isAdmin && !isWorker) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // Prisma Clientが古く、WorkClockWorkerモデルを持っていない場合の防御
    const hasWorkClockModel =
      (prisma as any)?.workClockWorker &&
      typeof (prisma as any).workClockWorker.findMany === 'function'

    if (!hasWorkClockModel) {
      console.warn('[WorkClock API] prisma.workClockWorker が未定義です。Prisma Client の再生成が必要です。')
      // フロントが落ちないよう一旦空配列を返す（メンテ表示は別途検討）
      return NextResponse.json([], { status: 200 })
    }

    // 自分自身の WorkClockWorker レコードを取得（存在すればリーダー判定に使用）
    let viewerWorkerRecord: any = null
    try {
      viewerWorkerRecord = await (prisma as any).workClockWorker.findUnique({
        where: { employeeId: userId },
      })
    } catch (e) {
      console.warn('[WorkClock API] viewerWorkerRecord の取得に失敗しました:', e)
    }
    const isWorkClockLeader = viewerWorkerRecord?.role === 'admin'

    // ワーカー権限のユーザーの場合は、本来は自分だけだが、
    // WorkClock 上でリーダー（role === 'admin'）なら、一旦全ワーカーを取得して後でチームで絞り込む
    const whereClause = isAdmin || isWorkClockLeader
      ? {} // 管理者（HRロール）または WorkClock リーダーは一旦全ワーカーを取得
      : { employeeId: userId } // それ以外のワーカーは自分のレコードのみ
    
    const workers = await (prisma as any).workClockWorker.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`[WorkClock API] Found ${workers.length} workers`)

    // teamsをJSONから配列に変換
    const formattedWorkers = workers.map((worker) => {
      let teams: string[] = []
      if (worker.teams) {
        try {
          teams = JSON.parse(worker.teams)
        } catch (e) {
          console.warn(`WorkClock worker ${worker.id}のteamsパースエラー:`, e)
          teams = []
        }
      }
      return {
        ...worker,
        teams,
        employeeType: worker.employee?.employeeType || null,
      }
    })

    // WorkClock 上で「管理者（=リーダー）」ロールを持つワーカーは、
    // 自分と「同じチームに所属するワーカー／管理者」だけを閲覧できるように絞り込む
    const viewerWorker = formattedWorkers.find((w) => w.employeeId === userId)
    if (viewerWorker && viewerWorker.role === 'admin') {
      const viewerTeams: string[] = viewerWorker.teams || []
      if (viewerTeams.length > 0) {
        const limitedWorkers = formattedWorkers.filter((w) => {
          if (w.id === viewerWorker.id) return true
          const wTeams: string[] = w.teams || []
          return wTeams.some((t) => viewerTeams.includes(t))
        })
        return NextResponse.json(limitedWorkers)
      }
    }

    return NextResponse.json(formattedWorkers)
  } catch (error: any) {
    console.error('WorkClock workers取得エラー:', error)
    console.error('エラー詳細:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    })

    // マイグレーション未適用やテーブル未作成時（開発中）の一時的な救済:
    // Prisma/SQLite: P2021（テーブルが存在しない）, P2022（列が存在しない）
    // SQLiteエンジンの素のエラー文言: "no such table" など
    const message: string = String(error?.message || '')
    const prismaCode: string | undefined = error?.code
    const isMissingTable =
      prismaCode === 'P2021' ||
      prismaCode === 'P2022' ||
      message.toLowerCase().includes('no such table') ||
      message.toLowerCase().includes('does not exist')

    if (isMissingTable) {
      console.warn('[WorkClock API] テーブル未作成のため空配列を返します（開発用フェイルセーフ）')
      return NextResponse.json([], { status: 200 })
    }

    // 開発環境では詳細なエラー情報を返す
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      { 
        error: 'ワーカー一覧の取得に失敗しました',
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

// POST: 新しいワーカーを作成
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

    // 権限チェック: サブマネージャー以上のみ
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    if (!allowedRoles.includes(user.role || '')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // Prisma Clientが古く、WorkClockWorkerモデルを持っていない場合の防御
    const hasWorkClockModel =
      (prisma as any)?.workClockWorker &&
      typeof (prisma as any).workClockWorker.create === 'function'
    if (!hasWorkClockModel) {
      console.warn('[WorkClock API] prisma.workClockWorker が未定義です。Prisma Client の再生成が必要です。')
      return NextResponse.json(
        { error: 'サーバー初期化中です。数秒後に再試行してください。' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      employeeId,
      name,
      password,
      companyName,
      qualifiedInvoiceNumber,
      chatworkId,
      email,
      phone,
      address,
      hourlyRate,
      // WorkClock拡張フィールド
      wagePatternLabelA,
      wagePatternLabelB,
      wagePatternLabelC,
      hourlyRateB,
      hourlyRateC,
      monthlyFixedAmount,
      monthlyFixedEnabled,
      teams,
      role,
      notes,
    } = body

    // 必須項目チェック
    if (!employeeId || !name || !email || hourlyRate === undefined) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // 既存のワーカーをチェック
    const existing = await (prisma as any).workClockWorker.findUnique({
      where: { employeeId },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'この社員は既にワーカーとして登録されています' },
        { status: 400 }
      )
    }

    const worker = await (prisma as any).workClockWorker.create({
      data: {
        employeeId,
        name,
        password,
        companyName,
        qualifiedInvoiceNumber,
        chatworkId,
        email,
        phone,
        address,
        hourlyRate: parseFloat(hourlyRate),
        // ラベル・追加パターン・月額固定（任意）
        wagePatternLabelA,
        wagePatternLabelB,
        wagePatternLabelC,
        hourlyRateB: hourlyRateB !== undefined && hourlyRateB !== null ? parseFloat(hourlyRateB) : undefined,
        hourlyRateC: hourlyRateC !== undefined && hourlyRateC !== null ? parseFloat(hourlyRateC) : undefined,
        monthlyFixedAmount:
          monthlyFixedAmount !== undefined && monthlyFixedAmount !== null
            ? parseInt(monthlyFixedAmount, 10)
            : undefined,
        monthlyFixedEnabled: monthlyFixedEnabled ?? false,
        teams: teams && Array.isArray(teams) ? JSON.stringify(teams) : null,
        role: role || 'worker',
        notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...worker,
      teams: worker.teams ? JSON.parse(worker.teams) : [],
    })
  } catch (error: any) {
    console.error('WorkClock worker作成エラー:', error)
    console.error('エラー詳細:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    })

    // マイグレーション未適用やテーブル未作成時（開発中）の一時的な救済
    const message: string = String(error?.message || '')
    const prismaCode: string | undefined = error?.code
    const isMissingTable =
      prismaCode === 'P2021' ||
      prismaCode === 'P2022' ||
      message.toLowerCase().includes('no such table') ||
      message.toLowerCase().includes('does not exist')

    if (isMissingTable) {
      console.warn('[WorkClock API] テーブル未作成のため503を返します')
      return NextResponse.json(
        { error: 'データベーステーブルが作成されていません。Prismaマイグレーションを実行してください。' },
        { status: 503 }
      )
    }

    // 開発環境では詳細なエラー情報を返す
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      {
        error: 'ワーカーの作成に失敗しました',
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

