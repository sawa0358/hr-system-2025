import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 請求先一覧を取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || !['hr', 'admin'].includes(user.role || '')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const billingClients = await (prisma as any).workClockBillingClient.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ billingClients })
  } catch (error: any) {
    console.error('WorkClock billingClients取得エラー:', error)
    return NextResponse.json(
      { error: '請求先一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新しい請求先を作成
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

    if (!user || !['hr', 'admin'].includes(user.role || '')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '請求先名が必要です' },
        { status: 400 }
      )
    }

    const existingClient = await (prisma as any).workClockBillingClient.findUnique({
      where: { name: name.trim() },
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'この請求先名は既に登録されています' },
        { status: 400 }
      )
    }

    const billingClient = await (prisma as any).workClockBillingClient.create({
      data: { name: name.trim() },
    })

    return NextResponse.json({ success: true, billingClient })
  } catch (error: any) {
    console.error('WorkClock billingClient作成エラー:', error)
    return NextResponse.json(
      { error: '請求先の作成に失敗しました: ' + (error.message || '不明なエラー') },
      { status: 500 }
    )
  }
}

// PUT: 請求先を更新
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || !['hr', 'admin'].includes(user.role || '')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name } = body

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { error: 'IDと請求先名が必要です' },
        { status: 400 }
      )
    }

    const existingClient = await (prisma as any).workClockBillingClient.findUnique({
      where: { name: name.trim() },
    })

    if (existingClient && existingClient.id !== id) {
      return NextResponse.json(
        { error: 'この請求先名は既に他の請求先に登録されています' },
        { status: 400 }
      )
    }

    const updatedClient = await (prisma as any).workClockBillingClient.update({
      where: { id },
      data: { name: name.trim() },
    })

    return NextResponse.json({ success: true, billingClient: updatedClient })
  } catch (error: any) {
    console.error('WorkClock billingClient更新エラー:', error)
    return NextResponse.json(
      { error: '請求先の更新に失敗しました: ' + (error.message || '不明なエラー') },
      { status: 500 }
    )
  }
}

// DELETE: 請求先を削除
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

    if (!user || !['hr', 'admin'].includes(user.role || '')) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '請求先IDが必要です' },
        { status: 400 }
      )
    }

    // 請求先がワーカーに紐づいているかチェック
    const workersWithClient = await (prisma as any).workClockWorker.count({
      where: { billingClientId: id },
    })

    if (workersWithClient > 0) {
      return NextResponse.json(
        { error: 'この請求先はワーカーに紐づいているため削除できません' },
        { status: 400 }
      )
    }

    await (prisma as any).workClockBillingClient.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: '請求先を削除しました' })
  } catch (error: any) {
    console.error('WorkClock billingClient削除エラー:', error)
    return NextResponse.json(
      { error: '請求先の削除に失敗しました' },
      { status: 500 }
    )
  }
}
