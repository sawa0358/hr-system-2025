import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNextGrantDate, getPreviousGrantDate } from "@/lib/vacation-grant-lot"
import { loadAppConfig } from "@/lib/vacation-config"
import { getVacationStats } from "@/lib/vacation-stats"
import { generateSnapshotImageAndPDF } from "@/lib/leave-history-generator"
import { uploadFileToS3 } from "@/lib/s3-client"

/**
 * 有給管理履歴スナップショット自動保存API
 * POST /api/vacation/history/auto-save
 * 新付与日の前日23:59に実行されるバッチ処理
 * 翌日が新付与日の社員に対して、現在の実績をスナップショットとして保存
 */
export async function POST(request: NextRequest) {
  try {
    const today = new Date()
    today.setHours(23, 59, 0, 0) // 23:59に設定

    // 翌日を計算
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    // アクティブな社員を取得
    const employees = await prisma.employee.findMany({
      where: {
        status: "active",
      },
      select: {
        id: true,
        name: true,
        joinDate: true,
        configVersion: true,
      },
    })

    const results = []
    let savedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const emp of employees) {
      try {
        const cfg = await loadAppConfig(emp.configVersion || undefined)
        const nextGrant = getNextGrantDate(emp.joinDate, cfg, today)

        // 翌日が付与日の場合
        if (nextGrant) {
          const nextGrantDate = new Date(nextGrant)
          nextGrantDate.setHours(0, 0, 0, 0)

          if (nextGrantDate.getTime() === tomorrow.getTime()) {
            // 既にスナップショットが存在するかチェック
            const existingSnapshot = await prisma.leaveHistorySnapshot.findFirst({
              where: {
                employeeId: emp.id,
                grantDate: nextGrantDate,
              },
            })

            if (existingSnapshot) {
              // 既に存在する場合はスキップ
              results.push({
                employeeId: emp.id,
                employeeName: emp.name,
                grantDate: nextGrantDate.toISOString().slice(0, 10),
                status: "skipped",
                reason: "既にスナップショットが存在します",
              })
              skippedCount++
              continue
            }

            // 現在の有給統計を取得
            const stats = await getVacationStats(emp.id)

            // 年度を計算（新付与日の年）
            const grantYear = nextGrantDate.getFullYear()

            // 画像/PDFを自動生成
            let imageUrl: string | null = null
            let pdfUrl: string | null = null

            try {
              const { imageBuffer, pdfBuffer, error } = await generateSnapshotImageAndPDF({
                employeeId: emp.id,
                snapshotDate: today,
                grantYear,
                grantDate: nextGrantDate,
              })

              if (error) {
                console.error(`画像/PDF生成エラー (${emp.id}):`, error)
              } else {
                // 画像をS3にアップロード
                if (imageBuffer) {
                  const timestamp = Date.now()
                  const imageFileName = `leave-history-${emp.id}-${grantYear}-${timestamp}.png`
                  const s3Folder = `leave-history/${emp.id}/${grantYear}`

                  const imageUploadResult = await uploadFileToS3(
                    imageBuffer,
                    imageFileName,
                    "image/png",
                    s3Folder
                  )

                  if (imageUploadResult.success && imageUploadResult.filePath) {
                    imageUrl = imageUploadResult.filePath
                  }
                }

                // PDFをS3にアップロード
                if (pdfBuffer) {
                  const timestamp = Date.now()
                  const pdfFileName = `leave-history-${emp.id}-${grantYear}-${timestamp}.pdf`
                  const s3Folder = `leave-history/${emp.id}/${grantYear}`

                  const pdfUploadResult = await uploadFileToS3(
                    pdfBuffer,
                    pdfFileName,
                    "application/pdf",
                    s3Folder
                  )

                  if (pdfUploadResult.success && pdfUploadResult.filePath) {
                    pdfUrl = pdfUploadResult.filePath
                  }
                }
              }
            } catch (genError: any) {
              console.error(`画像/PDF生成エラー (${emp.id}):`, genError)
              // 画像/PDF生成に失敗してもスナップショットデータは保存
            }

            // スナップショットを保存
            const snapshot = await prisma.leaveHistorySnapshot.create({
              data: {
                employeeId: emp.id,
                snapshotDate: today, // 23:59時点
                grantYear,
                grantDate: nextGrantDate,
                totalGranted: stats.totalGranted,
                used: stats.used,
                pending: stats.pending,
                remaining: stats.totalRemaining,
                joinDate: emp.joinDate,
                imageUrl,
                pdfUrl,
                fileFormat: imageUrl ? "png" : "pdf", // 画像があればPNG、なければPDF
                snapshotData: {
                  savedBy: "system",
                  savedAt: today.toISOString(),
                  autoSaved: true,
                  imageGenerated: !!imageUrl,
                  pdfGenerated: !!pdfUrl,
                },
              },
            })

            results.push({
              employeeId: emp.id,
              employeeName: emp.name,
              grantDate: nextGrantDate.toISOString().slice(0, 10),
              grantYear,
              snapshotId: snapshot.id,
              status: "saved",
              stats: {
                totalGranted: stats.totalGranted,
                used: stats.used,
                pending: stats.pending,
                remaining: stats.totalRemaining,
              },
              imageGenerated: !!imageUrl,
              pdfGenerated: !!pdfUrl,
            })
            savedCount++
          }
        }
      } catch (error: any) {
        console.error(`Failed to process employee ${emp.id}:`, error)
        results.push({
          employeeId: emp.id,
          employeeName: emp.name,
          status: "error",
          error: error?.message || "Unknown error",
        })
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      date: today.toISOString().slice(0, 10),
      tomorrow: tomorrow.toISOString().slice(0, 10),
      summary: {
        total: employees.length,
        saved: savedCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      results,
      message: `${savedCount}件のスナップショットを保存しました`,
    })
  } catch (error: any) {
    console.error("自動保存バッチ処理エラー:", error)
    return NextResponse.json(
      {
        error: "自動保存バッチ処理に失敗しました",
        details: error?.message,
      },
      { status: 500 }
    )
  }
}

