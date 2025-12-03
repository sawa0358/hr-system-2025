import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteFileFromS3 } from '@/lib/s3-client'
import { deleteFileFromLocal } from '@/lib/local-file-storage'

/**
 * 給与or請求管理「全員分」PDFの削除API
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'fileId is required' },
        { status: 400 }
      )
    }

    // ファイルレコードを取得
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // 「全員分」フォルダのファイルのみ削除可能
    if (!file.folderName?.startsWith('全員分/')) {
      return NextResponse.json(
        { success: false, error: 'This file cannot be deleted via this endpoint' },
        { status: 403 }
      )
    }

    // ストレージからファイルを削除
    const isProduction = !!process.env.AWS_S3_BUCKET_NAME

    if (isProduction) {
      // S3から削除
      const deleteResult = await deleteFileFromS3(file.filePath)
      if (!deleteResult.success) {
        console.error('[DELETE /api/payroll/all-pdfs/:fileId] S3削除失敗:', deleteResult.error)
        // S3からの削除に失敗してもDBレコードは削除する（孤立ファイルになるが、DBの整合性を優先）
      }
    } else {
      // ローカルから削除
      const deleteResult = await deleteFileFromLocal(file.filePath)
      if (!deleteResult.success) {
        console.error('[DELETE /api/payroll/all-pdfs/:fileId] ローカル削除失敗:', deleteResult.error)
      }
    }

    // DBからファイルレコードを削除
    await prisma.file.delete({
      where: { id: fileId },
    })

    console.log(`[DELETE /api/payroll/all-pdfs/:fileId] 削除成功: ${file.filename}`)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      deletedFileId: fileId,
    })
  } catch (error: any) {
    console.error('[DELETE /api/payroll/all-pdfs/:fileId] エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}

