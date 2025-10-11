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
import { Plus, Briefcase } from "lucide-react"

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
  canCreateWorkspace?: boolean
}

export function WorkspaceSelector({
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
  onCreateWorkspace,
  canCreateWorkspace = false,
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
    </div>
  )
}

