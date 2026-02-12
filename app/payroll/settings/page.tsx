"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

type SettingRow = {
  employeeId: string
  name: string
  employeeNumber: string
  department: string
  chatworkRoomId: string
  defaultMessage: string
}

export default function PayrollChatworkSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentUser } = useAuth()
  const [list, setList] = useState<SettingRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const isAdminOrHR = currentUser?.role === "admin" || currentUser?.role === "hr"

  useEffect(() => {
    if (!currentUser?.id || !isAdminOrHR) {
      setIsLoading(false)
      return
    }
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/payroll/chatwork-settings", {
          headers: { "x-employee-id": currentUser.id },
        })
        if (res.ok) {
          const data = await res.json()
          setList(data)
        } else {
          toast({ title: "エラー", description: "設定の取得に失敗しました", variant: "destructive" })
        }
      } catch (e) {
        console.error(e)
        toast({ title: "エラー", description: "設定の取得に失敗しました", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [currentUser?.id, isAdminOrHR, toast])

  const updateRow = (employeeId: string, field: "chatworkRoomId" | "defaultMessage", value: string) => {
    setList((prev) =>
      prev.map((row) =>
        row.employeeId === employeeId ? { ...row, [field]: value } : row
      )
    )
  }

  const handleSave = async () => {
    if (!currentUser?.id) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/payroll/chatwork-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-employee-id": currentUser.id,
        },
        body: JSON.stringify({
          settings: list.map((row) => ({
            employeeId: row.employeeId,
            chatworkRoomId: row.chatworkRoomId.trim(),
            defaultMessage: row.defaultMessage.trim() || undefined,
          })),
        }),
      })
      if (res.ok) {
        toast({ title: "保存しました", description: "Chatwork送信先設定を更新しました" })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({
          title: "保存に失敗しました",
          description: data.error || "設定の保存に失敗しました",
          variant: "destructive",
        })
      }
    } catch (e) {
      console.error(e)
      toast({ title: "エラー", description: "設定の保存に失敗しました", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredList = searchQuery.trim()
    ? list.filter((row) => {
        const q = searchQuery.toLowerCase()
        return (
          row.name.toLowerCase().includes(q) ||
          (row.employeeNumber || "").toLowerCase().includes(q) ||
          (row.department || "").toLowerCase().includes(q)
        )
      })
    : list

  if (!isAdminOrHR) {
    return (
      <main className="overflow-y-auto">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">アクセス権限がありません</h2>
            <p className="text-muted-foreground">このページは総務・管理者のみアクセス可能です。</p>
            <Button className="mt-4" onClick={() => router.push("/payroll")}>
              給与or請求管理に戻る
            </Button>
          </div>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="overflow-y-auto">
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">設定を読み込み中...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="overflow-y-auto">
      <div className="p-8 space-y-6" style={{ backgroundColor: "#e8dcbe" }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-slate-900">給与or請求管理 - Chatwork送信先設定</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/payroll")} disabled={isSaving}>
              給与or請求管理に戻る
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </div>

        <p className="text-slate-600">
          社員ごとにChatworkのルームIDを登録してください。給与・請求ファイルアップロード時に、該当社員のルームへ説明文とファイルを送信できます。
        </p>

        <div className="space-y-2">
          <Label>検索（社員名・社員番号・部署）</Label>
          <Input
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="rounded-md border bg-white overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">社員番号</th>
                  <th className="text-left p-2 font-medium">氏名</th>
                  <th className="text-left p-2 font-medium">部署</th>
                  <th className="text-left p-2 font-medium">ChatworkルームID</th>
                  <th className="text-left p-2 font-medium">定型文（任意）</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.employeeId} className="border-t hover:bg-slate-50">
                    <td className="p-2 font-mono text-xs">{row.employeeNumber}</td>
                    <td className="p-2">{row.name}</td>
                    <td className="p-2">{row.department}</td>
                    <td className="p-2">
                      <Input
                        placeholder="例: 123456789"
                        value={row.chatworkRoomId}
                        onChange={(e) => updateRow(row.employeeId, "chatworkRoomId", e.target.value)}
                        className="min-w-[120px]"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        placeholder="送信時の説明文"
                        value={row.defaultMessage}
                        onChange={(e) => updateRow(row.employeeId, "defaultMessage", e.target.value)}
                        className="min-w-[200px]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredList.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              {list.length === 0 ? "社員データがありません" : "検索条件に一致する社員がいません"}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
