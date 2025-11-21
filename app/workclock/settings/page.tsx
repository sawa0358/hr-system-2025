"use client"

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
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
import { Plus, Pencil, Trash2, Tags, X, Menu } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/workclock/multi-select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { PasswordVerificationDialog } from '@/components/password-verification-dialog'
import { getWagePatternLabels, saveWagePatternLabels } from '@/lib/workclock/wage-patterns'
import { getWorkerBillingMeta, saveWorkerBillingMeta } from '@/lib/workclock/worker-billing-meta'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterEmployment, setFilterEmployment] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<string>('newest')
  // ワーカー編集全体のロック（既存ワーカーは初期ロック、新規はアンロック）
  const [isWorkerEditUnlocked, setIsWorkerEditUnlocked] = useState(false)
  const [isWorkerPasswordDialogOpen, setIsWorkerPasswordDialogOpen] = useState(false)
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [wageLabels, setWageLabels] = useState(getWagePatternLabels())
  const [countLabels, setCountLabels] = useState({ A: '回数Aパターン', B: '回数Bパターン', C: '回数Cパターン' })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMobile = useIsMobile()
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
    // 回数パターン金額
    countRateA: '',
    countRateB: '',
    countRateC: '',
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

  // モバイル時のスクロールでメニューを閉じる
  useEffect(() => {
    if (!isMobile || !isMenuOpen) return

    const handleScroll = () => {
      setIsMenuOpen(false)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [isMobile, isMenuOpen])

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
      countRateA: '',
      countRateB: '',
      countRateC: '',
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

      // 報酬設定のバリデーション
      const hourlyValue =
        formData.hourlyRate !== '' ? Number(formData.hourlyRate) : 0
      const countA =
        formData.countRateA !== '' ? Number(formData.countRateA) : 0
      const countB =
        formData.countRateB !== '' ? Number(formData.countRateB) : 0
      const countC =
        formData.countRateC !== '' ? Number(formData.countRateC) : 0
      const monthlyValue =
        formData.monthlyFixedAmount !== ''
          ? Number(formData.monthlyFixedAmount)
          : 0

      const hasHourly = hourlyValue > 0
      const hasCount = [countA, countB, countC].some((v) => v > 0)
      const hasMonthly = monthlyValue > 0

      if (!hasHourly && !hasCount && !hasMonthly) {
        throw new Error(
          '時給パターン、回数パターン、月額固定のいずれか1つ以上を設定してください。'
        )
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
            hourlyRate: hourlyValue,
            // パターン名（ラベル）をDBに保存
            wagePatternLabelA: wageLabels.A,
            wagePatternLabelB: wageLabels.B,
            wagePatternLabelC: wageLabels.C,
            // 追加の時給パターン金額をDBに保存
            hourlyRateB:
              formData.hourlyRatePatternB !== ''
                ? Number(formData.hourlyRatePatternB)
                : undefined,
            hourlyRateC:
              formData.hourlyRatePatternC !== ''
                ? Number(formData.hourlyRatePatternC)
                : undefined,
            // 回数パターン名（ラベル）をDBに保存
            countPatternLabelA: countLabels.A,
            countPatternLabelB: countLabels.B,
            countPatternLabelC: countLabels.C,
            // 回数パターン金額をDBに保存
            countRateA:
              formData.countRateA !== ''
                ? Number(formData.countRateA)
                : undefined,
            countRateB:
              formData.countRateB !== ''
                ? Number(formData.countRateB)
                : undefined,
            countRateC:
              formData.countRateC !== ''
                ? Number(formData.countRateC)
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
          hourlyRate: hourlyValue,
          // パターン名（ラベル）を DB に保存
          wagePatternLabelA: wageLabels.A,
          wagePatternLabelB: wageLabels.B,
          wagePatternLabelC: wageLabels.C,
          hourlyRateB:
            formData.hourlyRatePatternB !== ''
              ? Number(formData.hourlyRatePatternB)
              : undefined,
          hourlyRateC:
            formData.hourlyRatePatternC !== ''
              ? Number(formData.hourlyRatePatternC)
              : undefined,
          // 回数パターン名（ラベル）を DB に保存
          countPatternLabelA: countLabels.A,
          countPatternLabelB: countLabels.B,
          countPatternLabelC: countLabels.C,
          countRateA:
            formData.countRateA !== ''
              ? Number(formData.countRateA)
              : undefined,
          countRateB:
            formData.countRateB !== ''
              ? Number(formData.countRateB)
              : undefined,
          countRateC:
            formData.countRateC !== ''
              ? Number(formData.countRateC)
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
    
    // 回数パターンのラベルも読み込み
    const dbCountLabels = {
      A: worker.countPatternLabelA || '回数Aパターン',
      B: worker.countPatternLabelB || '回数Bパターン',
      C: worker.countPatternLabelC || '回数Cパターン',
    }
    setCountLabels(dbCountLabels)

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
      countRateA:
        typeof worker.countRateA === 'number' ? String(worker.countRateA) : '',
      countRateB:
        typeof worker.countRateB === 'number' ? String(worker.countRateB) : '',
      countRateC:
        typeof worker.countRateC === 'number' ? String(worker.countRateC) : '',
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
        if (!currentUser?.id) {
          throw new Error('ユーザー情報が取得できません（再ログインしてください）')
        }
        await deleteWorker(workerId, currentUser.id)
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
  // 報酬設定や権限（ワーカー/リーダー）は総務・管理者のみ編集可能
  const canEditCompensation = ['hr', 'admin'].includes(currentUser?.role || '')
  const canEditCompValues = canEditCompensation && isWorkerEditUnlocked

  const filteredWorkers = workers.filter((worker) => {
    const matchesTeam =
      filterTeam === 'all' || (worker.teams || []).includes(filterTeam)

    const employmentType = (worker.employeeType || '').toString()
    const matchesEmployment =
      filterEmployment === 'all'
        ? true
        : employmentType.includes(filterEmployment)

    const matchesRole =
      filterRole === 'all'
        ? true
        : filterRole === 'admin'
        ? worker.role === 'admin'
        : worker.role === 'worker'

    return matchesTeam && matchesEmployment && matchesRole
  }).sort((a, b) => {
    // 並び替えロジック
    switch (sortOrder) {
      case 'name_asc':
        // 名前順（フリガナ昇順）
        const aFurigana = a.furigana || a.name || ''
        const bFurigana = b.furigana || b.name || ''
        return aFurigana.localeCompare(bFurigana, 'ja')
      case 'team_asc':
        // チーム名順
        const aTeam = a.teams?.[0] || 'zzz' // チーム未設定は最後
        const bTeam = b.teams?.[0] || 'zzz'
        return aTeam.localeCompare(bTeam, 'ja')
      case 'role_desc':
        // 権限順（リーダー→ワーカー）
        const aRole = a.role === 'admin' ? 0 : 1
        const bRole = b.role === 'admin' ? 0 : 1
        return aRole - bRole
      case 'oldest':
        // 登録日時の古い順（APIから取得した順序の逆）
        return 1 // 逆順なので後続の処理で reverse() が適用される想定
      case 'newest':
      default:
        // 登録日時の新しい順（APIデフォルト）
        return 0 // 元の順序を維持
    }
  })

  // 現在ログイン中ユーザーのWorkClockWorkerレコードとリーダー判定
  const ownWorker = useMemo(
    () => workers.find((w) => w.employeeId === currentUser?.id) || null,
    [workers, currentUser?.id],
  )
  const isLeader = ownWorker?.role === 'admin'

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#bddcd9' }}>
      {isMobile ? (
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <div className="fixed left-1/2 -translate-x-1/2 top-4 z-50 flex gap-2">
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
                style={{ backgroundColor: '#f5f4cd' }}
                aria-label="時間管理メニューを開く"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            {isLeader && ownWorker && (
              <Link href={`/workclock/worker/${ownWorker.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
                  style={{ backgroundColor: '#f5f4cd' }}
                  aria-label="自分の勤務画面へ移動"
                >
                  私
                </Button>
              </Link>
            )}
          </div>
          <SheetContent 
            side="top" 
            className="p-0 w-full h-auto max-h-[80vh]"
            onInteractOutside={() => setIsMenuOpen(false)}
          >
            <SheetHeader className="px-4 py-3 border-b">
              <SheetTitle>時間管理システム</SheetTitle>
            </SheetHeader>
            <div className="max-h-[calc(80vh-60px)] overflow-y-auto">
              <SidebarNav 
                workers={workers} 
                currentRole="admin" 
                showHeader={false}
                collapsible={false}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <>
          <div className="fixed left-1/2 -translate-x-1/2 top-4 z-50 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
              style={{ backgroundColor: '#f5f4cd' }}
              aria-label="時間管理メニューを開く"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {isLeader && ownWorker && (
              <Link href={`/workclock/worker/${ownWorker.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md rounded-md"
                  style={{ backgroundColor: '#f5f4cd' }}
                  aria-label="自分の勤務画面へ移動"
                >
                  私
                </Button>
              </Link>
            )}
          </div>
          <div
            className={`h-full overflow-hidden border-r border-slate-200 bg-sidebar transition-all duration-300 ${
              isMenuOpen ? 'w-72' : 'w-0'
            }`}
            style={{ backgroundColor: '#add1cd' }}
          >
            {isMenuOpen && (
              <>
                <div className="px-4 py-3 border-b">
                  <h2 className="text-base font-semibold text-sidebar-foreground break-words">
                    時間管理システム
                  </h2>
                </div>
                <SidebarNav
                  workers={workers}
                  currentRole="admin"
                  showHeader={false}
                  collapsible={false}
                />
              </>
            )}
          </div>
        </>
      )}

      <main
        className={`flex-1 overflow-y-auto ${isMobile ? 'pt-20' : 'pt-16'}`}
        style={{ backgroundColor: '#bddcd9' }}
      >
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
                            readOnly
                            disabled
                            required
                            className="bg-muted text-muted-foreground"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password">システムパスワード *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            readOnly
                            disabled
                            required
                            placeholder="ログイン用パスワード"
                            className="text-[#374151] bg-[#edeaed]"
                          />
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
                          <Label htmlFor="email">メールアドレス</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                              時給パターン（A/B/C）と月額固定を設定できます。
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
                                  disabled={!canEditCompValues}
                                />
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

                          <div className="border-t pt-4 space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              回数パターン（〇〇円／回orセット）
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Input
                                  type="text"
                                  value={countLabels.A}
                                  onChange={(e) => {
                                    const value = e.target.value || '回数Aパターン'
                                    setCountLabels({ ...countLabels, A: value })
                                  }}
                                  placeholder="例: 訪問1回"
                                  className="h-8 text-xs"
                                  disabled={!canEditCompValues}
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  value={formData.countRateA}
                                  onChange={(e) =>
                                    setFormData({ ...formData, countRateA: e.target.value })
                                  }
                                  placeholder="例: 5000"
                                  disabled={!canEditCompValues}
                                />
                                <p className="text-[10px] text-muted-foreground">円／回</p>
                              </div>
                              <div className="space-y-1">
                                <Input
                                  type="text"
                                  value={countLabels.B}
                                  onChange={(e) => {
                                    const value = e.target.value || '回数Bパターン'
                                    setCountLabels({ ...countLabels, B: value })
                                  }}
                                  placeholder="例: セット作業"
                                  className="h-8 text-xs"
                                  disabled={!canEditCompValues}
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  value={formData.countRateB}
                                  onChange={(e) =>
                                    setFormData({ ...formData, countRateB: e.target.value })
                                  }
                                  placeholder="例: 8000"
                                  disabled={!canEditCompValues}
                                />
                                <p className="text-[10px] text-muted-foreground">円／回</p>
                              </div>
                              <div className="space-y-1">
                                <Input
                                  type="text"
                                  value={countLabels.C}
                                  onChange={(e) => {
                                    const value = e.target.value || '回数Cパターン'
                                    setCountLabels({ ...countLabels, C: value })
                                  }}
                                  placeholder="例: 特別対応"
                                  className="h-8 text-xs"
                                  disabled={!canEditCompValues}
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  value={formData.countRateC}
                                  onChange={(e) =>
                                    setFormData({ ...formData, countRateC: e.target.value })
                                  }
                                  placeholder="例: 10000"
                                  disabled={!canEditCompValues}
                                />
                                <p className="text-[10px] text-muted-foreground">円／回</p>
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
                                カレンダー画面の「月額固定 ON/OFF」トグルと連動。
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
                            <SelectItem value="admin">リーダー</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          ※ リーダー権限：自分が所属するチームのワーカー/リーダーの勤務時間を一覧表示・管理可能
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
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
                <div className="flex-1 space-y-1.5 min-w-[150px]">
                  <Label className="text-xs font-medium text-muted-foreground">チーム</Label>
                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5 min-w-[150px]">
                  <Label className="text-xs font-medium text-muted-foreground">雇用形態</Label>
                  <Select value={filterEmployment} onValueChange={setFilterEmployment}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="業務委託">業務委託</SelectItem>
                      <SelectItem value="外注先">外注先</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5 min-w-[150px]">
                  <Label className="text-xs font-medium text-muted-foreground">権限</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="admin">リーダー</SelectItem>
                      <SelectItem value="worker">業務委託・外注先</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5 min-w-[180px]">
                  <Label className="text-xs font-medium text-muted-foreground">並び順</Label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">登録日時（新しい順）</SelectItem>
                      <SelectItem value="oldest">登録日時（古い順）</SelectItem>
                      <SelectItem value="name_asc">名前順（フリガナ）</SelectItem>
                      <SelectItem value="team_asc">チーム名順</SelectItem>
                      <SelectItem value="role_desc">権限順（リーダー優先）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                  {filteredWorkers.map((worker) => (
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
                        {worker.role === 'admin' ? 'リーダー' : '業務委託・外注先'}
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
