"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"

interface DepartmentManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: string[]
  onDepartmentsChange: (departments: string[]) => void
}

export function DepartmentManagerDialog({
  open,
  onOpenChange,
  departments,
  onDepartmentsChange,
}: DepartmentManagerDialogProps) {
  const [localDepartments, setLocalDepartments] = useState<string[]>(departments)
  const [newDepartment, setNewDepartment] = useState("")

  const handleAddDepartment = () => {
    if (newDepartment.trim() && !localDepartments.includes(newDepartment.trim())) {
      setLocalDepartments([...localDepartments, newDepartment.trim()])
      setNewDepartment("")
    }
  }

  const handleRemoveDepartment = (dept: string) => {
    setLocalDepartments(localDepartments.filter((d) => d !== dept))
  }

  const handleSave = () => {
    onDepartmentsChange(localDepartments)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>部署管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>新しい部署を追加</Label>
            <div className="flex gap-2">
              <Input
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="部署名を入力"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddDepartment()
                  }
                }}
              />
              <Button onClick={handleAddDepartment} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                追加
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>登録済み部署</Label>
            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {localDepartments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">部署が登録されていません</p>
              ) : (
                localDepartments.map((dept) => (
                  <div key={dept} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm">{dept}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveDepartment(dept)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
