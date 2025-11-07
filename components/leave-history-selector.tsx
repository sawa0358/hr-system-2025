"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, ImageIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface LeaveHistorySelectorProps {
  employeeId: string
  employeeName?: string
}

interface Snapshot {
  id: string
  snapshotDate: string
  grantYear: number
  grantDate: string
  totalGranted: number
  used: number
  pending: number
  remaining: number
  imageUrl?: string | null
  pdfUrl?: string | null
  fileFormat: string
}

export function LeaveHistorySelector({ employeeId, employeeName }: LeaveHistorySelectorProps) {
  const { currentUser } = useAuth()
  const isAdminOrHR = currentUser?.role === "admin" || currentUser?.role === "hr"

  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  // 履歴一覧を取得
  useEffect(() => {
    if (!isAdminOrHR || !employeeId || !currentUser?.id) return

    const fetchHistory = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/vacation/history/${employeeId}`, {
          headers: {
            "x-employee-id": currentUser.id,
          },
          credentials: "include",
        })
        if (res.ok) {
          const json = await res.json()
          setYears(json.years || [])
          setSnapshots(json.snapshots || [])
          
          // 最新の年度を選択
          if (json.years && json.years.length > 0) {
            setSelectedYear(String(json.years[0]))
          }
        } else if (res.status === 401 || res.status === 403) {
          console.error("履歴取得エラー: 認証または権限がありません", await res.text())
        }
      } catch (error) {
        console.error("履歴取得エラー:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [isAdminOrHR, employeeId, currentUser?.id])

  // 選択した年度のスナップショットをフィルタリング
  const filteredSnapshots = selectedYear
    ? snapshots.filter((s) => s.grantYear === parseInt(selectedYear, 10))
    : []

  // ダウンロード処理
  const handleDownload = async (snapshotId: string, format: "png" | "pdf") => {
    setDownloading(`${snapshotId}-${format}`)
    try {
      const res = await fetch(`/api/vacation/history/${snapshotId}/download?format=${format}`, {
        headers: currentUser?.id
          ? {
              "x-employee-id": currentUser.id,
            }
          : undefined,
        credentials: "include",
      })
      if (res.ok) {
        const json = await res.json()
        if (json.downloadUrl) {
          // ダウンロードURLを開く
          window.open(json.downloadUrl, "_blank")
        }
      } else {
        alert("ダウンロードに失敗しました")
      }
    } catch (error) {
      console.error("ダウンロードエラー:", error)
      alert("ダウンロードに失敗しました")
    } finally {
      setDownloading(null)
    }
  }

  // 年度のラベルを生成（昨年・一昨年・3年前...）
  const getYearLabel = (year: number) => {
    const currentYear = new Date().getFullYear()
    const diff = currentYear - year

    if (diff === 0) return "今年"
    if (diff === 1) return "昨年"
    if (diff === 2) return "一昨年"
    return `${diff}年前`
  }

  // 総務・管理者のみ表示
  if (!isAdminOrHR) {
    return null
  }

  // 選択した年度の最初のスナップショットを取得（最新のもの）
  const selectedSnapshot = filteredSnapshots.length > 0 
    ? filteredSnapshots[0] // 最新のスナップショット
    : null

  // ダウンロード可能かどうか
  const canDownload = selectedSnapshot && (selectedSnapshot.imageUrl || selectedSnapshot.pdfUrl)

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={selectedYear} 
        onValueChange={setSelectedYear}
        disabled={loading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={loading ? "読み込み中..." : years.length === 0 ? "過去記録なし" : "過去記録"} />
        </SelectTrigger>
        <SelectContent>
          {years.length > 0 ? (
            years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}年 ({getYearLabel(year)})
              </SelectItem>
            ))
          ) : (
            <SelectItem value="__no-data" disabled>
              過去記録はありません
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {/* DLアイコン */}
      {canDownload && (
        <div className="flex gap-1">
          {selectedSnapshot.imageUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(selectedSnapshot.id, "png")}
              disabled={downloading === `${selectedSnapshot.id}-png`}
              title="PNG画像をダウンロード"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          )}
          {selectedSnapshot.pdfUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(selectedSnapshot.id, "pdf")}
              disabled={downloading === `${selectedSnapshot.id}-pdf`}
              title="PDFをダウンロード"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

