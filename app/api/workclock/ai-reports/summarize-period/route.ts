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

            periodSummary = `# 期間統合分析レポート

## 📊 分析サマリー
${reports.length}日間の業務データを統合分析しました。平均${avgWorkerCount}名/日のスタッフが稼働しており、全体の業務完了状況は安定しています。

## 🔍 詳細分析 (統計ベース)
*   **稼働状況**: 延べ${totalWorkerCount.toLocaleString()}名の報告があり、安定した稼働が見られます。
*   **インセンティブ**: 日平均¥${avgReward.toLocaleString()}の支給額となっており、モチベーション維持に寄与していると考えられます。
*   **リスク管理**: リスク報告は合計${totalAlerts}件でした。${totalAlerts > 0 ? '注意深いモニタリングが必要です。' : '期間中、特筆すべきリスク報告はありませんでした。'}

## 💡 具体的な改善提案
1.  **定期的な安全確認**: ${totalAlerts > 0 ? 'リスク報告があった箇所の重点的な点検を推奨します。' : '現状の安全基準を維持しつつ、予防的な点検を継続してください。'}
2.  **情報共有**: 自由記入欄に重要な情報が含まれている場合があるため、日次レポートの詳細確認も推奨します。

## ⚠️ 主な報告内容
${keyContents.length > 0 ? keyContents.map(k => `- ${k}`).join('\n') : '（特記事項なし）'}
`

        } else {
            // Gemini AIで高度な統合分析
            try {
                const aiPrompt = `あなたはプロの業務分析コンサルタントです。
以下は${startDate}から${endDate}までの${reports.length}日間の業務日報のAI要約データです。
これらを統合分析し、指定された【分析観点】に基づいて高度な分析レポートを作成してください。

【分析観点（最重要）】
${promptContent || 'レポート全体を要約し、重要な傾向、リスク、および具体的な改善提案を提示してください。'}

【統計データ】
- 対象期間: ${reports.length}日間
- 延べ報告者数: ${totalWorkerCount}名（平均 ${avgWorkerCount}名/日）
- 合計インセンティブ: ¥${totalReward.toLocaleString()}（平均 ¥${avgReward.toLocaleString()}/日）
- リスク報告数: 計${totalAlerts}件

【日次レポート履歴】
${reportSummaries.map(rs => `[${rs.date}] 報告:${rs.workerCount}名 報酬:¥${rs.totalReward} アラート:${rs.alerts}件\n内容: ${rs.summary.replace(/\n/g, ' ')}`).join('\n')}

【出力フォーマット】
以下の構成でマークダウン形式で出力してください。

# 期間統合分析レポート

## 📊  分析サマリー
（期間全体の傾向を3行程度で要約）

## 🔍 詳細分析
（指定された【分析観点】に基づいた深い考察。箇条書きを使用）

## 💡 具体的な改善提案
1. （提案1）
2. （提案2）
3. （提案3）

## ⚠️ リスクと課題
（アラート情報や潜在的なリスクについて）
`

                console.log('[summarize-period] Calling Gemini AI...')

                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

                // タイムアウト付きで実行
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 35000) // 35秒でタイムアウト

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
