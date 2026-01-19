import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini APIクライアントを初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// AIでレポートを生成する関数
async function generateAIReport(startDate: Date, endDate: Date, submissions: any[], employees: any[]): Promise<string> {
    const employeeMap = new Map(employees.map(e => [e.id, e.name]))

    // データを分析用に整理
    const employeeStats = new Map<string, { name: string, points: number, notes: string[] }>()
    let totalPoints = 0

    submissions.forEach(sub => {
        const empName = employeeMap.get(sub.employeeId) || '不明'
        if (!employeeStats.has(sub.employeeId)) {
            employeeStats.set(sub.employeeId, { name: empName, points: 0, notes: [] })
        }

        const stat = employeeStats.get(sub.employeeId)!

        // ポイント集計
        let subPoints = 0
        sub.items.forEach((item: any) => {
            subPoints += (item.points || 0)
        })
        stat.points += subPoints
        totalPoints += subPoints

        // コメント抽出
        if (sub.note) stat.notes.push(sub.note)
        sub.items.forEach((item: any) => {
            if (item.textValue) stat.notes.push(`${item.title}: ${item.textValue}`)
        })
    })

    const employeeCount = employeeStats.size
    const submissionCount = submissions.length

    // Gemini APIが使えない場合のフォールバック
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        let summary = `【AI分析レポート（自動生成）】\n対象期間: ${startDate.toLocaleDateString()} 〜 ${endDate.toLocaleDateString()}\n提出数: ${submissionCount}件 / 参加人数: ${employeeCount}名 / 合計獲得ポイント: ${totalPoints.toLocaleString()} pt\n\n`

        summary += `期間中の活動サマリーです。Gemini APIキーが設定されていないため、統計情報のみを表示しています。\n`
        summary += `上位の活躍:\n`

        // ポイント上位3名を表示
        const sorted = Array.from(employeeStats.values()).sort((a, b) => b.points - a.points).slice(0, 3)
        sorted.forEach((s, i) => {
            summary += `${i + 1}. ${s.name}: ${s.points}pt\n`
        })

        return summary
    }

    try {
        // プロンプトの構築
        const employeeDetails = Array.from(employeeStats.values())
            .map(s => `・${s.name}: ${s.points}pt ${s.notes.length > 0 ? `(コメント: ${s.notes.slice(0, 2).join(', ')}...)` : ''}`)
            .join('\n')

        const aiPrompt = `あなたは人事評価システムの分析AIアシスタントです。
以下の期間の社員の活動データ（チェックリスト提出状況）に基づき、管理者向けの分析レポートを作成してください。

【対象期間】${startDate.toLocaleDateString()} 〜 ${endDate.toLocaleDateString()}
【全体統計】
- 総提出数: ${submissionCount}件
- 参加人数: ${employeeCount}名
- 合計獲得ポイント: ${totalPoints.toLocaleString()} pt

【社員ごとの主な活動状況】
${employeeDetails}

【指示】
1. 全体の活動傾向を要約してください（活発だったか、誰が活躍したかなど）。
2. 特に成果を上げている社員や、注目すべきコメントがあれば具体的に言及してください。
3. 全体で300文字程度の、丁寧かつ激励を含むトーンでまとめてください。
4. Markdown形式は使わず、プレーンテキストで出力してください。`

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
        const result = await model.generateContent(aiPrompt)
        const response = await result.response
        return response.text()
    } catch (error) {
        console.error('AI generation failed:', error)
        return `AIレポートの生成中にエラーが発生しました。\n提出数: ${submissionCount}件\n参加人数: ${employeeCount}名\n合計ポイント: ${totalPoints}pt`
    }
}

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
                items: true
            }
        })

        // 社員情報取得
        const employeeIds = [...new Set(submissions.map(s => s.employeeId))]
        const employees = await prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, name: true }
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

        // 3. Generate Summary with AI
        const summary = await generateAIReport(startDate, endDate, submissions, employees)

        const report = await prisma.personnelEvaluationAIReport.create({
            data: {
                startDate,
                endDate,
                summary,
                promptId: body.promptId || 'gemini-flash',
                promptName: body.promptName || 'Gemini 2.0 Flash Lite',
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

export async function PUT(request: Request) {
    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, summary } = body

        if (!id || !summary) {
            return NextResponse.json({ error: 'ID and summary are required' }, { status: 400 })
        }

        const updatedReport = await prisma.personnelEvaluationAIReport.update({
            where: { id },
            data: {
                summary,
                createdBy: userId // 最終更新者として記録
            }
        })

        return NextResponse.json(updatedReport)
    } catch (error) {
        console.error('PUT /api/evaluations/ai-report error:', error)
        return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        await prisma.personnelEvaluationAIReport.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/evaluations/ai-report error:', error)
        return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }
}
