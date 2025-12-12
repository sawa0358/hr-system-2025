import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: CSV形式でエクスポート
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

    if (!workerId) {
      return NextResponse.json({ error: 'workerIdが必要です' }, { status: 400 })
    }

    // ワーカー情報を取得
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

    // 時間記録を取得
    const where: any = { workerId }
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
      orderBy: {
        date: 'asc',
      },
    })

    // CSV形式に変換
    const csvHeader = '日付,開始時刻,終了時刻,休憩時間(分),勤務時間(時間),備考\n'
    const csvRows = entries.map((entry) => {
      const date = entry.date.toISOString().split('T')[0]
      const start = new Date(`2000-01-01T${entry.startTime}`)
      const end = new Date(`2000-01-01T${entry.endTime}`)
      const breakMs = entry.breakMinutes * 60 * 1000
      const workMs = end.getTime() - start.getTime() - breakMs
      const workHours = (workMs / (1000 * 60 * 60)).toFixed(2)
      
      return `${date},${entry.startTime},${entry.endTime},${entry.breakMinutes},${workHours},"${entry.notes || ''}"`
    }).join('\n')

    const csv = csvHeader + csvRows

    // ファイル名を生成
    const monthName = year && month ? `${year}年${month}月` : '全期間'
    const filename = `${worker.name}_${monthName}_勤務時間.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('CSVエクスポートエラー:', error)
    return NextResponse.json(
      { error: 'CSVエクスポートに失敗しました' },
      { status: 500 }
    )
  }
}












