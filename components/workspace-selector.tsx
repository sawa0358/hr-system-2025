"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Briefcase, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Workspace {
  id: string
  name: string
  description?: string
  _count?: {
    boards: number
    members: number
  }
}

interface WorkspaceSelectorProps {
  workspaces: Workspace[]
  currentWorkspace: string | null
  onWorkspaceChange: (workspaceId: string) => void
  onCreateWorkspace?: () => void
  onEditWorkspace?: () => void
  onDeleteWorkspace?: () => void
  canCreateWorkspace?: boolean
  canEditWorkspace?: boolean
  canDeleteWorkspace?: boolean
}

export function WorkspaceSelector({
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  canCreateWorkspace = false,
  canEditWorkspace = false,
  canDeleteWorkspace = false,
}: WorkspaceSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Briefcase className="w-5 h-5 text-slate-600" />
      <Select value={currentWorkspace || undefined} onValueChange={onWorkspaceChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="ワークスペースを選択" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{workspace.name}</span>
                {workspace._count && (
                  <span className="text-xs text-slate-500">
                    {workspace._count.boards}ボード • {workspace._count.members}メンバー
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canCreateWorkspace && onCreateWorkspace && (
        <Button variant="outline" size="sm" onClick={onCreateWorkspace}>
          <Plus className="w-4 h-4 mr-1" />
          新規作成
        </Button>
      )}
      {(canEditWorkspace || canDeleteWorkspace) && currentWorkspace && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
            >
              <Edit className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEditWorkspace && onEditWorkspace && (
              <DropdownMenuItem onClick={onEditWorkspace}>
                <Edit className="w-4 h-4 mr-2" />
                編集
              </DropdownMenuItem>
            )}
            {canDeleteWorkspace && onDeleteWorkspace && (
              <DropdownMenuItem 
                onClick={onDeleteWorkspace}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                削除
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

