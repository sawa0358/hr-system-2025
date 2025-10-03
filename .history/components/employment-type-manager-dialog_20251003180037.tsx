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
  const [newTypeValue, setNewTypeValue] = useState("")
  const [newTypeLabel, setNewTypeLabel] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [editLabel, setEditLabel] = useState("")

  const handleAddType = () => {
    if (newTypeValue.trim() && newTypeLabel.trim()) {
      // Prismaスキーマで定義されている値のみ許可
      const validValues = ["employee", "contractor"]
      if (!validValues.includes(newTypeValue.trim())) {
        alert("有効な雇用形態の値は 'employee' または 'contractor' のみです")
        return
      }
      
      const newType: EmploymentType = {
        value: newTypeValue.trim(),
        label: newTypeLabel.trim()
      }
      setLocalTypes([...localTypes, newType])
      setNewTypeValue("")
      setNewTypeLabel("")
    }
  }

  const handleEditType = (index: number) => {
    const type = localTypes[index]
    setEditingIndex(index)
    setEditValue(type.value)
    setEditLabel(type.label)
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim() && editLabel.trim()) {
      // Prismaスキーマで定義されている値のみ許可
      const validValues = ["employee", "contractor"]
      if (!validValues.includes(editValue.trim())) {
        alert("有効な雇用形態の値は 'employee' または 'contractor' のみです")
        return
      }
      
      const updatedTypes = [...localTypes]
      updatedTypes[editingIndex] = {
        value: editValue.trim(),
        label: editLabel.trim()
      }
      setLocalTypes(updatedTypes)
      setEditingIndex(null)
      setEditValue("")
      setEditLabel("")
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue("")
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>値</Label>
                <Input
                  value={newTypeValue}
                  onChange={(e) => setNewTypeValue(e.target.value)}
                  placeholder="employee または contractor"
                />
              </div>
              <div className="space-y-2">
                <Label>表示名</Label>
                <Input
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  placeholder="正社員, 契約社員, etc."
                />
              </div>
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
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="値"
                        />
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="表示名"
                        />
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
