import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePDFContent } from '@/lib/workclock/pdf-export'
import puppeteer from 'puppeteer'

/**
 * Cronエンドポイント: 月次自動PDF生成と保存
 * 月替りの翌日0:00に実行して先月の月表示画面をPDFでスクショして、
 * 各ワーカー（業務委託or外注先）の「給与or請求管理」の本人のカード内「対象月フォルダ」にも自動保存
 * 
 * 実行タイミング: 毎月1日0:00（UTC）
 * 保護: Authorization ヘッダーまたは query parameter でトークン確認
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get("authorization")
    const authToken = request.nextUrl.searchParams.get("token")
    const expectedToken = process.env.CRON_SECRET_TOKEN

    if (expectedToken && authHeader !== `Bearer ${expectedToken}` && authToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 先月を計算
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const year = lastMonth.getFullYear()
    const month = lastMonth.getMonth() + 1

    console.log(`[WorkClock月次PDF] ${year}年${month}月のPDF生成を開始`)

    // すべてのワーカーを取得（業務委託・外注先のみ）
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

    const results = []
    let successCount = 0
    let errorCount = 0

    // ブラウザを起動（1回だけ）
    let browser: any = null
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })

      for (const worker of workers) {
        try {
          // 業務委託・外注先のみ処理
          const employeeType = worker.employee?.employeeType || ''
          if (!employeeType.includes('業務委託') && !employeeType.includes('外注先')) {
            continue
          }

          // 先月の時間記録を取得
          const startDate = new Date(year, month - 1, 1)
          const endDate = new Date(year, month, 0, 23, 59, 59)

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
            console.log(`[WorkClock月次PDF] ${worker.name}: 先月の記録なし、スキップ`)
            continue
          }

          // PDFコンテンツを生成
          const htmlContent = generatePDFContent(
            {
              id: worker.id,
              name: worker.name,
              email: worker.email,
              hourlyRate: worker.hourlyRate,
              teams: worker.teams ? JSON.parse(worker.teams) : [],
              role: worker.role as 'worker' | 'admin',
              companyName: worker.companyName,
              qualifiedInvoiceNumber: worker.qualifiedInvoiceNumber,
              chatworkId: worker.chatworkId,
              phone: worker.phone,
              address: worker.address,
              notes: worker.notes,
            },
            entries.map((e) => ({
              id: e.id,
              workerId: e.workerId,
              date: e.date.toISOString().split('T')[0],
              startTime: e.startTime,
              endTime: e.endTime,
              breakMinutes: e.breakMinutes,
              notes: e.notes || '',
            })),
            lastMonth
          )

          // ページを作成してPDFを生成
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

          // ファイル名を生成（例: 2025年10月_勤務報告書.pdf）
          const monthName = `${year}年${month}月`
          const filename = `${monthName}_勤務報告書.pdf`
          const folderName = `${year}年${month}月`

          // ファイルをアップロード（給与or請求管理のフォルダに保存）
          const { uploadFileToS3 } = await import('@/lib/s3-client')
          const { uploadFileToLocal } = await import('@/lib/local-file-storage')
          
          const isProduction = !!process.env.AWS_S3_BUCKET_NAME
          let uploadResult
          
          if (isProduction) {
            // 本番環境：S3にアップロード
            const s3Folder = `${worker.employeeId}/payroll`
            uploadResult = await uploadFileToS3(
              pdfBuffer,
              filename,
              'application/pdf',
              s3Folder
            )
          } else {
            // 開発環境：ローカルファイルシステムにアップロード
            uploadResult = await uploadFileToLocal(
              pdfBuffer,
              filename,
              'application/pdf',
              worker.employeeId,
              'payroll',
              folderName
            )
          }

          if (!uploadResult.success || !uploadResult.filePath) {
            errorCount++
            results.push({
              workerId: worker.id,
              workerName: worker.name,
              employeeId: worker.employeeId,
              month: monthName,
              success: false,
              error: uploadResult.error || 'ファイルアップロードに失敗',
            })
            console.error(`[WorkClock月次PDF] ${worker.name}: PDF保存失敗`, uploadResult.error)
            continue
          }

          // データベースにファイル情報を保存
          const fileRecord = await prisma.file.create({
            data: {
              filename: filename,
              originalName: filename,
              filePath: uploadResult.filePath,
              fileSize: pdfBuffer.length,
              mimeType: 'application/pdf',
              category: 'payroll',
              folderName: folderName,
              employee: {
                connect: { id: worker.employeeId },
              },
            },
          })

          successCount++
          results.push({
            workerId: worker.id,
            workerName: worker.name,
            employeeId: worker.employeeId,
            month: monthName,
            success: true,
            fileId: fileRecord.id,
          })
          console.log(`[WorkClock月次PDF] ${worker.name}: PDF生成・保存成功`)
        } catch (error: any) {
          errorCount++
          console.error(`[WorkClock月次PDF] ${worker.name}: エラー`, error)
          results.push({
            workerId: worker.id,
            workerName: worker.name,
            employeeId: worker.employeeId,
            month: `${year}年${month}月`,
            success: false,
            error: error?.message || 'Unknown error',
          })
        }
      }
    } finally {
      if (browser) {
        await browser.close()
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: today.toISOString(),
      targetMonth: `${year}年${month}月`,
      totalWorkers: workers.length,
      successCount,
      errorCount,
      results,
      message: `${successCount}件のPDFを生成・保存しました`,
    })
  } catch (error: any) {
    console.error('[WorkClock月次PDF] エラー:', error)
    return NextResponse.json(
      { error: '月次PDF生成処理に失敗しました', details: error?.message },
      { status: 500 }
    )
  }
}

// POSTでも対応
export async function POST(request: NextRequest) {
  return GET(request)
}

