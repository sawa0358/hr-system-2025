"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"

interface EmploymentType {
  value: string
  label: string
}

interface EmploymentTypeManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employmentTypes: EmploymentType[]
  onEmploymentTypesChange: (types: EmploymentType[]) => void
}

export function EmploymentTypeManagerDialog({
  open,
  onOpenChange,
  employmentTypes,
  onEmploymentTypesChange,
}: EmploymentTypeManagerDialogProps) {
  const [localTypes, setLocalTypes] = useState<EmploymentType[]>(employmentTypes)
  const [newTypeLabel, setNewTypeLabel] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState("")

  // ラベルから自動的に値を生成する関数
  const generateValueFromLabel = (label: string): string => {
    // 日本語の雇用形態名を英語の値に変換するマッピング
    const japaneseToEnglishMap: { [key: string]: string } = {
      '正社員': 'employee',
      '契約社員': 'contractor',
      'パートタイム': 'part_time',
      'アルバイト': 'part_time',
      '派遣社員': 'dispatched',
      '業務委託': 'contract',
      '外注先': 'outsourcing',
      '嘱託': 'advisor',
      '非常勤': 'non_regular',
      'インターン': 'intern'
    }

    // 日本語マッピングをチェック
    if (japaneseToEnglishMap[label]) {
      return japaneseToEnglishMap[label]
    }

    // マッピングにない日本語の場合は、ローマ字変換の代わりに簡易的な英数字IDを生成
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(label)) {
      // 日本語文字が含まれている場合、ラベルのハッシュ値を基にIDを生成
      let hash = 0
      for (let i = 0; i < label.length; i++) {
        const char = label.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 32bit整数に変換
      }
      return `employment_type_${Math.abs(hash)}`
    }

    // 英語の場合はそのまま処理
    return label
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '')
      .replace(/^_+|_+$/g, '')
  }

  const handleAddType = () => {
    if (newTypeLabel.trim()) {
      const generatedValue = generateValueFromLabel(newTypeLabel.trim())
      
      // 生成された値が空でないことを確認
      if (!generatedValue || generatedValue.trim() === '') {
        alert("有効な雇用形態名を入力してください")
        return
      }
      
      // 既に同じ値が存在するかチェック
      const existingType = localTypes.find(type => type.value === generatedValue)
      if (existingType) {
        alert("この雇用形態は既に存在します")
        return
      }
      
      const newType: EmploymentType = {
        value: generatedValue,
        label: newTypeLabel.trim()
      }
      setLocalTypes([...localTypes, newType])
      setNewTypeLabel("")
    }
  }

  const handleEditType = (index: number) => {
    const type = localTypes[index]
    setEditingIndex(index)
    setEditLabel(type.label)
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editLabel.trim()) {
      const generatedValue = generateValueFromLabel(editLabel.trim())
      
      // 生成された値が空でないことを確認
      if (!generatedValue || generatedValue.trim() === '') {
        alert("有効な雇用形態名を入力してください")
        return
      }
      
      // 既に同じ値が存在するかチェック（自分以外）
      const existingType = localTypes.find((type, index) => 
        type.value === generatedValue && index !== editingIndex
      )
      if (existingType) {
        alert("この雇用形態は既に存在します")
        return
      }
      
      const updatedTypes = [...localTypes]
      updatedTypes[editingIndex] = {
        value: generatedValue,
        label: editLabel.trim()
      }
      setLocalTypes(updatedTypes)
      setEditingIndex(null)
      setEditLabel("")
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditLabel("")
  }

  const handleRemoveType = (index: number) => {
    setLocalTypes(localTypes.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onEmploymentTypesChange(localTypes)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>雇用形態の管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 新規追加 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">新規追加</h3>
            <div className="space-y-2">
              <Label>雇用形態名</Label>
              <Input
                value={newTypeLabel}
                onChange={(e) => setNewTypeLabel(e.target.value)}
                placeholder="例: 正社員, 契約社員, パートタイム"
              />
              <p className="text-xs text-slate-500">
                値は自動的に生成されます（例: 正社員 → employee）
              </p>
            </div>
            <Button onClick={handleAddType} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              追加
            </Button>
          </div>

          {/* 既存の雇用形態 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">既存の雇用形態</h3>
            <div className="space-y-2">
              {localTypes.map((type, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  {editingIndex === index ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="雇用形態名"
                        />
                        <p className="text-xs text-slate-500">
                          値は自動的に生成されます
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          保存
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          キャンセル
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-slate-500">{type.value}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditType(index)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRemoveType(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
