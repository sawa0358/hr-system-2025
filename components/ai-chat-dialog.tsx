"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Trash2, RotateCcw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  userId?: string // セキュリティのためユーザーIDを追加
}

interface AIChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  context?: string
}

export function AIChatDialog({ open, onOpenChange, title = "総合AI", context }: AIChatDialogProps) {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [isIMEActive, setIsIMEActive] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 社員ごとのチャット履歴キーを生成
  const getChatHistoryKey = () => {
    if (!currentUser?.id) return null
    return `ai-chat-history-${currentUser.id}`
  }

  // ローカルストレージから社員ごとのチャット履歴を読み込み
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.id) {
      const chatHistoryKey = getChatHistoryKey()
      if (chatHistoryKey) {
        const savedMessages = localStorage.getItem(chatHistoryKey)
        if (savedMessages) {
          try {
            const parsed = JSON.parse(savedMessages)
            // タイムスタンプをDateオブジェクトに変換し、ユーザーIDを検証
            const messagesWithDates = parsed
              .filter((msg: any) => {
                // 現在のユーザーのメッセージのみを表示
                return msg.userId === currentUser.id
              })
              .map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            setMessages(messagesWithDates)
          } catch (error) {
            console.error('チャット履歴の読み込みに失敗:', error)
          }
        } else {
          // 新しいユーザーの場合は空の履歴で開始
          setMessages([])
        }
      }
    } else if (!currentUser?.id) {
      // ログインしていない場合は空の履歴で開始
      setMessages([])
    }
  }, [currentUser?.id])

  // メッセージが更新されたら社員ごとのローカルストレージに保存
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.id) {
      const chatHistoryKey = getChatHistoryKey()
      if (chatHistoryKey && messages.length > 0) {
        localStorage.setItem(chatHistoryKey, JSON.stringify(messages))
      }
    }
  }, [messages, currentUser?.id])

  // スクロールを最下部に移動する関数（即座に実行）
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    if (messages.length > 0) {
      // 即座にスクロール、必要に応じて再試行
      scrollToBottom()
      
      // 短い遅延で再試行（アニメーションなし）
      setTimeout(scrollToBottom, 10)
      setTimeout(scrollToBottom, 50)
    }
  }, [messages, isLoading])

  // ダイアログが開かれた時に最新の会話にスクロール
  useEffect(() => {
    if (open && messages.length > 0) {
      // 即座にスクロール実行
      scrollToBottom()
      
      // 短い遅延で再試行（アニメーションなし）
      setTimeout(scrollToBottom, 10)
      setTimeout(scrollToBottom, 50)
      setTimeout(scrollToBottom, 100)
    }
  }, [open, messages.length])

  // チャット履歴をクリア（社員ごと）
  const clearChatHistory = () => {
    setMessages([])
    const chatHistoryKey = getChatHistoryKey()
    if (chatHistoryKey) {
      localStorage.removeItem(chatHistoryKey)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      userId: currentUser?.id, // ユーザーIDを追加
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      // Gemini APIを呼び出し
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          context: context,
          history: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "APIエラーが発生しました")
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        userId: currentUser?.id, // ユーザーIDを追加
      }

      setMessages([...newMessages, aiMessage])
    } catch (error: any) {
      console.error("AI応答エラー:", error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `エラーが発生しました: ${error.message}\n\nGEMINI_API_KEYが設定されているか確認してください。`,
        timestamp: new Date(),
        userId: currentUser?.id, // ユーザーIDを追加
      }
      setMessages([...newMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[85vh] flex flex-col"
        style={{ backgroundColor: '#bddcd9' }}
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              AIアシスタント
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContext(!showContext)}
                className="text-xs"
              >
                コンテキスト {showContext ? "非表示" : "表示"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatHistory}
                className="text-xs text-red-600 hover:text-red-700"
                disabled={messages.length === 0}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                履歴クリア
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* コンテキスト情報（折りたたみ可能） */}
        {showContext && context && (
          <div className="flex-shrink-0 mb-4 p-3 bg-slate-50 rounded-lg border text-xs">
            <div className="max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-slate-700">{context}</pre>
            </div>
          </div>
        )}

        {/* チャット履歴エリア */}
        <div 
          className="flex-1 overflow-y-auto pr-4"
          ref={scrollAreaRef}
          style={{ scrollBehavior: 'auto' }}
        >
          <div className="space-y-4 pb-4 px-1">
            {messages.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Bot className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">AIに質問してください</p>
                <p className="text-sm mt-2">システム全体の情報を横断的に検索できます</p>
                <div className="mt-4 text-xs text-slate-400">
                  <p>💡 ヒント: 「このページの使い方を教えて」などと質問してみてください</p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`flex flex-col max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === "user" 
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md" 
                        : "bg-white border border-slate-200 text-slate-900 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                  <p className={`text-xs mt-1 px-2 ${message.role === "user" ? "text-slate-500" : "text-slate-400"}`}>
                    {message.timestamp.toLocaleTimeString('ja-JP', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 入力エリア */}
        <div className="flex-shrink-0 flex gap-2 pt-4 border-t" style={{ backgroundColor: '#bddcd9' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            ref={inputRef}
            onCompositionStart={(e) => {
              setIsComposing(true)
              setIsIMEActive(true)
            }}
            onCompositionEnd={(e) => {
              setIsComposing(false)
              // 変換確定後、少し遅延してIME状態をリセット
              setTimeout(() => {
                setIsIMEActive(false)
              }, 100)
            }}
            onKeyDown={(e) => {
              // Enterキーが押された場合のみ処理
              if (e.key === "Enter" || e.keyCode === 13) {
                // Shift+Enter は改行として処理（送信しない）
                if (e.shiftKey) {
                  return
                }
                
                // IME使用中または変換中は送信しない
                if (isComposing || isIMEActive) {
                  console.log('IME使用中なので送信をスキップ', { isComposing, isIMEActive })
                  e.preventDefault()
                  return
                }
                
                // 入力が空の場合は送信しない
                if (!input.trim()) {
                  e.preventDefault()
                  return
                }
                
                e.preventDefault()
                console.log('メッセージを送信')
                handleSend()
              }
            }}
            onInput={(e) => {
              // IME使用中かどうかをリアルタイムで検出
              const target = e.target as HTMLInputElement
              if (target.composing || target.isComposing) {
                setIsIMEActive(true)
              }
            }}
            placeholder="メッセージを入力してください..."
            disabled={isLoading}
            className="flex-1 rounded-full border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()} 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full px-4 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
