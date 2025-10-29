"use client"

import { useState, useEffect } from "react"
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

  // ダイアログが開かれたときに employmentTypes を同期
  useEffect(() => {
    if (open) {
      setLocalTypes(employmentTypes)
      setNewTypeLabel("")
      setEditingIndex(null)
      setEditLabel("")
    }
  }, [open, employmentTypes])

  // ラベルから自動的に値を生成する関数
  const generateValueFromLabel = (label: string): string => {
    // Prisma EmployeeType enumで定義されている値のみを使用
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

    // マッピングにない場合は、ラベルから一意の値を生成
    // まず英数字とアンダースコアに変換を試みる
    let generated = label
      .toLowerCase()
      .replace(/\s+/g, '_') // スペースをアンダースコアに
      .replace(/[^a-z0-9_]/g, '') // 英数字とアンダースコア以外を削除
      .replace(/_+/g, '_') // 連続するアンダースコアを1つに
      .replace(/^_+|_+$/g, '') // 先頭・末尾のアンダースコアを削除
    
    // 空の場合（日本語などで英数字が含まれていない場合）はハッシュ値を使用
    if (!generated || generated.trim() === '') {
      // ラベルのハッシュ値を計算（簡単なハッシュ関数）
      let hash = 0
      for (let i = 0; i < label.length; i++) {
        const char = label.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      // 負の値を避けるため絶対値を使用
      generated = 'custom_' + Math.abs(hash).toString(36) + '_' + Date.now()
    }
    
    return generated
  }

  const handleAddType = () => {
    if (newTypeLabel.trim()) {
      const trimmedLabel = newTypeLabel.trim()
      
      // 同じラベルが既に存在するかチェック（ラベルベースでチェック）
      const existingTypeByLabel = localTypes.find(type => 
        type.label.toLowerCase() === trimmedLabel.toLowerCase() || 
        type.label === trimmedLabel
      )
      if (existingTypeByLabel) {
        alert(`${trimmedLabel} は既に存在します`)
        setNewTypeLabel("")
        return
      }
      
      // 値を生成（新しい関数では必ず値が生成される）
      let generatedValue = generateValueFromLabel(trimmedLabel)
      
      // 既存の値と重複しないように確認
      let counter = 1
      let originalValue = generatedValue
      while (localTypes.find(type => type.value === generatedValue)) {
        generatedValue = `${originalValue}_${counter}`
        counter++
      }
      
      const newType: EmploymentType = {
        value: generatedValue,
        label: trimmedLabel
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
      const trimmedLabel = editLabel.trim()
      
      // 同じラベルが既に存在するかチェック（自分以外）
      const existingTypeByLabel = localTypes.find((type, index) => 
        index !== editingIndex && 
        (type.label.toLowerCase() === trimmedLabel.toLowerCase() || type.label === trimmedLabel)
      )
      if (existingTypeByLabel) {
        alert(`${trimmedLabel} は既に存在します`)
        return
      }
      
      const generatedValue = generateValueFromLabel(trimmedLabel)
      
      // 既に同じ値が存在するかチェック（自分以外）
      const existingType = localTypes.find((type, index) => 
        index !== editingIndex && type.value === generatedValue
      )
      if (existingType) {
        // 値が重複する場合は、元の値を保持する
        const updatedTypes = [...localTypes]
        updatedTypes[editingIndex] = {
          ...updatedTypes[editingIndex],
          label: trimmedLabel
        }
        setLocalTypes(updatedTypes)
      } else {
        // 値が重複しない場合は、新しい値を設定
        const updatedTypes = [...localTypes]
        updatedTypes[editingIndex] = {
          value: generatedValue,
          label: trimmedLabel
        }
        setLocalTypes(updatedTypes)
      }
      
      setEditingIndex(null)
      setEditLabel("")
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditLabel("")
  }

  const handleRemoveType = (index: number) => {
    const type = localTypes[index]
    // 'employee'は削除できない（システムで使用されている重要な値）
    if (type.value === 'employee') {
      alert('「employee」は削除できません（システムで使用されています）')
      return
    }
    setLocalTypes(localTypes.filter((_, i) => i !== index))
  }
  
  // 削除不可能な雇用形態かチェック
  const isUnremovable = (type: EmploymentType) => {
    return type.value === 'employee'
  }

  const handleSave = () => {
    // employeeは常に含める（システムで使用されているため、表示はしないが保存はする）
    // ただし、既にlocalTypesにemployeeが含まれている場合はそのまま、なければ追加
    const hasEmployee = localTypes.some(t => t.value === 'employee')
    const typesToSave = hasEmployee 
      ? localTypes 
      : [...localTypes, { value: 'employee', label: 'employee' }] // システム用に追加
    
    onEmploymentTypesChange(typesToSave)
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
              {localTypes
                .filter(type => !isUnremovable(type)) // employeeは非表示
                .map((type, index) => {
                  // 非表示フィルタ後のインデックスに変換
                  const originalIndex = localTypes.findIndex(t => t.value === type.value && t.label === type.label)
                  return (
                    <div key={originalIndex} className="flex items-center gap-4 p-3 border rounded-lg">
                      {editingIndex === originalIndex ? (
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
                            <Button size="sm" variant="outline" onClick={() => handleEditType(originalIndex)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {!isUnremovable(type) && (
                              <Button size="sm" variant="outline" onClick={() => handleRemoveType(originalIndex)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
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
