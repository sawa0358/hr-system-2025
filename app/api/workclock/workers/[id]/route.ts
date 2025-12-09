import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 特定のワーカーを取得
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
      where: { id: userId as string },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const workerId = params.id as string
    const worker = await prisma.workClockWorker.findUnique({
      where: { id: workerId },
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

    if (!worker) {
      return NextResponse.json({ error: 'ワーカーが見つかりません' }, { status: 404 })
    }

    // 権限チェック: 本人またはサブマネージャー以上、もしくは
    // WorkClock 上でリーダー（role === 'admin'）かつ同じチームのメンバー
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    const isOwner = worker.employeeId === (userId as string)
    const hasPermission = allowedRoles.includes(user.role || '')

    let isLeaderOfSameTeam = false
    if (!isOwner && !hasPermission) {
      try {
        // 自分自身の WorkClockWorker レコードを取得して、リーダーかどうかを判定
        const viewerWorker = await prisma.workClockWorker.findUnique({
          where: { employeeId: userId as string },
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
        console.warn('[WorkClock API] leader same-team check failed:', e)
      }
    }

    if (!isOwner && !hasPermission && !isLeaderOfSameTeam) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    return NextResponse.json({
      ...worker,
      teams: worker.teams ? JSON.parse(worker.teams) : [],
    })
  } catch (error: any) {
    console.error('WorkClock worker取得エラー:', error)
    console.error('エラー詳細:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    })
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      {
        error: 'ワーカーの取得に失敗しました',
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

// PUT: ワーカーを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // エラー時に request body を安全にログへ出すための一時変数
  let requestBody: any = null
  const workerId = params.id as string

  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報を取得
    const user = await prisma.employee.findUnique({
      where: { id: userId as string },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const worker = await prisma.workClockWorker.findUnique({
      where: { id: workerId },
    })

    if (!worker) {
      return NextResponse.json({ error: 'ワーカーが見つかりません' }, { status: 404 })
    }

    // 権限チェック: サブマネージャー以上のみ
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    if (!user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const body = await request.json()
    requestBody = body
    const {
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
      countPatternLabelA,
      countPatternLabelB,
      countPatternLabelC,
      countRateA,
      countRateB,
      countRateC,
      monthlyFixedAmount,
      monthlyFixedEnabled,
      teams,
      role,
      notes,
      transferDestination,
      billingTaxEnabled,
      billingTaxRate,
      withholdingTaxEnabled,
    } = body

    const updated = await prisma.workClockWorker.update({
      where: { id: workerId },
      data: {
        companyName,
        qualifiedInvoiceNumber,
        chatworkId,
        email,
        phone,
        address,
        hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : undefined,
        wagePatternLabelA,
        wagePatternLabelB,
        wagePatternLabelC,
        hourlyRateB:
          hourlyRateB === null
            ? null
            : hourlyRateB !== undefined
            ? parseFloat(hourlyRateB)
            : undefined,
        hourlyRateC:
          hourlyRateC === null
            ? null
            : hourlyRateC !== undefined
            ? parseFloat(hourlyRateC)
            : undefined,
        countPatternLabelA,
        countPatternLabelB,
        countPatternLabelC,
        countRateA:
          countRateA === null
            ? null
            : countRateA !== undefined
            ? parseFloat(countRateA)
            : undefined,
        countRateB:
          countRateB === null
            ? null
            : countRateB !== undefined
            ? parseFloat(countRateB)
            : undefined,
        countRateC:
          countRateC === null
            ? null
            : countRateC !== undefined
            ? parseFloat(countRateC)
            : undefined,
        monthlyFixedAmount:
          monthlyFixedAmount !== undefined && monthlyFixedAmount !== null
            ? parseInt(monthlyFixedAmount, 10)
            : undefined,
        monthlyFixedEnabled:
          monthlyFixedEnabled !== undefined && monthlyFixedEnabled !== null
            ? Boolean(monthlyFixedEnabled)
            : undefined,
        billingTaxEnabled:
          billingTaxEnabled !== undefined && billingTaxEnabled !== null
            ? Boolean(billingTaxEnabled)
            : undefined,
        billingTaxRate:
          billingTaxRate === null
            ? null
            : billingTaxRate !== undefined && Number.isFinite(Number(billingTaxRate))
            ? Number(billingTaxRate)
            : undefined,
        withholdingTaxEnabled:
          withholdingTaxEnabled !== undefined && withholdingTaxEnabled !== null
            ? Boolean(withholdingTaxEnabled)
            : undefined,
        teams: teams !== undefined ? (Array.isArray(teams) ? JSON.stringify(teams) : null) : undefined,
        role,
        notes,
        transferDestination,
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
      ...updated,
      teams: updated.teams ? JSON.parse(updated.teams) : [],
    })
  } catch (error: any) {
    console.error('WorkClock worker更新エラー:', error)
    console.error('エラー詳細:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
      workerId,
      requestBody, // デバッグ用にbodyの中身も出力（パスワード等は注意が必要だが開発環境前提）
    })

    const isDev = true // process.env.NODE_ENV === 'development' // 強制的に詳細を表示
    return NextResponse.json(
      {
        error: 'ワーカーの更新に失敗しました',
        details: error?.message || 'Unknown error', // 詳細を常に含める
        code: error?.code,
        name: error?.name,
      },
      { status: 500 }
    )
  }
}

// DELETE: ワーカーを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workerId = params.id as string

    // x-employee-id が無い場合は認証エラー
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報を取得（権限チェック用）
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

    // 時間記録は外部キー制約の影響を避けるため、先に明示的に削除しておく
    await (prisma as any).workClockTimeEntry.deleteMany({
      where: { workerId },
    })

    // WorkClockWorker 自体も deleteMany で「存在しなくても成功扱い」とする
    await (prisma as any).workClockWorker.deleteMany({
      where: { id: workerId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('WorkClock worker削除エラー:', error)
    console.error('エラー詳細:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    })
    // ローカル開発用に詳細をレスポンスにも含める
    return NextResponse.json(
      { 
        error: 'ワーカーの削除に失敗しました',
        details: error?.message || 'Unknown error',
        code: error?.code,
        name: error?.name,
      },
      { status: 500 }
    )
  }
}

