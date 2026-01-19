import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where: any = {}
        if (startDate && endDate) {
            where.startDate = { gte: new Date(startDate) }
            where.endDate = { lte: new Date(endDate) }
        }

        const [reports, total] = await Promise.all([
            prisma.personnelEvaluationAIReport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.personnelEvaluationAIReport.count({ where })
        ])

        return NextResponse.json({
            reports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('GET /api/evaluations/ai-report error:', error)
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const startDate = body.startDate ? new Date(body.startDate) : new Date()
        const endDate = body.endDate ? new Date(body.endDate) : new Date()

        // 1. Fetch Submissions in range
        const submissions = await prisma.personnelEvaluationSubmission.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                items: true,
                employee: true
            }
        })

        // 2. Aggregate Stats
        const uniqueEmployees = new Set(submissions.map((s: any) => s.employeeId))
        const employeeCount = uniqueEmployees.size

        // Sum points from all items
        let totalPoints = 0
        submissions.forEach((s: any) => {
            s.items.forEach((i: any) => {
                totalPoints += (i.points || 0)
            })
        })

        // 3. Generate Summary (Template)
        const summary = `【AI分析レポート】
対象期間: ${startDate.toLocaleDateString()} 〜 ${endDate.toLocaleDateString()}
提出数: ${submissions.length}件
参加人数: ${employeeCount}名
合計獲得ポイント: ${totalPoints.toLocaleString()} pt

【傾向分析】
この期間の活動は${submissions.length > 0 ? '活発に行われました。' : '控えめでした。'}
${employeeCount > 0 ? `特に${employeeCount}名の社員が評価システムを活用しています。` : ''}
全体として、目標達成に向けた前向きな取り組みが見受けられます。

※現在は統計データに基づく自動生成テキストです。AI分析機能は順次強化されます。`

        const report = await prisma.personnelEvaluationAIReport.create({
            data: {
                startDate,
                endDate,
                summary,
                promptId: body.promptId || 'default',
                promptName: body.promptName || '標準分析',
                employeeCount,
                totalPoints,
                createdBy: userId
            }
        })

        return NextResponse.json({
            message: 'Report generated successfully',
            report
        })

    } catch (error) {
        console.error('AI Report Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
