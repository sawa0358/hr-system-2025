import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // レート制限: IPアドレスあたり1分間に5回まで
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(`verify:${ip}`)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: '試行回数が上限に達しました。しばらく待ってから再度お試しください。', valid: false },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { employeeId, password } = body

    if (!employeeId || !password) {
      return NextResponse.json(
        { error: '社員IDとパスワードが必要です', valid: false },
        { status: 400 }
      )
    }

    // 社員情報を取得
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, password: true }
    })

    if (!employee) {
      return NextResponse.json(
        { error: '社員が見つかりません', valid: false },
        { status: 404 }
      )
    }

    // パスワードを照合（bcryptハッシュ・平文の両方に対応）
    const isValid = await verifyPassword(password, employee.password)

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error('パスワード検証エラー:', error)
    return NextResponse.json(
      { error: 'パスワード検証に失敗しました', valid: false },
      { status: 500 }
    )
  }
}
