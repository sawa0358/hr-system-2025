"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Archive, ArrowLeft, Search, X } from "lucide-react"
import { format, parseISO } from "date-fns"
import { TaskDetailDialog } from "./task-detail-dialog"

interface ArchiveCard {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: string
  cardColor?: string
  labels?: any[]
  members?: any[]
  checklists?: any[]
  isArchived: boolean
  createdAt: string
  updatedAt: string
  boardId: string
  creator?: {
    id: string
    name: string
    email: string
  }
}

interface ArchiveList {
  id: string
  title: string
  createdAt: string
  cards: ArchiveCard[]
}

interface ArchiveBoardProps {
  boardId: string
  currentUserId?: string
  currentUserRole?: string
  onClose: () => void
  onRefresh?: () => void
}

export function ArchiveBoard({ boardId, currentUserId, currentUserRole, onClose, onRefresh }: ArchiveBoardProps) {
  const [archiveLists, setArchiveLists] = useState<ArchiveList[]>([])
  const [selectedCard, setSelectedCard] = useState<ArchiveCard | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [filteredLists, setFilteredLists] = useState<ArchiveList[]>([])

  useEffect(() => {
    fetchArchiveLists()
  }, [boardId])

  useEffect(() => {
    applyDateFilter()
  }, [archiveLists, dateFrom, dateTo])

  const fetchArchiveLists = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/boards/${boardId}/archive-lists`, {
        headers: {
          'x-employee-id': currentUserId || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setArchiveLists(data.archiveLists)
      } else {
        console.error('Failed to fetch archive lists')
      }
    } catch (error) {
      console.error('Error fetching archive lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyDateFilter = () => {
    if (!dateFrom && !dateTo) {
      setFilteredLists(archiveLists)
      return
    }

    const filtered = archiveLists.map(list => ({
      ...list,
      cards: list.cards.filter(card => {
        if (!card.dueDate) return false
        
        const cardDate = new Date(card.dueDate)
        const fromDate = dateFrom ? new Date(dateFrom.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : null
        const toDate = dateTo ? new Date(dateTo.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : null
        
        if (fromDate && cardDate < fromDate) return false
        if (toDate && cardDate > toDate) return false
        
        return true
      })
    })).filter(list => list.cards.length > 0)

    setFilteredLists(filtered)
  }

  const handleSearch = () => {
    applyDateFilter()
  }

  const handleReset = () => {
    setDateFrom("")
    setDateTo("")
    setFilteredLists(archiveLists)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200"
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "low":
        return "bg-green-50 text-green-700 border-green-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "高"
      case "medium":
        return "中"
      case "low":
        return "低"
      default:
        return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
    }
  }

  const handleCardClick = (card: ArchiveCard) => {
    // boardIdを設定してからダイアログを開く
    const cardWithBoardId = { ...card, boardId }
    setSelectedCard(cardWithBoardId)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedCard(null)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-slate-500">アーカイブリストを読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Archive className="w-6 h-6" />
            アーカイブカード
          </h1>
        </div>
      </div>

      {/* 日付フィルター */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-sm mb-2 block">締切日範囲</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="yyyymmdd"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 text-sm"
                maxLength={8}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <span className="text-slate-500">〜</span>
              <Input
                placeholder="yyyymmdd"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 text-sm"
                maxLength={8}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-3.5 h-3.5 mr-1.5" />
              検索
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X className="w-3.5 h-3.5 mr-1.5" />
              クリア
            </Button>
          </div>
        </div>
      </div>

      {/* アーカイブリスト一覧 */}
      {archiveLists.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Archive className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium mb-2">アーカイブされたカードがありません</p>
          <p className="text-sm">カードをアーカイブすると、ここに表示されます</p>
        </div>
      ) : filteredLists.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium mb-2">指定した日付範囲に該当するカードがありません</p>
          <p className="text-sm">日付範囲を変更するか、フィルターをクリアしてください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLists.map((list) => (
            <div key={list.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">{list.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {list.cards.length}件
                </Badge>
              </div>

              {/* カード一覧（最大20個表示） */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {list.cards.slice(0, 20).map((card) => (
                  <Card
                    key={card.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-slate-200"
                    style={{ 
                      backgroundColor: card.cardColor && card.cardColor !== "" ? card.cardColor : "white"
                    }}
                    onClick={() => handleCardClick(card)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-slate-900 line-clamp-2">
                          {card.title}
                        </h4>
                        
                        {card.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {card.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getPriorityColor(card.priority)}`}
                          >
                            {getPriorityLabel(card.priority)}
                          </Badge>
                          
                          {card.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Calendar className="w-3 h-3" />
                              <span>{format(parseISO(card.dueDate), "MM/dd")}</span>
                            </div>
                          )}
                        </div>

                        {card.members && card.members.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-500">
                              {card.members[0].employee?.name || card.members[0].name}
                              {card.members.length > 1 && ` +${card.members.length - 1}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {list.cards.length > 20 && (
                  <div className="text-center text-xs text-slate-500 py-2">
                    他 {list.cards.length - 20} 件のカードがあります
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* カード詳細ダイアログ */}
      {selectedCard && (
        <TaskDetailDialog
          task={selectedCard}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onRefresh={fetchArchiveLists}
          onTaskUpdate={fetchArchiveLists}
        />
      )}
    </div>
  )
}
