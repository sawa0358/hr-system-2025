"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Briefcase, Edit, Trash2, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Workspace {
  id: string
  name: string
  description?: string
  createdBy?: string
  _count?: {
    boards: number
    members: number
  }
}

interface WorkspaceSelectorProps {
  workspaces: Workspace[]
  currentWorkspace: string | null
  currentUserId?: string // 現在のユーザーID（マイワークスペース判定用）
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
  currentUserId,
  onWorkspaceChange,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  canCreateWorkspace = false,
  canEditWorkspace = false,
  canDeleteWorkspace = false,
}: WorkspaceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

  // 検索クエリのデバウンス
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // ワークスペースのフィルタリング
  const filteredWorkspaces = useMemo(() => {
    if (!showSearch || !debouncedSearchQuery) {
      // 検索モードでない場合は通常のフィルタリング
      if (currentUserId) {
        return workspaces.filter(workspace => {
          // マイワークスペースの判定
          const isMyWorkspace = workspace.name === `${workspaces.find(w => w.createdBy === currentUserId)?.name || 'ユーザー'}のマイワークスペース`
          const isOthersMyWorkspace = workspace.name.includes('のマイワークスペース') && workspace.createdBy !== currentUserId
          
          // 他人のマイワークスペースは非表示（検索時のみ表示）
          if (isOthersMyWorkspace) return false
          
          // 通常のワークスペース（自分がメンバーの場合）は表示
          return true
        })
      }
      return workspaces
    }
    
    // 検索時は全ワークスペースから検索（部分一致）
    const query = debouncedSearchQuery.toLowerCase()
    return workspaces.filter(workspace => 
      workspace.name.toLowerCase().includes(query) ||
      workspace.description?.toLowerCase().includes(query)
    )
  }, [workspaces, debouncedSearchQuery, showSearch, currentUserId])

  const currentWorkspaceData = workspaces.find(w => w.id === currentWorkspace)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
          1
        </div>
        <Select value={currentWorkspace || undefined} onValueChange={onWorkspaceChange}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="ワークスペースを選んでください" />
          </SelectTrigger>
                  <SelectContent>
                    {showSearch && (
                      <div className="px-2 pb-2 sticky top-0 bg-white z-10">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                          <Input
                            placeholder="ワークスペースを検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 text-sm"
                            autoFocus
                          />
                        </div>
                      </div>
                    )}
                    {!showSearch && (
                      <div className="px-2 pb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSearch(true)}
                          className="w-full justify-start text-slate-600 hover:text-slate-900"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          ワークスペースを検索
                        </Button>
                      </div>
                    )}
                    {showSearch && (
                      <div className="px-2 pb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowSearch(false)
                            setSearchQuery("")
                          }}
                          className="w-full justify-start text-slate-600 hover:text-slate-900"
                        >
                          <Briefcase className="w-4 h-4 mr-2" />
                          通常表示に戻る
                        </Button>
                      </div>
                    )}
                    {filteredWorkspaces.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-slate-500">
                        該当するワークスペースが見つかりません
                      </div>
                    ) : (
                      filteredWorkspaces.map((workspace) => (
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
                      ))
                    )}
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
    </div>
  )
}