"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { LayoutGrid, Trash2 } from "lucide-react"

interface Board {
  id?: string
  name: string
  description?: string
  workspaceId: string
}

interface BoardManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  board?: Board | null
  workspaceId: string
  onSave: (data: { name: string; description: string; workspaceId: string }) => void
  onDelete?: () => void
  canDelete?: boolean
}

export function BoardManagerDialog({
  open,
  onOpenChange,
  board,
  workspaceId,
  onSave,
  onDelete,
  canDelete = false,
}: BoardManagerDialogProps) {
  const [name, setName] = useState(board?.name || "")
  const [description, setDescription] = useState(board?.description || "")

  // boardプロップが変更されたときに状態を更新
  useEffect(() => {
    setName(board?.name || "")
    setDescription(board?.description || "")
  }, [board])

  const handleReset = () => {
    setName(board?.name || "")
    setDescription(board?.description || "")
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert("ボード名を入力してください")
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      workspaceId,
    })

    onOpenChange(false)
    handleReset()
  }

  const handleClose = () => {
    onOpenChange(false)
    handleReset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            {board?.id ? `ボードを編集: "${board.name}"` : "新しいボードを作成"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              {board?.id ? "新しいボード名 *" : "ボード名 *"}
              {board?.id && (
                <span className="text-xs text-slate-500 ml-2">
                  (現在: "{board.name}")
                </span>
              )}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: プロジェクトA"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              説明
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ボードの説明を入力..."
              rows={4}
              className="mt-1"
            />
          </div>

          {board?.id && canDelete && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={onDelete}
                className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                ボードを削除
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {board?.id ? "保存" : "作成"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

