
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: 評価年度一覧の取得
export async function GET(request: Request) {
    try {
        const fiscalYears = await prisma.personnelEvaluationFiscalYear.findMany({
            orderBy: { startDate: 'desc' }
        })
        return NextResponse.json(fiscalYears)
    } catch (error) {
        console.error('GET /api/evaluations/settings/fiscal-year error:', error)
        return NextResponse.json({ error: 'Failed to fetch fiscal years' }, { status: 500 })
    }
}

// POST: 評価年度設定の保存（一括更新）
export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.employee.findUnique({
            where: { id: userId },
            select: { role: true }
        })

        if (!user || !['admin', 'hr', 'manager'].includes(user.role)) { // managerも含めておくか、要件はHR/Admin
            // User Request said: "HR/Adminによるバイパス" for daily entry, maybe settings too?
            // Page.tsx says: const isAdminOrHr = currentUser?.role === 'admin' || currentUser?.role === 'hr'
            if (user.role !== 'admin' && user.role !== 'hr') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const body = await request.json()
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        // 基本的なバリデーション
        for (const item of body) {
            if (!item.name || !item.startDate || !item.endDate) {
                return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
            }
        }

        // トランザクションで一括更新
        const result = await prisma.$transaction(async (tx) => {
            // 1. 既存の全IDを取得
            const existing = await tx.personnelEvaluationFiscalYear.findMany({ select: { id: true } })
            const existingIds = new Set(existing.map(e => e.id))

            // 2. 送信されたデータのIDリスト（新規以外）
            const incomeIds = new Set(body.filter(b => !b.id.startsWith('new-')).map(b => b.id))

            // 3. 削除対象のID（DBにあるが送信データにないもの）
            const idsToDelete = [...existingIds].filter(id => !incomeIds.has(id))

            // 削除実行
            if (idsToDelete.length > 0) {
                await tx.personnelEvaluationFiscalYear.deleteMany({
                    where: { id: { in: idsToDelete } }
                })
            }

            // Upsert実行
            for (const item of body) {
                const start = new Date(item.startDate)
                const end = new Date(item.endDate)

                if (item.id.startsWith('new-')) {
                    await tx.personnelEvaluationFiscalYear.create({
                        data: {
                            name: item.name,
                            startDate: start,
                            endDate: end
                        }
                    })
                } else {
                    await tx.personnelEvaluationFiscalYear.update({
                        where: { id: item.id },
                        data: {
                            name: item.name,
                            startDate: start,
                            endDate: end
                        }
                    })
                }
            }

            // 更新後のデータを返す
            return await tx.personnelEvaluationFiscalYear.findMany({
                orderBy: { startDate: 'desc' }
            })
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('POST /api/evaluations/settings/fiscal-year error:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
}
