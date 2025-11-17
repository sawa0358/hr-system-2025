'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarNav } from '@/components/workclock/sidebar-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getWorkers, addWorker, updateWorker, deleteWorker, getTeams, saveTeams, addTeam, NewWorkerPayload } from '@/lib/workclock/api-storage'
import { Worker } from '@/lib/workclock/types'
import { Plus, Pencil, Trash2, Tags, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/workclock/multi-select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { PasswordVerificationDialog } from '@/components/password-verification-dialog'
import { getWagePatternLabels, saveWagePatternLabels } from '@/lib/workclock/wage-patterns'
import { getWorkerBillingMeta, saveWorkerBillingMeta } from '@/lib/workclock/worker-billing-meta'

// getCurrentUserIdをエクスポートする必要があるので、直接実装
function getCurrentUserId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let savedUser = localStorage.getItem('currentUser')
    if (!savedUser) {
      savedUser = sessionStorage.getItem('currentUser')
    }
    if (savedUser) {
      const user = JSON.parse(savedUser)
      if (user.id && typeof user.id === 'string' && user.id.length > 0) {
        return user.id
      }
    }
  } catch (error) {
    console.error('WorkClock: ユーザー情報のパースエラー', error)
  }
  return ''
}

export default function SettingsPage() {
  const { currentUser } = useAuth()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  // ワーカー編集全体のロック（既存ワーカーは初期ロック、新規はアンロック）
  const [isWorkerEditUnlocked, setIsWorkerEditUnlocked] = useState(false)
  const [isWorkerPasswordDialogOpen, setIsWorkerPasswordDialogOpen] = useState(false)
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [wageLabels, setWageLabels] = useState(getWagePatternLabels())
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    password: '',
    companyName: '',
    qualifiedInvoiceNumber: '',
    chatworkId: '',
    email: '',
    phone: '',
    address: '',
    // Aパターンを既存のhourlyRateとみなす（DB/API連携は従来通りhourlyRateのみ）
    hourlyRate: '',
    // 追加の時給パターン（UI専用・現時点ではDB未連携）
    hourlyRatePatternB: '',
    hourlyRatePatternC: '',
    // 月額固定（UI専用・現時点ではDB未連携）
    monthlyFixedAmount: '',
    teams: [] as string[],
    role: 'worker' as 'admin' | 'worker',
    notes: '',
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (currentUser?.id) {
      loadWorkers()
    }
    // チーム一覧を初期化（localStorageから取得、なければデフォルト値）
    const initialTeams = getTeams()
    if (initialTeams.length === 0) {
      // デフォルトチームを設定
      const defaultTeams = ['チームA', 'チームB', 'チームC']
      saveTeams(defaultTeams)
      setTeams(defaultTeams)
    } else {
      setTeams(initialTeams)
    }
    // 初回ロードで社員一覧も取得
    ;(async () => {
      try {
        setIsLoadingEmployees(true)
        const res = await fetch('/api/employees')
        const data = await res.json()
        setEmployees(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('社員一覧の取得に失敗', e)
      } finally {
        setIsLoadingEmployees(false)
      }
    })()
  }, [currentUser])

  const loadWorkers = async () => {
    try {
      // currentUserからIDを取得（useAuthフックを使用）
      const userId = currentUser?.id || getCurrentUserId()
      if (!userId) {
        console.error('WorkClock: ユーザーIDが取得できません')
        toast({
          title: 'エラー',
          description: '認証が必要です。ログインしてください。',
          variant: 'destructive',
        })
        return
      }
      
      const loadedWorkers = await getWorkers(userId)
      setWorkers(loadedWorkers)
    } catch (error) {
      console.error('Workers取得エラー:', error)
      toast({
        title: 'エラー',
        description: 'ワーカー一覧の取得に失敗しました',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      name: '',
      password: '',
      companyName: '',
      qualifiedInvoiceNumber: '',
      chatworkId: '',
      email: '',
      phone: '',
      address: '',
      hourlyRate: '',
      hourlyRatePatternB: '',
      hourlyRatePatternC: '',
      monthlyFixedAmount: '',
      teams: [],
      role: 'worker',
      notes: '',
    })
    setEditingWorker(null)
    setIsWorkerEditUnlocked(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const userId = currentUser?.id
      if (!userId) {
        throw new Error('認証が必要です。ログインしてください。')
      }

      if (editingWorker) {
        // 特定フィールドの変更確認
        const changedCompanyName =
          (editingWorker.companyName || '') !== (formData.companyName || '')
        const changedAddress = (editingWorker.address || '') !== (formData.address || '')
        const changedNotes = (editingWorker.notes || '') !== (formData.notes || '')

        if (changedCompanyName || changedAddress || changedNotes) {
          const confirmed = window.confirm(
            '屋号・会社名 / 住所 / 備考欄のいずれかが変更されています。本当に変更しますか？'
          )
          if (!confirmed) {
            return
          }
        }

        await updateWorker(
          editingWorker.id,
          {
            name: formData.name,
            password: formData.password || undefined,
            companyName: formData.companyName || undefined,
            qualifiedInvoiceNumber: formData.qualifiedInvoiceNumber || undefined,
            chatworkId: formData.chatworkId || undefined,
            email: formData.email,
            phone: formData.phone || undefined,
            address: formData.address || undefined,
            hourlyRate: Number(formData.hourlyRate),
            // 追加の時給パターン金額をDBに保存
            hourlyRateB:
              formData.hourlyRatePatternB !== ''
                ? Number(formData.hourlyRatePatternB)
                : undefined,
            hourlyRateC:
              formData.hourlyRatePatternC !== ''
                ? Number(formData.hourlyRatePatternC)
                : undefined,
            // 月額固定金額をDBに保存（0 または空なら未設定）
            monthlyFixedAmount:
              formData.monthlyFixedAmount !== ''
                ? Number(formData.monthlyFixedAmount)
                : null,
            monthlyFixedEnabled:
              formData.monthlyFixedAmount !== '' &&
              Number(formData.monthlyFixedAmount) > 0,
            teams: formData.teams,
            role: formData.role as 'worker' | 'admin',
            notes: formData.notes || undefined,
          },
          userId
        )
        // 月額固定のUI用メタ情報を保存（localStorage）
        const employeeIdForMeta = formData.employeeId || editingWorker.employeeId || ''
        if (employeeIdForMeta) {
          const amount = Number(formData.monthlyFixedAmount || 0)
          saveWorkerBillingMeta(employeeIdForMeta, {
            monthlyFixedAmount: isNaN(amount) ? undefined : amount,
          })
        }
        await loadWorkers()
        toast({
          title: '更新完了',
          description: 'ワーカー情報を更新しました',
        })
      } else {
        if (!formData.employeeId) {
          throw new Error('社員を選択してください')
        }
        const payload: NewWorkerPayload = {
          employeeId: formData.employeeId,
          name: formData.name,
          password: formData.password || undefined,
          companyName: formData.companyName || undefined,
          qualifiedInvoiceNumber: formData.qualifiedInvoiceNumber || undefined,
          chatworkId: formData.chatworkId || undefined,
          email: formData.email,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          hourlyRate: Number(formData.hourlyRate),
          hourlyRateB:
            formData.hourlyRatePatternB !== ''
              ? Number(formData.hourlyRatePatternB)
              : undefined,
          hourlyRateC:
            formData.hourlyRatePatternC !== ''
              ? Number(formData.hourlyRatePatternC)
              : undefined,
          monthlyFixedAmount:
            formData.monthlyFixedAmount !== ''
              ? Number(formData.monthlyFixedAmount)
              : undefined,
          monthlyFixedEnabled:
            formData.monthlyFixedAmount !== '' &&
            Number(formData.monthlyFixedAmount) > 0,
          teams: formData.teams,
          role: formData.role as 'worker' | 'admin',
          notes: formData.notes || undefined,
        }
        await addWorker(payload, userId)
        // 新規ワーカーの場合も、employeeIdをキーに月額固定メタ情報を保存
        if (payload.employeeId) {
          const amount = Number(formData.monthlyFixedAmount || 0)
          saveWorkerBillingMeta(payload.employeeId, {
            monthlyFixedAmount: isNaN(amount) ? undefined : amount,
          })
        }
        await loadWorkers()
        toast({
          title: '登録完了',
          description: '新しいワーカーを登録しました',
        })
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('ワーカー保存エラー:', error)
      toast({
        title: 'エラー',
        description: error.message || 'ワーカーの保存に失敗しました',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = async (worker: Worker) => {
    setEditingWorker(worker)
    // 最新のチーム一覧を取得（チーム管理で追加されたチームを含む）
    setTeams(getTeams())
    // 社員のパスワードを取得（デフォルト値として）
    let employeePassword = worker.password || ''
    if (worker.employeeId) {
      try {
        const res = await fetch(`/api/employees/${worker.employeeId}`)
        if (res.ok) {
          const empData = await res.json()
          employeePassword = empData.password || worker.password || ''
        }
      } catch (e) {
        console.error('社員パスワードの取得に失敗', e)
      }
    }
    // DB優先でパターン名を取得（localStorage はフォールバック）
    const wageScopeKey = worker.employeeId || worker.id
    const baseLabels = getWagePatternLabels(wageScopeKey)
    const dbLabels = {
      A: worker.wagePatternLabelA || baseLabels.A,
      B: worker.wagePatternLabelB || baseLabels.B,
      C: worker.wagePatternLabelC || baseLabels.C,
    }
    setWageLabels(dbLabels)

    const meta = getWorkerBillingMeta(worker.employeeId)
    const monthlyFixed =
      worker.monthlyFixedAmount ??
      (typeof meta.monthlyFixedAmount === 'number' ? meta.monthlyFixedAmount : undefined)

    setFormData({
      name: worker.name,
      password: employeePassword, // ユーザー詳細のパスワードをデフォルトに
      companyName: worker.companyName || '',
      qualifiedInvoiceNumber: worker.qualifiedInvoiceNumber || '',
      chatworkId: worker.chatworkId || '',
      email: worker.email,
      phone: worker.phone || '',
      address: worker.address || '',
      hourlyRate: String(worker.hourlyRate),
      hourlyRatePatternB:
        typeof worker.hourlyRateB === 'number' ? String(worker.hourlyRateB) : '',
      hourlyRatePatternC:
        typeof worker.hourlyRateC === 'number' ? String(worker.hourlyRateC) : '',
      monthlyFixedAmount:
        typeof monthlyFixed === 'number' ? String(monthlyFixed) : '',
      teams: worker.teams || [],
      role: worker.role,
      notes: worker.notes || '',
      employeeId: worker.employeeId || '',
    })
    // 既存ワーカー編集時は、パスワード認証が通るまで編集をロック
    setIsWorkerEditUnlocked(false)
    setIsDialogOpen(true)
  }

  const handleDelete = async (workerId: string) => {
    if (confirm('このワーカーを削除してもよろしいですか？')) {
      try {
        await deleteWorker(workerId)
        await loadWorkers()
        toast({
          title: '削除完了',
          description: 'ワーカーを削除しました',
        })
      } catch (error: any) {
        console.error('ワーカー削除エラー:', error)
        toast({
          title: 'エラー',
          description: error.message || 'ワーカーの削除に失敗しました',
          variant: 'destructive',
        })
      }
    }
  }

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTeamName.trim()) {
      addTeam(newTeamName.trim())
      setTeams(getTeams()) // チーム管理と連動
      setNewTeamName('')
      setIsTeamDialogOpen(false)
      toast({
        title: 'チーム追加完了',
        description: `${newTeamName}を追加しました`,
      })
    }
  }

  const handleDeleteTeam = (teamName: string) => {
    if (confirm(`チーム「${teamName}」を削除してもよろしいですか？`)) {
      const updatedTeams = teams.filter(t => t !== teamName)
      saveTeams(updatedTeams)
      setTeams(getTeams()) // チーム管理と連動
      toast({
        title: 'チーム削除完了',
        description: `${teamName}を削除しました`,
      })
    }
  }

  // パスワード認証成功時のコールバック（ワーカー編集全体をアンロック）
  const handleWorkerEditVerified = () => {
    setIsWorkerEditUnlocked(true)
  }

  // 店長・総務・管理者の権限チェック（システムパスワード編集は従来通り）
  const canEditPassword = ['store_manager', 'hr', 'admin'].includes(currentUser?.role || '')
  // 報酬設定や権限（ワーカー/管理者）は総務・管理者のみ編集可能
  const canEditCompensation = ['hr', 'admin'].includes(currentUser?.role || '')
  const canEditCompValues = canEditCompensation && isWorkerEditUnlocked

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#bddcd9' }}>
      <SidebarNav workers={workers} currentRole="admin" />

      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#bddcd9' }}>
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">設定</h1>
              <p className="text-muted-foreground">
                ワーカーの登録・編集・削除を行います
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={isTeamDialogOpen} onOpenChange={(open) => {
                setIsTeamDialogOpen(open)
                if (!open) {
                  // ダイアログを閉じた際にチーム一覧を更新（チーム管理と連動）
                  setTeams(getTeams())
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Tags className="mr-2 h-4 w-4" />
                    チーム管理
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>チーム管理</DialogTitle>
                    <DialogDescription>
                      チームの追加・削除を行います
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <form onSubmit={handleAddTeam} className="flex gap-2">
                      <Input
                        placeholder="新しいチーム名"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                      />
                      <Button type="submit">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </form>
                    <div className="space-y-2">
                      <Label>登録済みチーム</Label>
                      <div className="flex flex-wrap gap-2">
                        {teams.map((team) => (
                          <Badge key={team} variant="secondary" className="text-sm">
                            {team}
                            <button
                              className="ml-2 rounded-full outline-none"
                              onClick={() => handleDeleteTeam(team)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (open) {
                  // ダイアログを開いた時に最新のチーム一覧を取得
                  setTeams(getTeams())
                } else {
                  resetForm()
                  setIsWorkerEditUnlocked(false)
                }
              }}>
                <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm()
                    // 新規ワーカー登録時は報酬設定の編集を最初から有効化
                    setIsWorkerEditUnlocked(true)
                  }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    新規ワーカー登録
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingWorker ? 'ワーカー編集' : '新規ワーカー登録'}
                      </DialogTitle>
                      <DialogDescription>
                        ワーカーの情報を入力してください
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {!editingWorker && (
                        <div className="grid gap-2">
                          <Label htmlFor="employee">社員を選択（業務委託/外注先）*</Label>
                          <Select
                            value={formData.employeeId || 'none'}
                            onValueChange={async (value) => {
                              if (value === 'none') {
                                setFormData({ ...formData, employeeId: '' })
                                return
                              }
                              const emp = employees.find((e) => e.id === value)
                              // 社員のパスワードを取得
                              let employeePassword = ''
                              if (emp?.id) {
                                try {
                                  const res = await fetch(`/api/employees/${emp.id}`)
                                  if (res.ok) {
                                    const empData = await res.json()
                                    employeePassword = empData.password || ''
                                  }
                                } catch (e) {
                                  console.error('社員パスワードの取得に失敗', e)
                                }
                              }
                              setFormData({
                                ...formData,
                                employeeId: value,
                                name: emp?.name || formData.name,
                                email: emp?.email || formData.email,
                                phone: emp?.phone || formData.phone,
                                address: emp?.address || formData.address,
                                password: employeePassword, // ユーザー詳細のパスワードをデフォルトに
                              })
                              setIsPasswordEditable(false) // パスワード編集をロック
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingEmployees ? '読み込み中...' : '社員を選択'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>選択してください</SelectItem>
                              {employees
                                .filter((e) => (e.employeeType || '').includes('業務委託') || (e.employeeType || '').includes('外注先'))
                                .filter((e) => !workers.find((w) => (w as any).employee?.id === e.id || (w as any).employeeId === e.id))
                                .map((e) => (
                                  <SelectItem key={e.id} value={e.id}>
                                    {e.name}（{e.employeeType || '種別未設定'}）
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-muted-foreground">
                            社員情報から氏名・メールを自動入力します
                          </div>
                        </div>
                      )}
                        <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">氏名 *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            required
                            readOnly={!!editingWorker}
                            className={editingWorker ? 'bg-muted text-muted-foreground' : ''}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password">システムパスワード *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            placeholder="ログイン用パスワード"
                            disabled={!isWorkerEditUnlocked || !canEditPassword}
                            className={!isWorkerEditUnlocked || !canEditPassword ? "text-[#374151] bg-[#edeaed]" : ""}
                          />
                          {canEditPassword && !isWorkerEditUnlocked && editingWorker && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                ワーカー編集を有効化すると、パスワードも編集できるようになります
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="companyName">屋号・会社名</Label>
                          <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) =>
                              setFormData({ ...formData, companyName: e.target.value })
                            }
                            disabled={!isWorkerEditUnlocked}
                          />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="qualifiedInvoiceNumber">適格証明番号</Label>
                        <Input
                          id="qualifiedInvoiceNumber"
                          value={formData.qualifiedInvoiceNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              qualifiedInvoiceNumber: e.target.value,
                            })
                          }
                          placeholder="T1234567890123"
                          disabled={!isWorkerEditUnlocked}
                        />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email">メールアドレス *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            disabled={!isWorkerEditUnlocked}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">電話番号</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="03-1234-5678"
                            disabled={!isWorkerEditUnlocked}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="chatworkId">チャットワークID</Label>
                        <Input
                          id="chatworkId"
                          value={formData.chatworkId}
                          onChange={(e) =>
                            setFormData({ ...formData, chatworkId: e.target.value })
                          }
                          placeholder="chatwork_username"
                          disabled={!isWorkerEditUnlocked}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="address">住所</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          placeholder="〒000-0000 東京都..."
                          disabled={!isWorkerEditUnlocked}
                        />
                      </div>

                      <Card className="border border-dashed bg-muted/40">
                        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-base">報酬設定</CardTitle>
                            <CardDescription className="text-xs">
                              時給パターン（A/B/C）と月額固定を設定できます。現時点ではAパターンのみが計算・保存に利用されます。
                            </CardDescription>
                          </div>
                          {canEditCompensation && editingWorker && (
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => setIsWorkerPasswordDialogOpen(true)}
                              className="mt-1"
                            >
                              編集を有効化
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-3">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              時給パターン
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <Input
                                    type="text"
                                    value={wageLabels.A}
                                    onChange={(e) => {
                                      const value = e.target.value || 'Aパターン'
                                      const next = { ...wageLabels, A: value }
                                      setWageLabels(next)
                                      const scopeKey =
                                        (editingWorker as any)?.employeeId ||
                                        editingWorker?.id ||
                                        formData.employeeId ||
                                        undefined
                                      saveWagePatternLabels(next, scopeKey)
                                    }}
                                    className="h-8 text-xs"
                                    disabled={!canEditCompValues}
                                  />
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    デフォルト
                                  </span>
                                </div>
                                <Input
                                  id="hourlyRate"
                                  type="number"
                                  min="0"
                                  value={formData.hourlyRate}
                                  onChange={(e) =>
                                    setFormData({ ...formData, hourlyRate: e.target.value })
                                  }
                                  placeholder="1,200"
                                  required
                                  disabled={!canEditCompValues}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                  従来の「時給（円）*」と同じ値です。現在の計算・PDF出力ではこの金額のみが使用されます。
                                </p>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <Input
                                    type="text"
                                    value={wageLabels.B}
                                    onChange={(e) => {
                                      const value = e.target.value || 'Bパターン'
                                      const next = { ...wageLabels, B: value }
                                      setWageLabels(next)
                                      const scopeKey =
                                        (editingWorker as any)?.employeeId ||
                                        editingWorker?.id ||
                                        formData.employeeId ||
                                        undefined
                                      saveWagePatternLabels(next, scopeKey)
                                    }}
                                    className="h-8 text-xs"
                                    disabled={!canEditCompValues}
                                  />
                                  <span className="text-[10px] text-muted-foreground">
                                    任意設定
                                  </span>
                                </div>
                                <Input
                                  id="hourlyRatePatternB"
                                  type="number"
                                  min="0"
                                  value={formData.hourlyRatePatternB}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      hourlyRatePatternB: e.target.value,
                                    })
                                  }
                                  placeholder="例: 1,500"
                                  disabled={!canEditCompValues}
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <Input
                                    type="text"
                                    value={wageLabels.C}
                                    onChange={(e) => {
                                      const value = e.target.value || 'Cパターン'
                                      const next = { ...wageLabels, C: value }
                                      setWageLabels(next)
                                      const scopeKey =
                                        (editingWorker as any)?.employeeId ||
                                        editingWorker?.id ||
                                        formData.employeeId ||
                                        undefined
                                      saveWagePatternLabels(next, scopeKey)
                                    }}
                                    className="h-8 text-xs"
                                    disabled={!canEditCompValues}
                                  />
                                  <span className="text-[10px] text-muted-foreground">
                                    任意設定
                                  </span>
                                </div>
                                <Input
                                  id="hourlyRatePatternC"
                                  type="number"
                                  min="0"
                                  value={formData.hourlyRatePatternC}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      hourlyRatePatternC: e.target.value,
                                    })
                                  }
                                  placeholder="例: 2,000"
                                  disabled={!canEditCompValues}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4 space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              月額固定
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                              <Input
                                id="monthlyFixedAmount"
                                type="number"
                                min="0"
                                value={formData.monthlyFixedAmount}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    monthlyFixedAmount: e.target.value,
                                  })
                                }
                                placeholder="例: 300000"
                                disabled={!canEditCompValues}
                              />
                              <p className="text-[11px] text-muted-foreground md:text-right">
                                例）300,000円など。カレンダー画面の「月額固定 ON/OFF」トグルと連動予定です。
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid gap-2">
                        <Label htmlFor="teams">チーム（複数選択可）</Label>
                        <MultiSelect
                          options={teams}
                          selected={formData.teams}
                          onChange={(selected) => setFormData({ ...formData, teams: selected })}
                          placeholder="チームを選択"
                          readOnly={!isWorkerEditUnlocked}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="role">権限 *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: 'admin' | 'worker') =>
                            setFormData({ ...formData, role: value })
                          }
                          disabled={!canEditCompValues}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="権限を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="worker">ワーカー</SelectItem>
                            <SelectItem value="admin">管理者</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          ※ 管理者権限：管理者ダッシュボードにアクセス可能（全ワーカーの勤務時間を一覧表示・管理可能）
                          <br />※ ワーカー権限：自分の勤務時間のみ表示・管理可能
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="notes">備考欄</Label>
                        <textarea
                          id="notes"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                          placeholder="その他の情報や備考を入力"
                          disabled={!isWorkerEditUnlocked}
                        />
                      </div>
                    </div>
                    <PasswordVerificationDialog
                      open={isWorkerPasswordDialogOpen}
                      onOpenChange={(open) => {
                        setIsWorkerPasswordDialogOpen(open)
                      }}
                      onVerified={handleWorkerEditVerified}
                      currentUser={currentUser}
                      actionType="workclock-worker"
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false)
                          resetForm()
                          setIsPasswordEditable(false) // パスワード編集をリセット
                        }}
                      >
                        キャンセル
                      </Button>
                      <Button type="submit">
                        {editingWorker ? '更新' : '登録'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>登録ワーカー一覧</CardTitle>
              <CardDescription>
                現在登録されているワーカーの一覧です
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">氏名</TableHead>
                    <TableHead className="w-[100px]">時給</TableHead>
                    <TableHead className="w-[150px]">チーム</TableHead>
                    <TableHead className="w-[80px]">権限</TableHead>
                    <TableHead className="w-[200px]">備考欄</TableHead>
                    <TableHead className="w-[100px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">{worker.name}</TableCell>
                      <TableCell>¥{worker.hourlyRate.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {worker.teams && worker.teams.length > 0 ? (
                            worker.teams.map((team) => (
                              <Badge key={team} variant="outline" className="text-xs">
                                {team}
                              </Badge>
                            ))
                          ) : (
                            '-'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {worker.role === 'admin' ? '管理者' : '業務委託・外注先'}
                      </TableCell>
                      <TableCell>
                        <div 
                          className="max-w-[200px] text-sm text-muted-foreground overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.4',
                            maxHeight: '2.8em',
                          }}
                        >
                          {worker.notes || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(worker)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(worker.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
