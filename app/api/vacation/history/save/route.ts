import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthHeaders } from "@/lib/auth"
import { uploadFileToS3 } from "@/lib/s3-client"

/**
 * 有給管理履歴スナップショット保存API
 * POST /api/vacation/history/save
 * 総務・管理者のみアクセス可能
 * 
 * リクエストボディ:
 * {
 *   employeeId: string,
 *   snapshotDate: string (ISO形式),
 *   grantYear: number,
 *   grantDate: string (ISO形式),
 *   totalGranted: number,
 *   used: number,
 *   pending: number,
 *   remaining: number,
 *   joinDate: string (ISO形式),
 *   imageData?: string (base64エンコードされた画像),
 *   pdfData?: string (base64エンコードされたPDF),
 *   fileFormat?: "png" | "pdf"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 権限チェック
    const authHeaders = getAuthHeaders(request)
    if (!authHeaders.userId) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const user = await prisma.employee.findUnique({
      where: { id: authHeaders.userId },
      select: { role: true },
    })

    // 総務・管理者のみアクセス可能
    if (user?.role !== "hr" && user?.role !== "admin") {
      return NextResponse.json(
        { error: "この機能は総務・管理者のみ利用可能です" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      employeeId,
      snapshotDate,
      grantYear,
      grantDate,
      totalGranted,
      used,
      pending,
      remaining,
      joinDate,
      imageData,
      pdfData,
      fileFormat = "png",
    } = body

    // 必須パラメータチェック
    if (
      !employeeId ||
      !snapshotDate ||
      !grantYear ||
      !grantDate ||
      totalGranted === undefined ||
      used === undefined ||
      pending === undefined ||
      remaining === undefined ||
      !joinDate
    ) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      )
    }

    let imageUrl: string | null = null
    let pdfUrl: string | null = null

    // 画像データをS3にアップロード
    if (imageData) {
      try {
        const imageBuffer = Buffer.from(imageData, "base64")
        const timestamp = Date.now()
        const imageFileName = `leave-history-${employeeId}-${grantYear}-${timestamp}.png`
        const s3Folder = `leave-history/${employeeId}/${grantYear}`

        const uploadResult = await uploadFileToS3(
          imageBuffer,
          imageFileName,
          "image/png",
          s3Folder
        )

        if (uploadResult.success && uploadResult.filePath) {
          imageUrl = uploadResult.filePath
        }
      } catch (error: any) {
        console.error("画像アップロードエラー:", error)
        // 画像アップロードに失敗しても続行
      }
    }

    // PDFデータをS3にアップロード
    if (pdfData) {
      try {
        const pdfBuffer = Buffer.from(pdfData, "base64")
        const timestamp = Date.now()
        const pdfFileName = `leave-history-${employeeId}-${grantYear}-${timestamp}.pdf`
        const s3Folder = `leave-history/${employeeId}/${grantYear}`

        const uploadResult = await uploadFileToS3(
          pdfBuffer,
          pdfFileName,
          "application/pdf",
          s3Folder
        )

        if (uploadResult.success && uploadResult.filePath) {
          pdfUrl = uploadResult.filePath
        }
      } catch (error: any) {
        console.error("PDFアップロードエラー:", error)
        // PDFアップロードに失敗しても続行
      }
    }

    // スナップショットをデータベースに保存
    const snapshot = await prisma.leaveHistorySnapshot.create({
      data: {
        employeeId,
        snapshotDate: new Date(snapshotDate),
        grantYear: parseInt(grantYear, 10),
        grantDate: new Date(grantDate),
        totalGranted: totalGranted,
        used: used,
        pending: pending,
        remaining: remaining,
        joinDate: new Date(joinDate),
        imageUrl,
        pdfUrl,
        fileFormat,
        snapshotData: {
          savedBy: authHeaders.userId,
          savedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      snapshot,
      message: "スナップショットを保存しました",
    })
  } catch (error: any) {
    console.error("スナップショット保存エラー:", error)
    return NextResponse.json(
      { error: "スナップショットの保存に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}










