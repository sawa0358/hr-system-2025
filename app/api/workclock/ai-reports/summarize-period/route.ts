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

interface AIReport {
    id: string
    date: Date
    summary: string
    promptId: string | null
    promptName: string | null
    workerCount: number
    alerts: number
    totalReward: number
}

// POST /api/workclock/ai-reports/summarize-period - 期間内の全AIレポートを統合要約
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const body = await request.json()
        const { startDate, endDate, promptName, promptContent } = body

        if (!startDate || !endDate) {
            return NextResponse.json({ error: '開始日と終了日が必要です' }, { status: 400 })
        }

        const startDateObj = parseDate(startDate)
        const endDateObj = parseDate(endDate)
        endDateObj.setHours(23, 59, 59, 999)

        console.log('[summarize-period] Query date range:', startDate, 'to', endDate)

        // 期間内の全AIレポートを取得
        const reports = await (prisma as any).workClockAIReport.findMany({
            where: {
                date: {
                    gte: startDateObj,
                    lte: endDateObj
                }
            },
            orderBy: { date: 'desc' }
        }) as AIReport[]

        console.log('[summarize-period] Found reports:', reports.length)

        if (reports.length === 0) {
            return NextResponse.json({
                error: '指定期間にAIレポートがありません',
                summary: null
            }, { status: 404 })
        }

        // 統計を計算
        const totalWorkerCount = reports.reduce((acc: number, r: AIReport) => acc + r.workerCount, 0)
        const totalAlerts = reports.reduce((acc: number, r: AIReport) => acc + r.alerts, 0)
        const totalReward = reports.reduce((acc: number, r: AIReport) => acc + r.totalReward, 0)
        const avgWorkerCount = Math.round(totalWorkerCount / reports.length)
        const avgReward = Math.round(totalReward / reports.length)

        // 各レポートのサマリーを抽出
        const reportSummaries = reports.map((r: AIReport) => ({
            date: formatDate(new Date(r.date)),
            summary: r.summary,
            workerCount: r.workerCount,
            alerts: r.alerts,
            totalReward: r.totalReward
        }))

        let periodSummary: string

        // Gemini APIが使えない場合はテンプレートで生成
        console.log('[summarize-period] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'set' : 'not set')
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.log('[summarize-period] Using template fallback')
            // 記入内容を抽出
            const keyContents = reports
                .map((r: AIReport) => {
                    const match = r.summary.match(/【記入内容】([\s\S]*?)$/m)
                    return match ? match[1].trim() : null
                })
                .filter(Boolean)
                .slice(0, 5) // 最大5件表示

            periodSummary = `【${promptName || '期間統合分析'}】
選択プロンプト: ${promptContent || '全レポートを統合分析'}

対象期間: ${startDate} 〜 ${endDate}
レポート数: ${reports.length}日分
延べ報告者数: ${totalWorkerCount.toLocaleString()}名（日平均: ${avgWorkerCount}名）
合計インセンティブ: ¥${totalReward.toLocaleString()}（日平均: ¥${avgReward.toLocaleString()}）
リスク報告: 計${totalAlerts}件

【期間総括】
・${reports.length}日間のチェックリスト報告を統合分析しました。
・平均${avgWorkerCount}名/日の報告が提出されています。
・リスク報告は合計${totalAlerts}件でした。${totalAlerts > 0 ? '継続的な監視が必要です。' : '安全管理は良好です。'}
・インセンティブの日平均は¥${avgReward.toLocaleString()}で、業務完了率は安定しています。

${keyContents.length > 0 ? `【主な記入内容サンプル】\n${keyContents.join('\n').substring(0, 500)}${keyContents.join('\n').length > 500 ? '...' : ''}` : ''}`

        } else {
            // Gemini AIで高度な統合分析
            try {
                const aiPrompt = `以下は${startDate}から${endDate}までの${reports.length}日間のAI総括レポート履歴です。
これらを統合分析し、期間全体の傾向と改善提案をまとめてください。

【分析観点】
${promptContent || 'レポートを要約し、重要な傾向とリスク、改善提案を提示してください。'}

【統計サマリー】
・レポート数: ${reports.length}日分
・延べ報告者数: ${totalWorkerCount}名（日平均: ${avgWorkerCount}名）
・合計インセンティブ: ¥${totalReward.toLocaleString()}（日平均: ¥${avgReward.toLocaleString()}）
・リスク報告: 計${totalAlerts}件

【日別レポート一覧】
${reportSummaries.map(rs => `${rs.date}: ${rs.workerCount}名, ¥${rs.totalReward}, アラート${rs.alerts}件\n概要: ${rs.summary.substring(0, 200)}`).join('\n\n')}

上記を踏まえて、3〜5段落で統合分析レポートを作成してください。`

                console.log('[summarize-period] Calling Gemini AI...')

                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

                // タイムアウト付きで実行
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 25000) // 25秒でタイムアウト

                try {
                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
                    })
                    clearTimeout(timeoutId)

                    const response = await result.response
                    const text = response.text()

                    periodSummary = `【${promptName || 'AI期間統合分析'}】
選択プロンプト: ${promptContent || '全レポートを統合分析'}

対象期間: ${startDate} 〜 ${endDate}
レポート数: ${reports.length}日分 / 延べ${totalWorkerCount}名

${text}`
                } catch (aiError: any) {
                    clearTimeout(timeoutId)
                    if (aiError.name === 'AbortError' || aiError.message?.includes('abort')) {
                        console.error('[summarize-period] Gemini AI timed out')
                        throw new Error('AI分析がタイムアウトしました。統計サマリーを表示します。')
                    }
                    throw aiError
                }

            } catch (error: any) {
                console.error('AI generation failed:', error)
                // フォールバック
                periodSummary = `【期間統合分析（統計情報）】
対象期間: ${startDate} 〜 ${endDate}
レポート数: ${reports.length}日分

統計:
・延べ報告者数: ${totalWorkerCount}名
・合計インセンティブ: ¥${totalReward.toLocaleString()}
・リスク報告: ${totalAlerts}件

※AIによる詳細分析が混雑中のため、統計情報のみを表示しています。`
            }
        }

        console.log('[summarize-period] Returning summary, length:', periodSummary.length)

        // 同じ日付の既存の期間統合レポートがあれば削除
        await (prisma as any).workClockAIReport.deleteMany({
            where: {
                date: endDateObj,
                promptName: promptName || '期間統合分析'
            }
        })

        // 新規作成
        const savedReport = await (prisma as any).workClockAIReport.create({
            data: {
                date: endDateObj,
                summary: periodSummary,
                workerCount: totalWorkerCount,
                alerts: totalAlerts,
                totalReward: totalReward,
                promptName: promptName || '期間統合分析',
                createdBy: userId
            }
        })

        return NextResponse.json({
            summary: periodSummary,
            report: savedReport,
            stats: {
                reportCount: reports.length,
                totalWorkerCount,
                totalAlerts,
                totalReward,
                avgWorkerCount,
                avgReward
            }
        })

    } catch (error) {
        console.error('POST /api/workclock/ai-reports/summarize-period error:', error)
        return NextResponse.json({ error: '期間統合に失敗しました' }, { status: 500 })
    }
}
