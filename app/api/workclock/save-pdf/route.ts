import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCombinedPDFContent, generatePDFContent } from '@/lib/workclock/pdf-export'
import { getBrowser } from '@/lib/browserless'
import { calculateWorkerMonthlyCost } from '@/lib/workclock/cost-calculation'

/**
 * 時間管理システムPDF手動保存API
 * 
 * POST /api/workclock/save-pdf
 * Body: { workerIds: string[], year: number, month: number, saveIndividual?: boolean }
 * 
 * - 全員分PDFを「全員分」フォルダに保存
 * - saveIndividual=trueの場合、各個人のフォルダにも保存
 */
export async function POST(request: NextRequest) {
  console.log('[WorkClock手動PDF保存] ===== API開始 =====')
  try {
    const body = await request.json()
    console.log('[WorkClock手動PDF保存] リクエストbody:', JSON.stringify(body))
    const { workerIds, year, month, saveIndividual = true } = body

    if (!workerIds || !Array.isArray(workerIds) || workerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'workerIds is required' },
        { status: 400 }
      )
    }

    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'year and month are required' },
        { status: 400 }
      )
    }

    const targetMonthLabel = `${year}年${month}月`
    console.log(`[WorkClock手動PDF保存] ${targetMonthLabel} のPDF生成を開始`)

    // 「全員分」PDFの所有者とする社員IDを環境変数から取得
    const allEmployeeOwnerId = process.env.PAYROLL_ALL_EMPLOYEE_ID
    if (!allEmployeeOwnerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYROLL_ALL_EMPLOYEE_ID is not configured',
        },
        { status: 500 }
      )
    }

    // 対象ワーカーを取得
    const workers = await prisma.workClockWorker.findMany({
      where: {
        id: { in: workerIds },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (workers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No workers found' },
        { status: 404 }
      )
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
      bankInfo?: string | null
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
    }

    const items: { worker: WorkerForPDF; entries: TimeEntryForPDF[]; rewards: any[] }[] = []

    // 各ワーカーごとにデータを取得
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

      const rewards = await prisma.workClockReward.findMany({
        where: {
          workerId: worker.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

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
        bankInfo: worker.bankInfo || undefined,
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
      }))

      // 報酬見込を計算
      const workerForCalc = {
        hourlyRate: worker.hourlyRate,
        hourlyRateB: worker.hourlyRateB || worker.hourlyRate,
        hourlyRateC: worker.hourlyRateC || worker.hourlyRate,
        countRateA: worker.countRateA || 0,
        countRateB: worker.countRateB || 0,
        countRateC: worker.countRateC || 0,
        monthlyFixedAmount: worker.monthlyFixedAmount,
      }
      const entriesForCalc = entries.map((e) => ({
        startTime: e.startTime,
        endTime: e.endTime,
        breakMinutes: e.breakMinutes,
        wagePattern: e.wagePattern || undefined,
        countPattern: e.countPattern || undefined,
        count: e.count || undefined,
      }))
      const rewardsForCalc = rewards.map((r) => ({ amount: r.amount }))
      const totalCost = calculateWorkerMonthlyCost(workerForCalc as any, entriesForCalc as any, rewardsForCalc)

      // 報酬見込が0円のワーカーはスキップ
      if (totalCost === 0) {
        console.log(`[WorkClock手動PDF保存] ${worker.name}: 報酬見込0円のためスキップ`)
        continue
      }

      items.push({ 
        worker: workerForPdf, 
        entries: entriesForPdf, 
        rewards: rewards.map((r) => ({
          id: r.id,
          workerId: r.workerId,
          name: r.description,
          amount: r.amount,
          month: r.date,
        }))
      })
    }

    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No data to generate PDF',
      })
    }

    // HTMLコンテンツを生成（複数人分を1つのPDFにまとめる）
    const lastMonth = new Date(year, month - 1, 1)
    const htmlContent = generateCombinedPDFContent(
      items.map((item) => ({
        worker: item.worker as any,
        entries: item.entries as any,
        rewards: item.rewards,
      })),
      lastMonth
    )

    // Browserless.ioでPDF化
    let browser: any = null
    const results: any[] = []

    try {
      browser = await getBrowser()
      const page = await browser.newPage()
      // domcontentloadedで高速化（外部リソースを待たない）
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })

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

      // 全員分PDFを保存
      const filename = `${targetMonthLabel}_勤務報告書_全員分.pdf`
      const folderNameForDb = `全員分/${targetMonthLabel}`

      const { uploadFileToS3 } = await import('@/lib/s3-client')
      const { uploadFileToLocal } = await import('@/lib/local-file-storage')

      const isProduction = !!process.env.AWS_S3_BUCKET_NAME
      let uploadResult

      if (isProduction) {
        const s3Folder = `${allEmployeeOwnerId}/payroll/all/${targetMonthLabel}`
        uploadResult = await uploadFileToS3(pdfBuffer, filename, 'application/pdf', s3Folder)
      } else {
        uploadResult = await uploadFileToLocal(
          pdfBuffer,
          filename,
          'application/pdf',
          allEmployeeOwnerId,
          'payroll',
          folderNameForDb
        )
      }

      if (uploadResult.success && uploadResult.filePath) {
        // 既存のファイルを確認して更新または新規作成
        const existingFile = await prisma.file.findFirst({
          where: {
            employeeId: allEmployeeOwnerId,
            category: 'payroll',
            folderName: folderNameForDb,
            filename: filename,
          },
        })

        if (existingFile) {
          await prisma.file.update({
            where: { id: existingFile.id },
            data: {
              filePath: uploadResult.filePath,
              fileSize: pdfBuffer.length,
            },
          })
          results.push({ type: 'all', success: true, fileId: existingFile.id, updated: true })
        } else {
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
          results.push({ type: 'all', success: true, fileId: fileRecord.id })
        }
      } else {
        results.push({ type: 'all', success: false, error: uploadResult.error })
      }

      // 個人別PDFを保存（オプション）
      console.log(`[WorkClock手動PDF保存] saveIndividual=${saveIndividual}, items.length=${items.length}`)
      if (saveIndividual) {
        for (const item of items) {
          console.log(`[WorkClock手動PDF保存] 個人PDF処理: ${item.worker.name}, employeeId=${item.worker.employeeId}`)
          if (!item.worker.employeeId) {
            console.log(`[WorkClock手動PDF保存] ${item.worker.name}: employeeIdがないためスキップ`)
            continue
          }

          try {
            const individualHtml = generatePDFContent(
              item.worker as any,
              item.entries as any,
              lastMonth,
              item.rewards
            )

            const individualPage = await browser.newPage()
            // domcontentloadedで高速化（外部リソースを待たない）
            await individualPage.setContent(individualHtml, { waitUntil: 'domcontentloaded' })

            const individualPdfBuffer = await individualPage.pdf({
              format: 'A4',
              printBackground: true,
              margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm',
              },
            })

            await individualPage.close()

            const individualFilename = `${targetMonthLabel}_勤務報告書.pdf`
            const individualFolderName = `${year}年${month}月`

            let individualUploadResult

            if (isProduction) {
              // S3でも月フォルダを含める
              const s3Folder = `${item.worker.employeeId}/payroll/${individualFolderName}`
              individualUploadResult = await uploadFileToS3(
                individualPdfBuffer,
                individualFilename,
                'application/pdf',
                s3Folder
              )
            } else {
              individualUploadResult = await uploadFileToLocal(
                individualPdfBuffer,
                individualFilename,
                'application/pdf',
                item.worker.employeeId,
                'payroll',
                individualFolderName
              )
            }

            console.log(`[WorkClock手動PDF保存] ${item.worker.name}: アップロード結果`, individualUploadResult)
            if (individualUploadResult.success && individualUploadResult.filePath) {
              // 既存のファイルを確認して更新または新規作成
              const existingIndividualFile = await prisma.file.findFirst({
                where: {
                  employeeId: item.worker.employeeId,
                  category: 'payroll',
                  folderName: individualFolderName,
                  filename: individualFilename,
                },
              })

              if (existingIndividualFile) {
                await prisma.file.update({
                  where: { id: existingIndividualFile.id },
                  data: {
                    filePath: individualUploadResult.filePath,
                    fileSize: individualPdfBuffer.length,
                  },
                })
                results.push({
                  type: 'individual',
                  workerId: item.worker.id,
                  workerName: item.worker.name,
                  success: true,
                  fileId: existingIndividualFile.id,
                  updated: true,
                })
              } else {
                const individualFileRecord = await prisma.file.create({
                  data: {
                    filename: individualFilename,
                    originalName: individualFilename,
                    filePath: individualUploadResult.filePath,
                    fileSize: individualPdfBuffer.length,
                    mimeType: 'application/pdf',
                    category: 'payroll',
                    folderName: individualFolderName,
                    employee: {
                      connect: { id: item.worker.employeeId },
                    },
                  },
                })
                results.push({
                  type: 'individual',
                  workerId: item.worker.id,
                  workerName: item.worker.name,
                  success: true,
                  fileId: individualFileRecord.id,
                })
              }
            } else {
              results.push({
                type: 'individual',
                workerId: item.worker.id,
                workerName: item.worker.name,
                success: false,
                error: individualUploadResult.error,
              })
            }
          } catch (err: any) {
            results.push({
              type: 'individual',
              workerId: item.worker.id,
              workerName: item.worker.name,
              success: false,
              error: err?.message,
            })
          }
        }
      }

      return NextResponse.json({
        success: true,
        targetMonth: targetMonthLabel,
        results,
        message: 'PDFを給与or請求管理フォルダに保存しました',
      })
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  } catch (error: any) {
    console.error('[WorkClock手動PDF保存] エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'PDF保存処理に失敗しました',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}

