import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: ワーカー登録可能な従業員一覧を取得（既存ワーカーを除外）
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

    // 権限チェック: サブマネージャー以上のみ
    const allowedRoles = ['sub_manager', 'store_manager', 'manager', 'hr', 'admin']
    if (!allowedRoles.includes(user.role || '')) {
      // WorkClock リーダー（ワーカーでadminロール）かどうかも確認
      const hasWorkClockModel =
        (prisma as any)?.workClockWorker &&
        typeof (prisma as any).workClockWorker.findUnique === 'function'

      if (hasWorkClockModel) {
        const viewerWorker = await (prisma as any).workClockWorker.findUnique({
          where: { employeeId: userId },
        })
        if (!viewerWorker || viewerWorker.role !== 'admin') {
          return NextResponse.json({ error: '権限がありません' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
      }
    }

    // 既存のワーカーのemployeeIdを取得
    const hasWorkClockModel =
      (prisma as any)?.workClockWorker &&
      typeof (prisma as any).workClockWorker.findMany === 'function'

    let existingWorkerIds: string[] = []
    if (hasWorkClockModel) {
      const existingWorkers = await (prisma as any).workClockWorker.findMany({
        select: { employeeId: true },
      })
      existingWorkerIds = existingWorkers.map((w: any) => w.employeeId)
    }

    // 業務委託・外注先の従業員で、まだワーカー登録されていない人を取得
    const candidates = await prisma.employee.findMany({
      where: {
        // すでにワーカー登録されている従業員を除外
        id: {
          notIn: existingWorkerIds,
        },
        // 有効なステータスのみ（退職者や停止中を除外）
        status: 'active',
        isSuspended: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        employeeType: true,
        furigana: true,
        address: true,
      },
      orderBy: [
        { employeeType: 'asc' },
        { name: 'asc' },
      ],
    })

    console.log(`[WorkClock API] Found ${candidates.length} worker candidates (excluded ${existingWorkerIds.length} existing workers)`)

    return NextResponse.json({ candidates })
  } catch (error: any) {
    console.error('WorkClock worker candidates取得エラー:', error)
    
    // 開発環境では詳細なエラー情報を返す
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      {
        error: 'ワーカー候補一覧の取得に失敗しました',
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









