import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendFileToRoom } from '@/lib/chatwork'
import { getSignedDownloadUrl } from '@/lib/s3-client'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

/**
 * POST: 給与・請求ファイルを対象社員のChatworkルームに送信
 * Body: { fileId: string, employeeId: string, message?: string }
 * 権限: admin または hr のみ
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-employee-id')
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const user = await prisma.employee.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
      return NextResponse.json(
        { error: 'この操作は管理者または総務のみ可能です' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const fileId = body?.fileId
    const employeeId = body?.employeeId
    const message = body?.message != null ? String(body.message).trim() : undefined

    if (!fileId || !employeeId) {
      return NextResponse.json(
        { error: 'fileId と employeeId を指定してください' },
        { status: 400 }
      )
    }

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        employeeId,
        category: 'payroll',
      },
    })
    if (!file) {
      return NextResponse.json(
        { error: '対象の給与・請求ファイルが見つかりません' },
        { status: 404 }
      )
    }

    const setting = await prisma.payrollChatworkSetting.findUnique({
      where: { employeeId: file.employeeId },
    })
    if (!setting?.chatworkRoomId?.trim()) {
      console.error('[Chatwork] 送信先未設定 employeeId=', file.employeeId)
      return NextResponse.json(
        { error: 'この社員のChatwork送信先が未設定です。給与or請求管理の設定でルームIDを登録してください。' },
        { status: 400 }
      )
    }

    let fileBuffer: Buffer
    const isProduction = !!process.env.AWS_S3_BUCKET_NAME
    if (isProduction && file.filePath) {
      const urlResult = await getSignedDownloadUrl(file.filePath, 60)
      if (!urlResult.success || !urlResult.url) {
        return NextResponse.json(
          { error: 'ファイルの取得に失敗しました' },
          { status: 500 }
        )
      }
      const res = await fetch(urlResult.url)
      if (!res.ok) {
        return NextResponse.json(
          { error: 'ファイルの取得に失敗しました' },
          { status: 500 }
        )
      }
      const ab = await res.arrayBuffer()
      fileBuffer = Buffer.from(ab)
    } else {
      if (!file.filePath) {
        return NextResponse.json(
          { error: 'ファイルパスが記録されていません' },
          { status: 500 }
        )
      }
      const uploadDir = path.join(process.cwd(), 'uploads')
      const absolutePath = path.join(uploadDir, file.filePath)
      try {
        fileBuffer = await fs.readFile(absolutePath)
      } catch (e) {
        console.error('Local file read error:', e)
        return NextResponse.json(
          { error: 'ファイルの読み込みに失敗しました' },
          { status: 500 }
        )
      }
    }

    const text = message || setting.defaultMessage?.trim() || ''
    const result = await sendFileToRoom(
      setting.chatworkRoomId,
      fileBuffer,
      file.originalName,
      text || undefined
    )

    if (!result.success) {
      console.error('[Chatwork] 送信失敗:', result.error, 'roomId=', setting.chatworkRoomId)
      return NextResponse.json(
        { error: result.error || 'Chatworkへの送信に失敗しました' },
        { status: 502 }
      )
    }

    console.log('[Chatwork] 送信成功 roomId=', setting.chatworkRoomId)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('POST /api/chatwork/send-payroll-file error:', e)
    return NextResponse.json(
      { error: '送信処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
