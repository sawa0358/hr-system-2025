"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle, Building2, LayoutGrid, List, FileText } from "lucide-react"

export function TaskStructureGuide() {
  const [open, setOpen] = useState(false)

  const structureData = [
    {
      level: 1,
      title: "ワークスペース",
      description: "プロジェクトやチーム全体を管理する最上位の単位です。複数のボードを含むことができます。",
      icon: Building2,
      color: "bg-blue-100 text-blue-600",
      example: "例: 「開発チーム」「マーケティング部」"
    },
    {
      level: 2,
      title: "ボード",
      description: "ワークスペース内で特定のプロジェクトや作業を管理する単位です。複数のリストを含みます。",
      icon: LayoutGrid,
      color: "bg-green-100 text-green-600",
      example: "例: 「Webサイト改修」「新商品企画」"
    },
    {
      level: 3,
      title: "リスト",
      description: "作業の進捗段階を表します。カードを左右に移動して進捗を管理できます。",
      icon: List,
      color: "bg-yellow-100 text-yellow-600",
      example: "例: 「ToDo」「進行中」「完了」"
    },
    {
      level: 4,
      title: "カード",
      description: "個別のタスクや作業項目です。詳細情報、担当者、期限などを設定できます。",
      icon: FileText,
      color: "bg-purple-100 text-purple-600",
      example: "例: 「ログイン機能の実装」「資料作成」"
    }
  ]

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <HelpCircle className="w-4 h-4" />
        構造を確認
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              タスク管理の構造について
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 構造の概要 */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">階層構造</h3>
              <p className="text-sm text-slate-600">
                タスク管理システムは4つの階層で構成されています。上位から順番に理解することで、
                効率的なタスク管理ができるようになります。
              </p>
            </div>

            {/* 階層構造の図 */}
            <div className="relative">
              <div className="space-y-4">
                {structureData.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <div key={item.level} className="flex items-start gap-4">
                      {/* 階層番号とアイコン */}
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center font-bold text-lg`}>
                          {item.level}
                        </div>
                        {index < structureData.length - 1 && (
                          <div className="w-0.5 h-8 bg-slate-300 mt-2"></div>
                        )}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Icon className="w-6 h-6 text-slate-600" />
                          <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {item.description}
                        </p>
                        <div className="text-xs text-slate-500 italic">
                          {item.example}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 使用例 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">実際の使用例</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-700">1.</span>
                  <span className="text-blue-800">「開発チーム」ワークスペースを作成</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-700">2.</span>
                  <span className="text-blue-800">「Webサイト改修」ボードを作成</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-700">3.</span>
                  <span className="text-blue-800">「ToDo」「進行中」「完了」リストを設定</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-700">4.</span>
                  <span className="text-blue-800">各リストに具体的なタスクカードを追加</span>
                </div>
              </div>
            </div>

            {/* 操作のヒント */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">操作のヒント</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="font-medium text-green-700">カードの移動</div>
                  <div className="text-green-800">ドラッグ&ドロップでリスト間を移動</div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-green-700">詳細設定</div>
                  <div className="text-green-800">カードをクリックして詳細を編集</div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-green-700">権限管理</div>
                  <div className="text-green-800">ワークスペースごとにメンバーを管理</div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-green-700">フィルター機能</div>
                  <div className="text-green-800">条件を指定してタスクを絞り込み</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-700">
              理解しました
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
