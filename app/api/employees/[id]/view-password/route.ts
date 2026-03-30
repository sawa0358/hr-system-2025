import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'

/**
 * パスワード閲覧API
 *
 * 条件:
 * - admin/hr のみアクセス可能
 * - 自身のパスワードで認証が必要
 * - admin のパスワードは本人のみ閲覧可能
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requesterId = request.headers.get('x-employee-id')
    const requesterRole = request.headers.get('x-employee-role')

    // admin または hr のみ許可
    if (requesterRole !== 'admin' && requesterRole !== 'hr') {
      return NextResponse.json(
        { error: 'パスワードの閲覧は管理者または総務のみが可能です' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { verificationPassword } = body

    if (!verificationPassword) {
      return NextResponse.json(
        { error: '認証用パスワードが必要です' },
        { status: 400 }
      )
    }

    // リクエスト者自身のパスワードで本人確認
    const requester = await prisma.employee.findUnique({
      where: { id: requesterId! },
      select: { id: true, password: true, role: true }
    })

    if (!requester) {
      return NextResponse.json(
        { error: '認証に失敗しました' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(verificationPassword, requester.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'パスワードが正しくありません' },
        { status: 401 }
      )
    }

    // 対象社員の情報を取得
    const targetEmployee = await prisma.employee.findUnique({
      where: { id: params.id },
      select: { id: true, role: true, rawPassword: true }
    })

    if (!targetEmployee) {
      return NextResponse.json(
        { error: '社員が見つかりません' },
        { status: 404 }
      )
    }

    // admin のパスワードは本人のみ閲覧可能
    if (targetEmployee.role === 'admin' && targetEmployee.id !== requesterId) {
      return NextResponse.json(
        { error: '管理者のパスワードは本人のみ閲覧可能です' },
        { status: 403 }
      )
    }

    // rawPassword が未設定の場合
    if (!targetEmployee.rawPassword) {
      return NextResponse.json(
        { error: 'パスワードの閲覧情報がありません。パスワードを再設定してください。' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      rawPassword: targetEmployee.rawPassword
    })
  } catch (error) {
    console.error('パスワード閲覧エラー:', error)
    return NextResponse.json(
      { error: 'パスワードの取得に失敗しました' },
      { status: 500 }
    )
  }
}
