"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Settings, Plus, Trash2, Palette } from "lucide-react"

interface DefaultLabel {
  id: string
  name: string
  color: string
}

interface DefaultPriority {
  value: string
  label: string
}

interface DefaultStatus {
  value: string
  label: string
}

const INITIAL_LABELS: DefaultLabel[] = [
  { id: "label-1", name: "緊急", color: "#ef4444" },
  { id: "label-2", name: "重要", color: "#f59e0b" },
  { id: "label-3", name: "バグ", color: "#dc2626" },
  { id: "label-4", name: "機能追加", color: "#3b82f6" },
  { id: "label-5", name: "改善", color: "#10b981" },
  { id: "label-6", name: "ドキュメント", color: "#8b5cf6" },
]

const INITIAL_PRIORITIES: DefaultPriority[] = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
]

const INITIAL_STATUSES: DefaultStatus[] = [
  { value: "todo", label: "未着手" },
  { value: "in-progress", label: "進行中" },
  { value: "review", label: "レビュー" },
  { value: "done", label: "完了" },
]

// カード色のプリセット
const CARD_COLORS = [
  { name: "白", value: "#ffffff", color: "#ffffff" },
  { name: "薄い青", value: "#eff6ff", color: "#3b82f6" },
  { name: "薄い緑", value: "#f0fdf4", color: "#10b981" },
  { name: "薄い黄", value: "#fefce8", color: "#eab308" },
  { name: "薄い赤", value: "#fef2f2", color: "#ef4444" },
  { name: "薄い紫", value: "#faf5ff", color: "#8b5cf6" },
  { name: "薄いピンク", value: "#fdf2f8", color: "#ec4899" },
  { name: "薄いオレンジ", value: "#fff7ed", color: "#f97316" },
  { name: "薄いグレー", value: "#f8fafc", color: "#64748b" },
  { name: "薄いシアン", value: "#ecfeff", color: "#06b6d4" },
  { name: "薄いライム", value: "#f7fee7", color: "#84cc16" },
  { name: "薄いローズ", value: "#fff1f2", color: "#f43f5e" },
]

// リスト色のプリセット
const LIST_COLORS = [
  { name: "デフォルト", value: "#f1f5f9", color: "#64748b" },
  { name: "青", value: "#dbeafe", color: "#3b82f6" },
  { name: "緑", value: "#dcfce7", color: "#10b981" },
  { name: "黄", value: "#fef3c7", color: "#f59e0b" },
  { name: "赤", value: "#fee2e2", color: "#ef4444" },
  { name: "紫", value: "#ede9fe", color: "#8b5cf6" },
  { name: "ピンク", value: "#fce7f3", color: "#ec4899" },
  { name: "オレンジ", value: "#fed7aa", color: "#f97316" },
  { name: "グレー", value: "#e2e8f0", color: "#64748b" },
  { name: "シアン", value: "#cffafe", color: "#06b6d4" },
  { name: "ライム", value: "#ecfccb", color: "#84cc16" },
  { name: "ローズ", value: "#ffe4e6", color: "#f43f5e" },
]

export function DefaultCardSettingsDialog() {
  const [open, setOpen] = useState(false)
  const [labels, setLabels] = useState<DefaultLabel[]>(INITIAL_LABELS)
  const [priorities, setPriorities] = useState<DefaultPriority[]>(INITIAL_PRIORITIES)
  const [statuses, setStatuses] = useState<DefaultStatus[]>(INITIAL_STATUSES)
  const [defaultCardColor, setDefaultCardColor] = useState("#ffffff")
  const [defaultListColor, setDefaultListColor] = useState("#f1f5f9")

  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6")
  const [newPriorityValue, setNewPriorityValue] = useState("")
  const [newPriorityLabel, setNewPriorityLabel] = useState("")
  const [newStatusValue, setNewStatusValue] = useState("")
  const [newStatusLabel, setNewStatusLabel] = useState("")

  const handleAddLabel = () => {
    if (newLabelName.trim()) {
      setLabels([...labels, { id: `label-${Date.now()}`, name: newLabelName, color: newLabelColor }])
      setNewLabelName("")
      setNewLabelColor("#3b82f6")
    }
  }

  const handleDeleteLabel = (id: string) => {
    setLabels(labels.filter((l) => l.id !== id))
  }

  const handleAddPriority = () => {
    if (newPriorityValue.trim() && newPriorityLabel.trim()) {
      // 値を小文字に統一
      const normalizedValue = newPriorityValue.trim().toLowerCase()
      setPriorities([...priorities, { value: normalizedValue, label: newPriorityLabel.trim() }])
      setNewPriorityValue("")
      setNewPriorityLabel("")
    }
  }

  const handleDeletePriority = (value: string) => {
    setPriorities(priorities.filter((p) => p.value !== value))
  }

  const handleAddStatus = () => {
    if (newStatusValue.trim() && newStatusLabel.trim()) {
      // 値を小文字に統一し、ハイフンで区切る
      const normalizedValue = newStatusValue.trim().toLowerCase().replace(/\s+/g, '-')
      setStatuses([...statuses, { value: normalizedValue, label: newStatusLabel.trim() }])
      setNewStatusValue("")
      setNewStatusLabel("")
    }
  }

  const handleDeleteStatus = (value: string) => {
    setStatuses(statuses.filter((s) => s.value !== value))
  }

  const handleSave = () => {
    console.log("[v0] Saving default card settings:", { 
      labels, 
      priorities, 
      statuses, 
      defaultCardColor, 
      defaultListColor 
    })
    // localStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('default-card-settings', JSON.stringify({
        labels,
        priorities,
        statuses,
        defaultCardColor,
        defaultListColor
      }))
    }
    alert("デフォルト設定を保存しました。全てのボードのカードに反映されます。")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          デフォルト編集
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>カードのデフォルト設定</DialogTitle>
          <p className="text-sm text-slate-600">
            全てのボードのカードに適用されるデフォルトのラベル、重要度、状態、色を設定します
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Labels Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">ラベル</h3>
            <div className="space-y-2 mb-3">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center justify-between">
                  <Badge style={{ backgroundColor: label.color }} className="text-white">
                    {label.name}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteLabel(label.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="ラベル名"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-1"
              />
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <Button onClick={handleAddLabel} size="sm">
                <Plus className="w-3 h-3 mr-1" />
                追加
              </Button>
            </div>
          </div>

          {/* Priorities Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">重要度</h3>
            <div className="space-y-2 mb-3">
              {priorities.map((priority) => (
                <div key={priority.value} className="flex items-center justify-between">
                  <span className="text-sm">
                    {priority.label} ({priority.value})
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePriority(priority.value)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="表示名"
                value={newPriorityLabel}
                onChange={(e) => setNewPriorityLabel(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="値"
                value={newPriorityValue}
                onChange={(e) => setNewPriorityValue(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddPriority} size="sm">
                <Plus className="w-3 h-3 mr-1" />
                追加
              </Button>
            </div>
          </div>

          {/* Statuses Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">状態</h3>
            <div className="space-y-2 mb-3">
              {statuses.map((status) => (
                <div key={status.value} className="flex items-center justify-between">
                  <span className="text-sm">
                    {status.label} ({status.value})
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteStatus(status.value)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="表示名"
                value={newStatusLabel}
                onChange={(e) => setNewStatusLabel(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="値"
                value={newStatusValue}
                onChange={(e) => setNewStatusValue(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddStatus} size="sm">
                <Plus className="w-3 h-3 mr-1" />
                追加
              </Button>
            </div>
          </div>

          {/* Card Colors Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              デフォルトカード色
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {CARD_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setDefaultCardColor(color.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    defaultCardColor === color.value 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {defaultCardColor === color.value && (
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center mx-auto">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List Colors Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              デフォルトリスト色
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {LIST_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setDefaultListColor(color.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    defaultListColor === color.value 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {defaultListColor === color.value && (
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center mx-auto">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
