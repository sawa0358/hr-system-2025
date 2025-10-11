"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Archive, Search, X, ArrowLeft } from "lucide-react"
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

interface ArchiveLargeViewProps {
  boardId: string
  currentUserId?: string
  currentUserRole?: string
  onRefresh: () => void
  onBack?: () => void
}

export function ArchiveLargeView({ boardId, currentUserId, currentUserRole, onRefresh, onBack }: ArchiveLargeViewProps) {
  const [archivedCards, setArchivedCards] = useState<ArchiveCard[]>([])
  const [selectedCard, setSelectedCard] = useState<ArchiveCard | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [filteredCards, setFilteredCards] = useState<ArchiveCard[]>([])

  useEffect(() => {
    fetchArchivedCards()
  }, [boardId])

  useEffect(() => {
    applyDateFilter()
  }, [archivedCards, dateFrom, dateTo])

  const fetchArchivedCards = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/boards/${boardId}`, {
        headers: {
          'x-employee-id': currentUserId || '',
        },
      })

      if (!response.ok) {
        throw new Error('ボードデータの取得に失敗しました')
      }

      const data = await response.json()
      
      // すべてのリストからアーカイブされたカードを収集
      const archivedCards: ArchiveCard[] = []
      if (data.board?.lists) {
        data.board.lists.forEach((list: any) => {
          if (list.cards) {
            list.cards.forEach((card: any) => {
              if (card.isArchived) {
                archivedCards.push({
                  id: card.id,
                  title: card.title,
                  description: card.description,
                  dueDate: card.dueDate,
                  priority: card.priority,
                  cardColor: card.cardColor,
                  labels: card.labels,
                  members: card.members,
                  checklists: card.checklists,
                  isArchived: card.isArchived,
                  createdAt: card.createdAt,
                  updatedAt: card.updatedAt,
                  boardId: data.board.id,
                  creator: card.creator,
                })
              }
            })
          }
        })
      }
      
      setArchivedCards(archivedCards)
    } catch (error) {
      console.error('Error fetching archived cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyDateFilter = () => {
    if (!dateFrom && !dateTo) {
      setFilteredCards(archivedCards)
      return
    }

    const filtered = archivedCards.filter(card => {
      if (!card.dueDate) return false
      
      const cardDate = new Date(card.dueDate)
      const fromDate = dateFrom ? new Date(dateFrom.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : null
      const toDate = dateTo ? new Date(dateTo.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) : null
      
      if (fromDate && cardDate < fromDate) return false
      if (toDate && cardDate > toDate) return false
      
      return true
    })

    setFilteredCards(filtered)
  }

  const handleSearch = () => {
    applyDateFilter()
  }

  const handleReset = () => {
    setDateFrom("")
    setDateTo("")
    setFilteredCards(archivedCards)
  }

  const handleCardClick = (card: ArchiveCard) => {
    setSelectedCard(card)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedCard(null)
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

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Archive className="w-12 h-12 mx-auto mb-4 animate-pulse" />
        <p>アーカイブカードを読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          )}
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Archive className="w-6 h-6" />
            アーカイブカード一覧
          </h1>
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredCards.length}件
        </Badge>
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

      {/* アーカイブカード一覧 */}
      {archivedCards.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Archive className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium mb-2">アーカイブされたカードがありません</p>
          <p className="text-sm">カードをアーカイブするとここに表示されます</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium mb-2">指定した日付範囲に該当するカードがありません</p>
          <p className="text-sm">日付範囲を変更するか、フィルターをクリアしてください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((card) => (
            <Card
              key={card.id}
              className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer border-gray-300 opacity-70"
              style={{ backgroundColor: "#f3f4f6" }}
              onClick={() => handleCardClick(card)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 text-sm leading-relaxed flex-1 mr-2">
                    {card.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      アーカイブ
                    </Badge>
                    <Badge variant="secondary" className={`text-xs ${getPriorityColor(card.priority)}`}>
                      {getPriorityLabel(card.priority)}
                    </Badge>
                  </div>
                </div>

                {card.description && (
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">{card.description}</p>
                )}

                {card.labels && card.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {card.labels.map((label) => (
                      <Badge key={label.id} style={{ backgroundColor: label.color }} className="text-white text-xs">
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  {card.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(parseISO(card.dueDate), "yyyy/MM/dd")}</span>
                    </div>
                  )}
                  {card.members && card.members.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span>{card.members[0]?.employee?.name || card.members[0]?.name}</span>
                      {card.members.length > 1 && <span>+{card.members.length - 1}</span>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* タスク詳細ダイアログ */}
      {selectedCard && (
        <TaskDetailDialog
          task={selectedCard}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}
