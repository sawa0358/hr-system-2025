import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workclock/ai-reports - 期間指定でレポート一覧を取得
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')

        const where: any = {}

        if (startDate || endDate) {
            where.date = {}
            if (startDate) {
                const parts = startDate.split('-').map(Number)
                where.date.gte = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
            }
            if (endDate) {
                const parts = endDate.split('-').map(Number)
                where.date.lte = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
            }
        }

        // 総件数を取得
        const total = await (prisma as any).workClockAIReport.count({ where })

        // ページネーション付きでレポートを取得
        const reports = await (prisma as any).workClockAIReport.findMany({
            where,
            orderBy: [
                { date: 'desc' },
                { createdAt: 'desc' }
            ],
            skip: (page - 1) * limit,
            take: limit,
        })

        // 日付をフォーマット
        const formattedReports = reports.map((report: any) => ({
            ...report,
            date: report.date.toISOString().split('T')[0],
            createdAt: report.createdAt.toISOString(),
            updatedAt: report.updatedAt.toISOString(),
        }))

        return NextResponse.json({
            reports: formattedReports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('GET /api/workclock/ai-reports error:', error)
        return NextResponse.json({ error: 'レポートの取得に失敗しました' }, { status: 500 })
    }
}

// POST /api/workclock/ai-reports - 新しいAIレポートを保存
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const body = await request.json()
        const { date, summary, promptId, promptName, workerCount, alerts, totalReward } = body

        if (!date || !summary) {
            return NextResponse.json({ error: '日付とサマリーは必須です' }, { status: 400 })
        }

        // 日付を正規化
        const dateParts = date.split('-').map(Number)
        const reportDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0, 0)

        const report = await (prisma as any).workClockAIReport.create({
            data: {
                date: reportDate,
                summary,
                promptId: promptId || null,
                promptName: promptName || null,
                workerCount: workerCount || 0,
                alerts: alerts || 0,
                totalReward: totalReward || 0,
                createdBy: userId,
            }
        })

        return NextResponse.json({
            report: {
                ...report,
                date: report.date.toISOString().split('T')[0],
                createdAt: report.createdAt.toISOString(),
                updatedAt: report.updatedAt.toISOString(),
            }
        })
    } catch (error) {
        console.error('POST /api/workclock/ai-reports error:', error)
        return NextResponse.json({ error: 'レポートの保存に失敗しました' }, { status: 500 })
    }
}

// DELETE /api/workclock/ai-reports - レポートを削除
export async function DELETE(request: NextRequest) {
    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'IDが必要です' }, { status: 400 })
        }

        await (prisma as any).workClockAIReport.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/workclock/ai-reports error:', error)
        return NextResponse.json({ error: 'レポートの削除に失敗しました' }, { status: 500 })
    }
}
