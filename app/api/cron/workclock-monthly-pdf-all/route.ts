import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCombinedPDFContent } from '@/lib/workclock/pdf-export'
import puppeteer from 'puppeteer'

/**
 * Cronエンドポイント: 月次「全員分」勤務報告書PDFの自動生成と保存（給与or請求管理用）
 *
 * - 対象: WorkClockに登録されている全ワーカー（role === 'worker'）
 * - 内容: 先月1か月分の勤務記録をまとめた「全員分」のPDFを1枚生成
 * - 保存先: 給与or請求管理カテゴリー（category: 'payroll'）
 *           フォルダ名: `全員分/{YYYY}年{M}月`
 *           所有者社員: 環境変数 PAYROLL_ALL_EMPLOYEE_ID で指定した employee.id
 *
 * 実行タイミングの想定: 毎月3日0:30（日本時間）
 *   - Heroku Scheduler で毎日 3:30 PM (UTC) に実行し、日本時間で3日かどうかをチェック
 * 保護: Authorization ヘッダー or token クエリパラメータでCRON_SECRET_TOKENを検証
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック（既存の月次PDFエンドポイントと同じ方式）
    const authHeader = request.headers.get('authorization')
    const authToken = request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (expectedToken && authHeader !== `Bearer ${expectedToken}` && authToken !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 日本時間（JST = UTC + 9時間）で日付をチェック
    const now = new Date()
    const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const jstDay = jstDate.getDate()

    // 毎月3日のみ実行するためのチェック（日本時間基準）
    // Heroku Schedulerは「毎月」の指定ができないため、毎日実行させてここで日付をチェックする
    if (jstDay !== 3) {
      console.log(`[WorkClock月次PDF(全員分)] 今日は3日ではないため処理をスキップします（日本時間で${jstDay}日）`)
      return NextResponse.json({
        success: true,
        skipped: true,
        message: '今日は3日ではないため処理をスキップしました',
        jstDate: jstDate.toISOString()
      })
    }

    // 先月を計算（日本時間基準）
    const lastMonth = new Date(jstDate)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const year = lastMonth.getFullYear()
    const month = lastMonth.getMonth() + 1

    const targetMonthLabel = `${year}年${month}月`
    console.log(`[WorkClock月次PDF(全員分)] ${targetMonthLabel} のPDF生成を開始`)

    // 「全員分」PDFの所有者とする社員IDを環境変数から取得
    const allEmployeeOwnerId = process.env.PAYROLL_ALL_EMPLOYEE_ID
    if (!allEmployeeOwnerId) {
      console.error(
        '[WorkClock月次PDF(全員分)] PAYROLL_ALL_EMPLOYEE_ID が未設定のため処理を中断します'
      )
      return NextResponse.json(
        {
          error: 'PAYROLL_ALL_EMPLOYEE_ID is not configured',
          hint: '給与or請求管理「全員分」フォルダの所有者となる社員IDを環境変数に設定してください',
        },
        { status: 500 }
      )
    }

    // 対象となる全ワーカーを取得
    const workers = await prisma.workClockWorker.findMany({
      where: {
        role: 'worker',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeType: true,
          },
        },
      },
    })

    if (workers.length === 0) {
      console.log('[WorkClock月次PDF(全員分)] 対象ワーカーが存在しないため処理を終了します')
      return NextResponse.json({
        success: true,
        message: '対象ワーカーが存在しないため処理をスキップしました',
        targetMonth: targetMonthLabel,
      })
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    type WorkerForPDF = {
      id: string
      employeeId?: string
      name: string
      email: string | null
      hourlyRate: number
      hourlyRateB?: number
      hourlyRateC?: number
      wagePatternLabelA?: string
      wagePatternLabelB?: string
      wagePatternLabelC?: string
      countPatternLabelA?: string
      countPatternLabelB?: string
      countPatternLabelC?: string
      countRateA?: number
      countRateB?: number
      countRateC?: number
      monthlyFixedAmount?: number | null
      monthlyFixedEnabled?: boolean | null
      teams?: string[]
      role: 'worker' | 'admin'
      companyName?: string | null
      qualifiedInvoiceNumber?: string | null
      chatworkId?: string | null
      phone?: string | null
      address?: string | null
      notes?: string | null
    }

    type TimeEntryForPDF = {
      id: string
      workerId: string
      date: string
      startTime: string
      endTime: string
      breakMinutes: number
      notes: string
      wagePattern?: string
      countPattern?: string
      count?: number
      createdAt?: Date
    }

    const items: { worker: WorkerForPDF; entries: TimeEntryForPDF[] }[] = []

    // 各ワーカーごとに先月の時間記録を取得
    for (const worker of workers) {
      const entries = await prisma.workClockTimeEntry.findMany({
        where: {
          workerId: worker.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: 'asc',
        },
      })

      if (entries.length === 0) {
        continue
      }

      const workerForPdf: WorkerForPDF = {
        id: worker.id,
        employeeId: worker.employeeId || undefined,
        name: worker.name,
        email: worker.email,
        hourlyRate: worker.hourlyRate,
        hourlyRateB: worker.hourlyRateB || undefined,
        hourlyRateC: worker.hourlyRateC || undefined,
        wagePatternLabelA: worker.wagePatternLabelA || undefined,
        wagePatternLabelB: worker.wagePatternLabelB || undefined,
        wagePatternLabelC: worker.wagePatternLabelC || undefined,
        countPatternLabelA: worker.countPatternLabelA || undefined,
        countPatternLabelB: worker.countPatternLabelB || undefined,
        countPatternLabelC: worker.countPatternLabelC || undefined,
        countRateA: worker.countRateA || undefined,
        countRateB: worker.countRateB || undefined,
        countRateC: worker.countRateC || undefined,
        monthlyFixedAmount: worker.monthlyFixedAmount || undefined,
        monthlyFixedEnabled: worker.monthlyFixedEnabled || undefined,
        teams: worker.teams ? JSON.parse(worker.teams) : [],
        role: worker.role as 'worker' | 'admin',
        companyName: worker.companyName || undefined,
        qualifiedInvoiceNumber: worker.qualifiedInvoiceNumber || undefined,
        chatworkId: worker.chatworkId || undefined,
        phone: worker.phone || undefined,
        address: worker.address || undefined,
        notes: worker.notes || undefined,
      }

      const entriesForPdf: TimeEntryForPDF[] = entries.map((e) => ({
        id: e.id,
        workerId: e.workerId,
        date: e.date.toISOString().split('T')[0],
        startTime: e.startTime,
        endTime: e.endTime,
        breakMinutes: e.breakMinutes,
        notes: e.notes || '',
        wagePattern: e.wagePattern || undefined,
        countPattern: e.countPattern || undefined,
        count: e.count || undefined,
        createdAt: e.createdAt || undefined,
      }))

      items.push({ worker: workerForPdf, entries: entriesForPdf })
    }

    if (items.length === 0) {
      console.log(
        `[WorkClock月次PDF(全員分)] 先月の勤務記録を持つワーカーがいないため、PDF生成をスキップしました`
      )
      return NextResponse.json({
        success: true,
        targetMonth: targetMonthLabel,
        message: '先月の勤務記録を持つワーカーがいないため、PDF生成をスキップしました',
      })
    }

    // HTMLコンテンツを生成（複数人分を1つのPDFにまとめる）
    const htmlContent = generateCombinedPDFContent(
      items.map((item) => ({
        worker: item.worker as any,
        entries: item.entries as any,
      })),
      lastMonth
    )

    // PuppeteerでPDF化
    let browser: any = null
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })

      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      })

      await page.close()

      // ファイル名とフォルダ名を生成
      const filename = `${targetMonthLabel}_勤務報告書_全員分.pdf`
      const folderNameForDb = `全員分/${targetMonthLabel}`

      // 給与or請求管理カテゴリーの「全員分」フォルダにアップロード
      const { uploadFileToS3 } = await import('@/lib/s3-client')
      const { uploadFileToLocal } = await import('@/lib/local-file-storage')

      const isProduction = !!process.env.AWS_S3_BUCKET_NAME
      let uploadResult

      if (isProduction) {
        // 本番環境：S3にアップロード（employeeId/payroll/all/YYYY年M月/）
        const s3Folder = `${allEmployeeOwnerId}/payroll/all/${targetMonthLabel}`
        uploadResult = await uploadFileToS3(pdfBuffer, filename, 'application/pdf', s3Folder)
      } else {
        // 開発環境：ローカルファイルシステムにアップロード
        uploadResult = await uploadFileToLocal(
          pdfBuffer,
          filename,
          'application/pdf',
          allEmployeeOwnerId,
          'payroll',
          folderNameForDb
        )
      }

      if (!uploadResult.success || !uploadResult.filePath) {
        console.error(
          '[WorkClock月次PDF(全員分)] PDFファイルのアップロードに失敗しました:',
          uploadResult.error
        )
        return NextResponse.json(
          {
            success: false,
            targetMonth: targetMonthLabel,
            error: uploadResult.error || 'ファイルアップロードに失敗しました',
          },
          { status: 500 }
        )
      }

      // DBにファイルレコードを作成
      const fileRecord = await prisma.file.create({
        data: {
          filename,
          originalName: filename,
          filePath: uploadResult.filePath,
          fileSize: pdfBuffer.length,
          mimeType: 'application/pdf',
          category: 'payroll',
          folderName: folderNameForDb,
          employee: {
            connect: { id: allEmployeeOwnerId },
          },
        },
      })

      console.log(
        `[WorkClock月次PDF(全員分)] PDF生成・保存成功 fileId=${fileRecord.id}, month=${targetMonthLabel}`
      )

      return NextResponse.json({
        success: true,
        targetMonth: targetMonthLabel,
        ownerEmployeeId: allEmployeeOwnerId,
        fileId: fileRecord.id,
        filePath: uploadResult.filePath,
        totalWorkers: workers.length,
        workersWithEntries: items.length,
        message: '全員分の勤務報告書PDFを勤怠管理フォルダに保存しました',
      })
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  } catch (error: any) {
    console.error('[WorkClock月次PDF(全員分)] エラー:', error)
    return NextResponse.json(
      {
        error: '月次「全員分」PDF生成処理に失敗しました',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}

// POSTでも同じ処理を許可
export async function POST(request: NextRequest) {
  return GET(request)
}


