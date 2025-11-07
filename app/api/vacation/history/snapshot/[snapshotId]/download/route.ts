import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthHeaders } from "@/lib/auth"
import { getSignedDownloadUrl } from "@/lib/s3-client"

/**
 * 有給管理履歴スナップショットダウンロードAPI
 * GET /api/vacation/history/snapshot/[snapshotId]/download
 * 総務・管理者のみアクセス可能
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { snapshotId: string } }
) {
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

    // スナップショットを取得
    const snapshot = await prisma.leaveHistorySnapshot.findUnique({
      where: { id: params.snapshotId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeNumber: true,
          },
        },
      },
    })

    if (!snapshot) {
      return NextResponse.json(
        { error: "スナップショットが見つかりません" },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || snapshot.fileFormat // "png" or "pdf"

    // ダウンロードURLを取得
    let downloadUrl: string | null = null

    if (format === "pdf" && snapshot.pdfUrl) {
      const result = await getSignedDownloadUrl(snapshot.pdfUrl, 3600) // 1時間有効
      if (result.success && result.url) {
        downloadUrl = result.url
      }
    } else if (format === "png" && snapshot.imageUrl) {
      const result = await getSignedDownloadUrl(snapshot.imageUrl, 3600) // 1時間有効
      if (result.success && result.url) {
        downloadUrl = result.url
      }
    }

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      snapshot: {
        id: snapshot.id,
        employeeName: snapshot.employee.name,
        grantYear: snapshot.grantYear,
        grantDate: snapshot.grantDate,
        snapshotDate: snapshot.snapshotDate,
      },
    })
  } catch (error: any) {
    console.error("ダウンロードURL取得エラー:", error)
    return NextResponse.json(
      { error: "ダウンロードURLの取得に失敗しました", details: error?.message },
      { status: 500 }
    )
  }
}

