import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSignedDownloadUrl } from '@/lib/s3-client'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * 給与or請求管理「全員分」PDFダウンロード用API
 *
 * - 対象: category='payroll' かつ folderName が '全員分/' で始まるファイルのみ
 * - 認証ヘッダーは不要（/payroll ページ側で権限制御されている前提）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: params.fileId },
    })

    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 404 })
    }

    if (file.category !== 'payroll' || !file.folderName || !file.folderName.startsWith('全員分/')) {
      return NextResponse.json(
        { error: 'このファイルは全員分PDFとしてダウンロードできません' },
        { status: 403 }
      )
    }

    const isProduction = !!process.env.AWS_S3_BUCKET_NAME

    if (isProduction) {
      try {
        const downloadResult = await getSignedDownloadUrl(file.filePath, 3600)

        if (!downloadResult.success || !downloadResult.url) {
          console.error('S3署名付きURL取得エラー:', downloadResult.error)
          throw new Error('S3アクセス失敗')
        }

        const fileResponse = await fetch(downloadResult.url)
        if (!fileResponse.ok) {
          throw new Error(`S3ファイル取得失敗: ${fileResponse.status}`)
        }

        const fileBuffer = await fileResponse.arrayBuffer()

        const headers = new Headers()
        headers.set('Content-Type', file.mimeType)
        const safeFileName = file.originalName.replace(/[^\x00-\x7F]/g, '_')
        headers.set('Content-Disposition', `attachment; filename="${safeFileName}"`)
        headers.set('Content-Length', fileBuffer.byteLength.toString())

        return new NextResponse(fileBuffer, { headers })
      } catch (s3Error) {
        console.error('S3アクセスエラー、ローカルファイルシステムにフォールバック:', s3Error)
        // S3エラーの場合はローカルファイルを試みる
      }
    }

    // 開発環境またはS3フォールバック: ローカルファイルシステムから直接ファイルを配信
    try {
      const uploadDir = path.join(process.cwd(), 'uploads')
      const absolutePath = path.join(uploadDir, file.filePath)

      await fs.access(absolutePath)
      const fileBuffer = await fs.readFile(absolutePath)

      const headers = new Headers()
      headers.set('Content-Type', file.mimeType)
      const safeFileName = file.originalName.replace(/[^\x00-\x7F]/g, '_')
      headers.set('Content-Disposition', `attachment; filename="${safeFileName}"`)
      headers.set('Content-Length', fileBuffer.length.toString())

      return new NextResponse(fileBuffer, { headers })
    } catch (error) {
      console.error('ローカルファイル読み込みエラー:', error)
      return NextResponse.json(
        { error: 'ファイルの読み込みに失敗しました' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('全員分PDFダウンロードAPIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}




