"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X } from "lucide-react"

interface PositionManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  positions: string[]
  onPositionsChange: (positions: string[]) => void
}

export function PositionManagerDialog({
  open,
  onOpenChange,
  positions,
  onPositionsChange,
}: PositionManagerDialogProps) {
  const [localPositions, setLocalPositions] = useState<string[]>(positions)
  const [newPosition, setNewPosition] = useState("")

  // ダイアログが開かれたときに positions を同期
  useEffect(() => {
    if (open) {
      setLocalPositions(positions)
      setNewPosition("")
    }
  }, [open, positions])

  const handleAddPosition = () => {
    if (newPosition.trim() && !localPositions.includes(newPosition.trim())) {
      setLocalPositions([...localPositions, newPosition.trim()])
      setNewPosition("")
    }
  }

  const handleRemovePosition = (pos: string) => {
    setLocalPositions(localPositions.filter((p) => p !== pos))
  }

  const handleSave = () => {
    onPositionsChange(localPositions)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>役職管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>新しい役職を追加</Label>
            <div className="flex gap-2">
              <Input
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder="役職名を入力"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPosition()
                  }
                }}
              />
              <Button onClick={handleAddPosition} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>登録済み役職</Label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {localPositions.map((pos, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm">{pos}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePosition(pos)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {localPositions.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  登録済みの役職はありません
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
