import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Excel形式でエクスポート（CSV形式で返すが、Excelで開ける形式）
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

    // Excel形式（タブ区切り）に変換
    const excelHeader = '日付\t開始時刻\t終了時刻\t休憩時間(分)\t勤務時間(時間)\t時給\t報酬\t備考\n'
    const excelRows = entries.map((entry) => {
      const date = entry.date.toISOString().split('T')[0]
      const start = new Date(`2000-01-01T${entry.startTime}`)
      const end = new Date(`2000-01-01T${entry.endTime}`)
      const breakMs = entry.breakMinutes * 60 * 1000
      const workMs = end.getTime() - start.getTime() - breakMs
      const workHours = (workMs / (1000 * 60 * 60)).toFixed(2)
      const amount = (parseFloat(workHours) * worker.hourlyRate).toFixed(0)
      
      return `${date}\t${entry.startTime}\t${entry.endTime}\t${entry.breakMinutes}\t${workHours}\t${worker.hourlyRate}\t${amount}\t${entry.notes || ''}`
    }).join('\n')

    // 合計行を追加
    const totalHours = entries.reduce((sum, entry) => {
      const start = new Date(`2000-01-01T${entry.startTime}`)
      const end = new Date(`2000-01-01T${entry.endTime}`)
      const breakMs = entry.breakMinutes * 60 * 1000
      const workMs = end.getTime() - start.getTime() - breakMs
      return sum + workMs / (1000 * 60 * 60)
    }, 0)
    const totalAmount = (totalHours * worker.hourlyRate).toFixed(0)
    const totalRow = `\n合計\t\t\t\t${totalHours.toFixed(2)}\t${worker.hourlyRate}\t${totalAmount}\t`

    const excel = excelHeader + excelRows + totalRow

    // ファイル名を生成
    const monthName = year && month ? `${year}年${month}月` : '全期間'
    const filename = `${worker.name}_${monthName}_勤務時間.xls`

    return new NextResponse(excel, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Excelエクスポートエラー:', error)
    return NextResponse.json(
      { error: 'Excelエクスポートに失敗しました' },
      { status: 500 }
    )
  }
}











