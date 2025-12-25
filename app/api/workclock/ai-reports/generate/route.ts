import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

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

// POST /api/workclock/ai-reports/generate - AIでレポートを生成
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-employee-id')
        if (!userId) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
        }

        const body = await request.json()
        const { date, promptName } = body

        if (!date) {
            return NextResponse.json({ error: '日付が必要です' }, { status: 400 })
        }

        // APIキーのチェック
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return NextResponse.json({
                error: 'AIレポート生成機能を利用するには、Gemini APIキーの設定が必要です。',
                details: '管理者にお問い合わせください。'
            }, { status: 503 })
        }

        const targetDate = parseDate(date)
        const endOfDay = new Date(targetDate)
        endOfDay.setHours(23, 59, 59, 999)

        // チェックリスト提出データを取得
        const submissions = await (prisma as any).workClockChecklistSubmission.findMany({
            where: {
                date: {
                    gte: targetDate,
                    lte: endOfDay,
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
        const workerMap = workers.reduce((acc: any, w: any) => {
            acc[w.id] = w.name
            return acc
        }, {})

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

        // 統計を計算
        const workerCount = analysisData.length
        const alerts = analysisData.filter((d: any) => d.isSafetyAlert).length
        const totalReward = analysisData.reduce((acc: number, d: any) => acc + d.totalReward, 0)
        const completedCount = analysisData.filter((d: any) => d.checkedCount === d.totalItems).length

        // AIプロンプトを構築
        const dateStr = formatDate(targetDate)
        const weekday = getJapaneseWeekday(targetDate)

        const aiPrompt = `あなたは業務管理システムの分析アシスタントです。
以下のチェックリスト提出データを分析し、簡潔な日次レポートを生成してください。

【分析対象日】${dateStr} (${weekday})

【チェックリスト提出データ】
${analysisData.map((d: any) => `
■ ${d.workerName}
  - 完了: ${d.checkedCount}/${d.totalItems}項目
  - インセンティブ: ¥${d.totalReward.toLocaleString()}
  ${d.isSafetyAlert ? '  - ⚠️ ヒヤリハット報告あり' : ''}
  ${d.freeTexts.length > 0 ? `  - 自由記入: ${d.freeTexts.join(' / ')}` : ''}
  ${d.memo ? `  - メモ: ${d.memo}` : ''}
`).join('')}

【統計サマリー】
- 報告者数: ${workerCount}名
- 全項目完了者: ${completedCount}名
- ヒヤリハット報告: ${alerts}件
- 合計インセンティブ: ¥${totalReward.toLocaleString()}

【レポート生成指示】
1. 全体の状況を1-2文で要約
2. 良かった点があれば1点
3. 改善が必要な点があれば1点
4. ヒヤリハット報告がある場合は注意喚起
5. 自由記入欄の内容で重要なものがあれば言及

簡潔に、3-5行程度でまとめてください。`

        // Gemini APIを呼び出し
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
        const result = await model.generateContent(aiPrompt)
        const response = await result.response
        const summary = response.text()

        // DBに保存
        const report = await (prisma as any).workClockAIReport.create({
            data: {
                date: targetDate,
                summary,
                promptId: null,
                promptName: promptName || 'AI分析',
                workerCount,
                alerts,
                totalReward,
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
        console.error('POST /api/workclock/ai-reports/generate error:', error)
        return NextResponse.json({ error: 'レポートの生成に失敗しました' }, { status: 500 })
    }
}
