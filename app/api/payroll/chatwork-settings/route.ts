import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function getCurrentUserRole(request: NextRequest): Promise<{ id: string; role: string | null } | null> {
  const userId = request.headers.get('x-employee-id')
  if (!userId) return Promise.resolve(null)
  return prisma.employee.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  }).then((u) => u ? { id: u.id, role: u.role } : null)
}

async function requireAdminOrHr(request: NextRequest): Promise<NextResponse | null> {
  const user = await getCurrentUserRole(request)
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  if (user.role !== 'admin' && user.role !== 'hr') {
    return NextResponse.json({ error: 'この操作は管理者または総務のみ可能です' }, { status: 403 })
  }
  return null
}

/**
 * GET: 給与・請求 Chatwork 設定一覧（社員＋紐付き設定）
 * admin/hr のみ。
 */
export async function GET(request: NextRequest) {
  const err = await requireAdminOrHr(request)
  if (err) return err

  try {
    const employees = await prisma.employee.findMany({
      where: {
        isInvisibleTop: { not: true },
        employeeNumber: { not: '000' },
      },
      orderBy: [{ department: 'asc' }, { employeeNumber: 'asc' }],
      select: {
        id: true,
        name: true,
        employeeNumber: true,
        department: true,
        payrollChatworkSetting: {
          select: {
            id: true,
            chatworkRoomId: true,
            defaultMessage: true,
          },
        },
      },
    })

    const list = employees.map((emp) => ({
      employeeId: emp.id,
      name: emp.name,
      employeeNumber: emp.employeeNumber,
      department: emp.department,
      chatworkRoomId: emp.payrollChatworkSetting?.chatworkRoomId ?? '',
      defaultMessage: emp.payrollChatworkSetting?.defaultMessage ?? '',
    }))

    return NextResponse.json(list)
  } catch (e) {
    console.error('GET /api/payroll/chatwork-settings error:', e)
    return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * PUT: 給与・請求 Chatwork 設定の一括更新
 * Body: { settings: { employeeId: string, chatworkRoomId: string, defaultMessage?: string }[] }
 * admin/hr のみ。
 */
export async function PUT(request: NextRequest) {
  const err = await requireAdminOrHr(request)
  if (err) return err

  try {
    const body = await request.json()
    const settings = body?.settings
    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: 'settings は配列で指定してください' }, { status: 400 })
    }

    for (const row of settings) {
      if (!row?.employeeId || typeof row.employeeId !== 'string') continue
      const chatworkRoomId = row.chatworkRoomId != null ? String(row.chatworkRoomId).trim() : ''
      const defaultMessage = row.defaultMessage != null ? String(row.defaultMessage).trim() : null

      if (chatworkRoomId === '') {
        await prisma.payrollChatworkSetting.deleteMany({
          where: { employeeId: row.employeeId },
        })
        continue
      }

      await prisma.payrollChatworkSetting.upsert({
        where: { employeeId: row.employeeId },
        create: {
          employeeId: row.employeeId,
          chatworkRoomId,
          defaultMessage: defaultMessage || null,
        },
        update: {
          chatworkRoomId,
          defaultMessage: defaultMessage || null,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PUT /api/payroll/chatwork-settings error:', e)
    return NextResponse.json({ error: '設定の保存に失敗しました' }, { status: 500 })
  }
}
