import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Gemini APIクライアントを初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json()

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return NextResponse.json(
        { 
          error: "AIチャット機能を利用するには、Gemini APIキーの設定が必要です。",
          details: "管理者にお問い合わせください。APIキーは.env.localファイルに設定されます。"
        },
        { status: 503 }
      )
    }

    if (!message) {
      return NextResponse.json({ error: "メッセージが必要です。" }, { status: 400 })
    }

    // Gemini Flash Lite モデルを使用
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })

    // システムプロンプトの構築
    let systemPrompt = `あなたは人事管理システムのAIアシスタントです。
ユーザーからの質問に対して、親切で正確な回答を提供してください。

【システムの概要】
- 従業員管理
- 勤怠管理
- 給与計算
- 人事評価
- タスク管理
- 組織図管理
- 掲示板機能

【回答時の注意】
- 日本語で回答してください
- 分かりやすく簡潔に説明してください
- 必要に応じて具体例を挙げてください
- システムの機能に関する質問には、詳細な手順を提供してください
`

    // コンテキスト情報がある場合は追加
    if (context) {
      systemPrompt += `\n【現在のページコンテキスト】\n${context}\n\nユーザーは現在このページの情報に基づいて質問している可能性があります。`
    }

    // 会話履歴を構築
    const chatHistory = history
      ? history.map((msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }))
      : []

    // チャットセッションを開始
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "承知しました。人事管理システムのAIアシスタントとして、お手伝いさせていただきます。" }],
        },
        ...chatHistory,
      ],
    })

    // メッセージを送信
    const result = await chat.sendMessage(message)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      message: text,
      success: true,
    })
  } catch (error: any) {
    console.error("Gemini API エラー:", error)
    return NextResponse.json(
      {
        error: "AIの応答中にエラーが発生しました。",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

