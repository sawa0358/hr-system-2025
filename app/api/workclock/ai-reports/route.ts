import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini APIクライアントを初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// 日付を正規化するヘルパー関数
function parseDate(dateStr: string): Date {
    const parts = dateStr.split('-').map(Number)
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
}

// 日付を文字列に変換するヘルパー関数
function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// 曜日を取得
function getJapaneseWeekday(date: Date): string {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return weekdays[date.getDay()]
}

// AIでレポートを生成する関数
async function generateAIReport(dateStr: string, submissions: any[], workerMap: Record<string, string>): Promise<string> {
    // データを分析用に整理
    const analysisData = submissions.map((s: any) => {
        const workerName = workerMap[s.workerId] || '不明'
        const items = s.items || []
        const checkedItems = items.filter((it: any) => it.isChecked || (it.isFreeText && it.freeTextValue?.trim()))
        const totalReward = items.reduce((acc: number, it: any) => {
            const isEligible = it.isChecked || (it.isFreeText && it.freeTextValue?.trim())
            return acc + (isEligible ? it.reward : 0)
        }, 0)
        const freeTexts = items.filter((it: any) => it.isFreeText && it.freeTextValue?.trim())
            .map((it: any) => `${it.title}: ${it.freeTextValue}`)

        return {
            workerName,
            checkedCount: checkedItems.length,
            totalItems: items.length,
            totalReward,
            isSafetyAlert: s.isSafetyAlert,
            memo: s.memo,
            freeTexts
        }
    })

    const workerCount = analysisData.length
    const alerts = analysisData.filter((d: any) => d.isSafetyAlert).length
    const totalReward = analysisData.reduce((acc: number, d: any) => acc + d.totalReward, 0)
    const completedCount = analysisData.filter((d: any) => d.checkedCount === d.totalItems).length

    // Gemini APIが使えない場合は自由記入欄を含む詳細レポート
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        // 自由記入欄のテキストを抽出
        const allFreeTexts = analysisData
            .filter((d: any) => d.freeTexts.length > 0)
            .map((d: any) => `[${d.workerName}] ${d.freeTexts.join(' / ')}`)

        let summary = `対象者: ${workerCount}名（完了: ${completedCount}名）/ 合計報酬: ¥${totalReward.toLocaleString()}`
        if (alerts > 0) {
            summary += ` / ⚠️ リスク報告: ${alerts}件`
        }
        if (allFreeTexts.length > 0) {
            summary += `\n\n【記入内容】\n${allFreeTexts.join('\n')}`
        }
        return summary
    }

    try {
        const targetDate = parseDate(dateStr)
        const weekday = getJapaneseWeekday(targetDate)

        const aiPrompt = `以下のチェックリスト提出データを分析し、1-2文の簡潔な日次サマリーを生成してください。

【日付】${dateStr} (${weekday})
【統計】報告者: ${workerCount}名 / 完了: ${completedCount}名 / リスク報告: ${alerts}件 / 合計: ¥${totalReward.toLocaleString()}

${analysisData.map((d: any) =>
            `${d.workerName}: ${d.checkedCount}/${d.totalItems}完了 ¥${d.totalReward}${d.isSafetyAlert ? ' ⚠️' : ''}${d.freeTexts.length > 0 ? ` [${d.freeTexts.join(' / ')}]` : ''}`
        ).join('\n')}

要点のみ1-2文で。自由記入欄に重要な内容があれば言及してください。`

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
        const result = await model.generateContent(aiPrompt)
        const response = await result.response
        return response.text()
    } catch (error) {
        console.error('AI generation failed, using fallback:', error)
        // フォールバック時も自由記入欄を含める
        const allFreeTexts = analysisData
            .filter((d: any) => d.freeTexts.length > 0)
            .map((d: any) => `[${d.workerName}] ${d.freeTexts.join(' / ')}`)

        let summary = `対象者: ${workerCount}名（完了: ${completedCount}名）/ 合計報酬: ¥${totalReward.toLocaleString()}`
        if (alerts > 0) {
            summary += ` / ⚠️ リスク報告: ${alerts}件`
        }
        if (allFreeTexts.length > 0) {
            summary += `\n\n【記入内容】\n${allFreeTexts.join('\n')}`
        }
        return summary
    }
}

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
        const autoGenerate = searchParams.get('autoGenerate') === 'true'
        const page = parseInt(searchParams.get('page') || '1')
        const requestedLimit = parseInt(searchParams.get('limit') || '10')
        const limit = Math.min(Math.max(requestedLimit, 1), 500) // 1〜500件の範囲で制限

        if (!startDate || !endDate) {
            return NextResponse.json({ error: '開始日と終了日が必要です' }, { status: 400 })
        }

        const startDateObj = parseDate(startDate)
        const endDateObj = parseDate(endDate)
        endDateObj.setHours(23, 59, 59, 999)

        // autoGenerateが有効な場合、チェックリスト提出がある日でAIレポートがない日を自動生成
        if (autoGenerate) {
            // 1. 期間内のチェックリスト提出がある日を取得
            const submissions = await (prisma as any).workClockChecklistSubmission.findMany({
                where: {
                    date: {
                        gte: startDateObj,
                        lte: endDateObj,
                    }
                },
                include: {
                    items: true
                }
            })

            // ワーカー情報を取得
            const workerIds = [...new Set(submissions.map((s: any) => s.workerId))]
            const workers = await (prisma as any).workClockWorker.findMany({
                where: { id: { in: workerIds } },
                select: { id: true, name: true }
            })
            const workerMap: Record<string, string> = workers.reduce((acc: any, w: any) => {
                acc[w.id] = w.name
                return acc
            }, {})

            // 日付ごとにグループ化
            const submissionsByDate: Record<string, any[]> = {}
            for (const s of submissions) {
                const dateStr = formatDate(new Date(s.date))
                if (!submissionsByDate[dateStr]) {
                    submissionsByDate[dateStr] = []
                }
                submissionsByDate[dateStr].push(s)
            }

            // 2. 既存のAIレポートを取得
            const existingReports = await (prisma as any).workClockAIReport.findMany({
                where: {
                    date: {
                        gte: startDateObj,
                        lte: endDateObj,
                    }
                },
                select: { date: true }
            })

            const existingDates = new Set(existingReports.map((r: any) => formatDate(new Date(r.date))))

            // 3. AIレポートがない日を自動生成
            for (const [dateStr, subs] of Object.entries(submissionsByDate)) {
                if (!existingDates.has(dateStr)) {
                    // この日のサマリーをAIで生成
                    const workerCount = subs.length
                    const alerts = subs.filter((s: any) => s.isSafetyAlert).length
                    const totalReward = subs.reduce((acc: number, s: any) => {
                        return acc + (s.items || []).reduce((itemAcc: number, item: any) => {
                            const isEligible = item.isChecked || (item.isFreeText && item.freeTextValue?.trim())
                            return itemAcc + (isEligible ? item.reward : 0)
                        }, 0)
                    }, 0)

                    // AIでサマリーを生成
                    const summary = await generateAIReport(dateStr, subs, workerMap)

                    // DBに保存
                    await (prisma as any).workClockAIReport.create({
                        data: {
                            date: parseDate(dateStr),
                            summary,
                            promptId: null,
                            promptName: 'AI分析',
                            workerCount,
                            alerts,
                            totalReward,
                            createdBy: userId,
                        }
                    })
                }
            }
        }

        // 最終的なレポート一覧を取得
        const where = {
            date: {
                gte: startDateObj,
                lte: endDateObj,
            }
        }

        const total = await (prisma as any).workClockAIReport.count({ where })

        const reports = await (prisma as any).workClockAIReport.findMany({
            where,
            orderBy: [
                { date: 'desc' },
                { createdAt: 'desc' }
            ],
            skip: (page - 1) * limit,
            take: limit,
        })

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

        const reportDate = parseDate(date)

        // 既存のレポートがあるか確認
        const existingReport = await (prisma as any).workClockAIReport.findFirst({
            where: {
                date: reportDate
            }
        })

        let report
        if (existingReport) {
            // 更新
            report = await (prisma as any).workClockAIReport.update({
                where: { id: existingReport.id },
                data: {
                    summary,
                    promptId: promptId || null,
                    promptName: promptName || null,
                    workerCount: workerCount || 0,
                    alerts: alerts || 0,
                    totalReward: totalReward || 0,
                    createdBy: userId, // 更新者として記録
                }
            })
        } else {
            // 新規作成
            report = await (prisma as any).workClockAIReport.create({
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
        }

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
