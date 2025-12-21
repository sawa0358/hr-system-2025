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
import { getWorkers, addWorker, updateWorker, deleteWorker, getTeams, addTeam, deleteTeam, NewWorkerPayload, getBillingClients, addBillingClient, updateBillingClient, deleteBillingClient, BillingClient } from '@/lib/workclock/api-storage'
import { Worker } from '@/lib/workclock/types'
import { api } from '@/lib/workclock/api'
import { Plus, Pencil, Trash2, Tags, X, Menu, Eye, ChevronDown, Building2 } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

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
  const [workerCandidates, setWorkerCandidates] = useState<any[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false)
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterEmployment, setFilterEmployment] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<string>('newest')
  // ワーカー編集全体のロック（既存ワーカーは初期ロック、新規はアンロック）
  const [isWorkerEditUnlocked, setIsWorkerEditUnlocked] = useState(false)
  const [isWorkerPasswordDialogOpen, setIsWorkerPasswordDialogOpen] = useState(false)
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  // 請求先管理
  const [billingClients, setBillingClients] = useState<BillingClient[]>([])
  const [isBillingClientDialogOpen, setIsBillingClientDialogOpen] = useState(false)
  const [newBillingClientName, setNewBillingClientName] = useState('')
  const [editingBillingClient, setEditingBillingClient] = useState<BillingClient | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [wageLabels, setWageLabels] = useState(getWagePatternLabels())
  const [countLabels, setCountLabels] = useState({ A: '回数Aパターン', B: '回数Bパターン', C: '回数Cパターン' })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  const [standardTaxRate, setStandardTaxRate] = useState<string>('10')
  const [isLoadingTax, setIsLoadingTax] = useState(false)
  const [isSavingTax, setIsSavingTax] = useState(false)
  // 源泉徴収率設定
  const [withholdingRateUnder1M, setWithholdingRateUnder1M] = useState<string>('10.21')
  const [withholdingRateOver1M, setWithholdingRateOver1M] = useState<string>('20.42')
  const [isSavingWithholding, setIsSavingWithholding] = useState(false)
  // 税率設定のパスワード保護
  const [isTaxRateEditUnlocked, setIsTaxRateEditUnlocked] = useState(false)
  const [isTaxRatePasswordDialogOpen, setIsTaxRatePasswordDialogOpen] = useState(false)
  // 税率設定の折りたたみ状態
  const [isTaxSettingsOpen, setIsTaxSettingsOpen] = useState(false)
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
    transferDestination: '',
    // 消費税設定
    billingTaxEnabled: false,
    billingTaxRate: '',
    taxType: 'exclusive' as 'exclusive' | 'inclusive', // 外税 | 内税
    withholdingTaxEnabled: false, // 源泉徴収対象（レガシー）
    // 各パターン別源泉徴収
    withholdingHourlyA: false,
    withholdingHourlyB: false,
    withholdingHourlyC: false,
    withholdingCountA: false,
    withholdingCountB: false,
    withholdingCountC: false,
    withholdingMonthlyFixed: false,
    billingClientId: '', // 請求先ID
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (currentUser?.id) {
      loadWorkers()
    }
    
    // チーム一覧を初期化
    const fetchTeams = async () => {
      try {
        const initialTeams = await getTeams(currentUser?.id)
        if (initialTeams.length === 0) {
          // デフォルトチームを設定（APIには保存せず、UI表示のみ）
          // 必要ならAPI経由で保存するロジックを追加
          const defaultTeams = ['チームA', 'チームB', 'チームC']
          setTeams(defaultTeams)
        } else {
          setTeams(initialTeams)
        }
      } catch (error) {
        console.error('チーム一覧の取得に失敗', error)
        // フォールバック
        setTeams(['チームA', 'チームB', 'チームC'])
      }
    }
    fetchTeams()

    // 請求先一覧を取得
    const fetchBillingClients = async () => {
      try {
        const clients = await getBillingClients(currentUser?.id)
        setBillingClients(clients)
      } catch (error) {
        console.error('請求先一覧の取得に失敗', error)
      }
    }
    fetchBillingClients()

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
    // 標準消費税率の読み込み
    ;(async () => {
      try {
        setIsLoadingTax(true)
        const res = await fetch('/api/workclock/tax-settings')
        if (res.ok) {
          const data = await res.json()
          if (data && typeof data.rate === 'number') {
            setStandardTaxRate(String(data.rate))
          }
        }
      } catch (e) {
        console.error('標準消費税率の取得に失敗:', e)
      } finally {
        setIsLoadingTax(false)
      }
    })()
    
    // 源泉徴収率の読み込み
    ;(async () => {
      try {
        const response: any = await api.withholdingTaxSettings.get()
        if (response?.rateUnder1M !== undefined) {
          setWithholdingRateUnder1M(String(response.rateUnder1M))
        }
        if (response?.rateOver1M !== undefined) {
          setWithholdingRateOver1M(String(response.rateOver1M))
        }
      } catch (e) {
        console.warn('源泉徴収率の読み込みに失敗:', e)
      }
    })()
  }, [currentUser])

  const handleSaveStandardTaxRate = async () => {
    try {
      const rateNumber = Number(standardTaxRate)
      if (!Number.isFinite(rateNumber) || rateNumber < 0) {
        toast({
          title: '入力エラー',
          description: '有効な消費税率（0以上の数値）を入力してください。',
          variant: 'destructive',
        })
        return
      }

      setIsSavingTax(true)
      const userId = currentUser?.id
      const res = await fetch('/api/workclock/tax-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-employee-id': userId } : {}),
        },
        body: JSON.stringify({ rate: rateNumber }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '標準消費税率の更新に失敗しました')
      }

      toast({
        title: '保存しました',
        description: '標準消費税率を更新し、課税対象のワーカーに反映しました。',
      })
      // 反映後、ワーカー一覧を再取得
      await loadWorkers()
      // 保存後にロック状態に戻す
      setIsTaxRateEditUnlocked(false)
    } catch (error: any) {
      console.error('handleSaveStandardTaxRate error:', error)
      toast({
        title: 'エラー',
        description: error?.message || '標準消費税率の更新に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setIsSavingTax(false)
    }
  }

  // 源泉徴収率の保存
  const handleSaveWithholdingTaxRate = async () => {
    try {
      const rateUnder1M = Number(withholdingRateUnder1M)
      const rateOver1M = Number(withholdingRateOver1M)
      
      if (!Number.isFinite(rateUnder1M) || rateUnder1M < 0 || !Number.isFinite(rateOver1M) || rateOver1M < 0) {
        toast({
          title: '入力エラー',
          description: '有効な源泉徴収率（0以上の数値）を入力してください。',
          variant: 'destructive',
        })
        return
      }

      setIsSavingWithholding(true)
      await api.withholdingTaxSettings.update({ rateUnder1M, rateOver1M })

      toast({
        title: '保存しました',
        description: '源泉徴収率を更新しました。',
      })
      // 保存後にロック状態に戻す
      setIsTaxRateEditUnlocked(false)
    } catch (error: any) {
      console.error('handleSaveWithholdingTaxRate error:', error)
      toast({
        title: 'エラー',
        description: error?.message || '源泉徴収率の更新に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setIsSavingWithholding(false)
    }
  }

  // 税率設定のパスワード認証成功時
  const handleTaxRateEditVerified = () => {
    setIsTaxRateEditUnlocked(true)
    setIsTaxRatePasswordDialogOpen(false)
    toast({
      title: '編集が有効化されました',
      description: '税率設定を変更できるようになりました。',
    })
  }

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
      transferDestination: '',
      billingTaxEnabled: false,
      billingTaxRate: '',
      taxType: 'exclusive',
      withholdingTaxEnabled: false,
      // 各パターン別源泉徴収フラグ
      withholdingHourlyA: false,
      withholdingHourlyB: false,
      withholdingHourlyC: false,
      withholdingCountA: false,
      withholdingCountB: false,
      withholdingCountC: false,
      withholdingMonthlyFixed: false,
      billingClientId: '',
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
      const taxRateValue =
        formData.billingTaxRate !== '' ? Number(formData.billingTaxRate) : undefined

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
            // 文字列フィールドは、空文字にした場合もそのまま送信してDB側を上書きしたい
            companyName: formData.companyName,
            qualifiedInvoiceNumber: formData.qualifiedInvoiceNumber,
            chatworkId: formData.chatworkId,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            hourlyRate: hourlyValue,
            // パターン名（ラベル）をDBに保存
            wagePatternLabelA: wageLabels.A,
            wagePatternLabelB: wageLabels.B,
            wagePatternLabelC: wageLabels.C,
            // 追加の時給パターン金額をDBに保存
            hourlyRateB:
              formData.hourlyRatePatternB !== ''
                ? Number(formData.hourlyRatePatternB)
                : null,
            hourlyRateC:
              formData.hourlyRatePatternC !== ''
                ? Number(formData.hourlyRatePatternC)
                : null,
            // 回数パターン名（ラベル）をDBに保存
            countPatternLabelA: countLabels.A,
            countPatternLabelB: countLabels.B,
            countPatternLabelC: countLabels.C,
            // 回数パターン金額をDBに保存
            countRateA:
              formData.countRateA !== ''
                ? Number(formData.countRateA)
                : null,
            countRateB:
              formData.countRateB !== ''
                ? Number(formData.countRateB)
                : null,
            countRateC:
              formData.countRateC !== ''
                ? Number(formData.countRateC)
                : null,
            // 月額固定金額をDBに保存（0 または空なら未設定）
            monthlyFixedAmount:
              formData.monthlyFixedAmount !== ''
                ? Number(formData.monthlyFixedAmount)
                : null,
            monthlyFixedEnabled:
              formData.monthlyFixedAmount !== '' &&
              Number(formData.monthlyFixedAmount) > 0,
            billingTaxEnabled: formData.billingTaxEnabled,
            billingTaxRate: taxRateValue,
            taxType: formData.taxType,
            withholdingTaxEnabled: formData.withholdingTaxEnabled,
            // 各パターン別源泉徴収フラグ
            withholdingHourlyA: formData.withholdingHourlyA,
            withholdingHourlyB: formData.withholdingHourlyB,
            withholdingHourlyC: formData.withholdingHourlyC,
            withholdingCountA: formData.withholdingCountA,
            withholdingCountB: formData.withholdingCountB,
            withholdingCountC: formData.withholdingCountC,
            withholdingMonthlyFixed: formData.withholdingMonthlyFixed,
            teams: formData.teams,
            role: formData.role as 'worker' | 'admin',
            // 備考欄も空にした場合は空文字で上書きしたい
            notes: formData.notes,
            // 振込先は、空文字に更新された場合でもDB側に反映させたいので
            // undefined にはせず、そのまま送信する（空文字なら空文字で上書き）
            transferDestination: formData.transferDestination,
            // 請求先ID
            billingClientId: formData.billingClientId || null,
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
          // 新規登録時も、空文字で入力された場合はそのまま保存する
          companyName: formData.companyName,
          qualifiedInvoiceNumber: formData.qualifiedInvoiceNumber,
          chatworkId: formData.chatworkId,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          hourlyRate: hourlyValue,
          // パターン名（ラベル）を DB に保存
          wagePatternLabelA: wageLabels.A,
          wagePatternLabelB: wageLabels.B,
          wagePatternLabelC: wageLabels.C,
          hourlyRateB:
            formData.hourlyRatePatternB !== ''
              ? Number(formData.hourlyRatePatternB)
              : null,
          hourlyRateC:
            formData.hourlyRatePatternC !== ''
              ? Number(formData.hourlyRatePatternC)
              : null,
          // 回数パターン名（ラベル）を DB に保存
          countPatternLabelA: countLabels.A,
          countPatternLabelB: countLabels.B,
          countPatternLabelC: countLabels.C,
          countRateA:
            formData.countRateA !== ''
              ? Number(formData.countRateA)
              : null,
          countRateB:
            formData.countRateB !== ''
              ? Number(formData.countRateB)
              : null,
          countRateC:
            formData.countRateC !== ''
              ? Number(formData.countRateC)
              : null,
          monthlyFixedAmount:
            formData.monthlyFixedAmount !== ''
              ? Number(formData.monthlyFixedAmount)
              : null,
          monthlyFixedEnabled:
            formData.monthlyFixedAmount !== '' &&
            Number(formData.monthlyFixedAmount) > 0,
          billingTaxEnabled: formData.billingTaxEnabled,
          billingTaxRate: taxRateValue,
          taxType: formData.taxType,
          withholdingTaxEnabled: formData.withholdingTaxEnabled,
          // 各パターン別源泉徴収フラグ
          withholdingHourlyA: formData.withholdingHourlyA,
          withholdingHourlyB: formData.withholdingHourlyB,
          withholdingHourlyC: formData.withholdingHourlyC,
          withholdingCountA: formData.withholdingCountA,
          withholdingCountB: formData.withholdingCountB,
          withholdingCountC: formData.withholdingCountC,
          withholdingMonthlyFixed: formData.withholdingMonthlyFixed,
          teams: formData.teams,
          role: formData.role as 'worker' | 'admin',
          notes: formData.notes,
          // 振込先も空文字で保存・更新できるようにする
          transferDestination: formData.transferDestination,
          // 請求先ID
          billingClientId: formData.billingClientId || null,
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
    const latestTeams = await getTeams(currentUser?.id)
    setTeams(latestTeams)
    
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
      transferDestination: worker.transferDestination || '',
      employeeId: worker.employeeId || '',
      billingTaxEnabled: worker.billingTaxEnabled ?? false,
      billingTaxRate:
        typeof worker.billingTaxRate === 'number'
          ? String(worker.billingTaxRate)
          : '',
      taxType: worker.taxType || 'exclusive',
      withholdingTaxEnabled: worker.withholdingTaxEnabled ?? false,
      // 各パターン別源泉徴収フラグ
      withholdingHourlyA: worker.withholdingHourlyA ?? false,
      withholdingHourlyB: worker.withholdingHourlyB ?? false,
      withholdingHourlyC: worker.withholdingHourlyC ?? false,
      withholdingCountA: worker.withholdingCountA ?? false,
      withholdingCountB: worker.withholdingCountB ?? false,
      withholdingCountC: worker.withholdingCountC ?? false,
      withholdingMonthlyFixed: worker.withholdingMonthlyFixed ?? false,
      billingClientId: worker.billingClientId || '',
    })
    // 既存ワーカー編集時は、パスワード認証が通るまで編集をロック
    setIsWorkerEditUnlocked(false)
    setIsDialogOpen(true)
  }

  const handleView = (worker: Worker) => {
    setViewingWorker(worker)
    setIsViewDialogOpen(true)
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

  const handleAddTeam = async () => {
    console.log('[handleAddTeam] 呼び出し開始', { newTeamName, userId: currentUser?.id })
    const teamName = newTeamName.trim()
    if (!teamName) {
      console.log('[handleAddTeam] チーム名が空です')
      toast({
        title: '入力エラー',
        description: 'チーム名を入力してください',
        variant: 'destructive',
      })
      return
    }
    try {
      console.log('[handleAddTeam] addTeam呼び出し', { teamName, userId: currentUser?.id })
      await addTeam(teamName, currentUser?.id)
      console.log('[handleAddTeam] addTeam成功')
      const updatedTeams = await getTeams(currentUser?.id)
      console.log('[handleAddTeam] 更新後のチーム一覧', updatedTeams)
      setTeams(updatedTeams) // チーム管理と連動
      setNewTeamName('')
      toast({
        title: 'チーム追加完了',
        description: `${teamName}を追加しました`,
      })
    } catch (error) {
      console.error('[handleAddTeam] エラー:', error)
      toast({
        title: 'エラー',
        description: 'チームの追加に失敗しました',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTeam = async (teamName: string) => {
    if (confirm(`チーム「${teamName}」を削除してもよろしいですか？`)) {
      try {
        await deleteTeam(teamName, currentUser?.id)
        const updatedTeams = await getTeams(currentUser?.id)
        setTeams(updatedTeams) // チーム管理と連動
        toast({
          title: 'チーム削除完了',
          description: `${teamName}を削除しました`,
        })
      } catch (error) {
        console.error('チーム削除エラー:', error)
        toast({
          title: 'エラー',
          description: 'チームの削除に失敗しました',
          variant: 'destructive',
        })
      }
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
              {/* チーム管理ボタンは総務権限・管理者権限のみ表示 */}
              {canEditCompensation && (
                <Dialog open={isTeamDialogOpen} onOpenChange={async (open) => {
                  setIsTeamDialogOpen(open)
                  if (!open) {
                    // ダイアログを閉じた際にチーム一覧を更新（チーム管理と連動）
                    const updatedTeams = await getTeams(currentUser?.id)
                    setTeams(updatedTeams)
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
                    <div className="flex gap-2">
                      <Input
                        placeholder="新しいチーム名"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTeam()
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        onClick={() => handleAddTeam()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
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
              )}
              {/* 請求先管理ボタンは総務権限・管理者権限のみ表示 */}
              {canEditCompensation && (
                <Dialog open={isBillingClientDialogOpen} onOpenChange={async (open) => {
                  setIsBillingClientDialogOpen(open)
                  if (!open) {
                    const clients = await getBillingClients(currentUser?.id)
                    setBillingClients(clients)
                    setNewBillingClientName('')
                    setEditingBillingClient(null)
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Building2 className="mr-2 h-4 w-4" />
                      請求先管理
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>請求先管理</DialogTitle>
                      <DialogDescription>
                        請求先（会社名）の追加・編集・削除を行います
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder={editingBillingClient ? '請求先名を編集' : '新しい請求先名'}
                          value={editingBillingClient ? editingBillingClient.name : newBillingClientName}
                          onChange={(e) => {
                            if (editingBillingClient) {
                              setEditingBillingClient({ ...editingBillingClient, name: e.target.value })
                            } else {
                              setNewBillingClientName(e.target.value)
                            }
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (editingBillingClient) {
                                try {
                                  await updateBillingClient(editingBillingClient.id, editingBillingClient.name, currentUser?.id)
                                  const clients = await getBillingClients(currentUser?.id)
                                  setBillingClients(clients)
                                  setEditingBillingClient(null)
                                  toast({ title: '更新完了', description: '請求先を更新しました' })
                                } catch (error: any) {
                                  toast({ title: 'エラー', description: error.message || '請求先の更新に失敗しました', variant: 'destructive' })
                                }
                              } else if (newBillingClientName.trim()) {
                                try {
                                  await addBillingClient(newBillingClientName.trim(), currentUser?.id)
                                  const clients = await getBillingClients(currentUser?.id)
                                  setBillingClients(clients)
                                  setNewBillingClientName('')
                                  toast({ title: '追加完了', description: '請求先を追加しました' })
                                } catch (error: any) {
                                  toast({ title: 'エラー', description: error.message || '請求先の追加に失敗しました', variant: 'destructive' })
                                }
                              }
                            }
                          }}
                        />
                        {editingBillingClient ? (
                          <>
                            <Button type="button" onClick={async () => {
                              try {
                                await updateBillingClient(editingBillingClient.id, editingBillingClient.name, currentUser?.id)
                                const clients = await getBillingClients(currentUser?.id)
                                setBillingClients(clients)
                                setEditingBillingClient(null)
                                toast({ title: '更新完了', description: '請求先を更新しました' })
                              } catch (error: any) {
                                toast({ title: 'エラー', description: error.message || '請求先の更新に失敗しました', variant: 'destructive' })
                              }
                            }}>更新</Button>
                            <Button type="button" variant="outline" onClick={() => setEditingBillingClient(null)}>キャンセル</Button>
                          </>
                        ) : (
                          <Button type="button" onClick={async () => {
                            if (newBillingClientName.trim()) {
                              try {
                                await addBillingClient(newBillingClientName.trim(), currentUser?.id)
                                const clients = await getBillingClients(currentUser?.id)
                                setBillingClients(clients)
                                setNewBillingClientName('')
                                toast({ title: '追加完了', description: '請求先を追加しました' })
                              } catch (error: any) {
                                toast({ title: 'エラー', description: error.message || '請求先の追加に失敗しました', variant: 'destructive' })
                              }
                            }
                          }}><Plus className="h-4 w-4" /></Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>登録済み請求先</Label>
                        <div className="flex flex-wrap gap-2">
                          {billingClients.length === 0 ? (
                            <span className="text-sm text-muted-foreground">請求先が登録されていません</span>
                          ) : (
                            billingClients.map((client) => (
                              <Badge key={client.id} variant="secondary" className="text-sm flex items-center gap-1">
                                {client.name}
                                <button className="ml-1 rounded-full outline-none hover:bg-slate-200 p-0.5" onClick={() => setEditingBillingClient(client)} title="編集">
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button className="rounded-full outline-none hover:bg-slate-200 p-0.5" onClick={async () => {
                                  if (confirm(`請求先「${client.name}」を削除してもよろしいですか？`)) {
                                    try {
                                      await deleteBillingClient(client.id, currentUser?.id)
                                      const clients = await getBillingClients(currentUser?.id)
                                      setBillingClients(clients)
                                      toast({ title: '削除完了', description: '請求先を削除しました' })
                                    } catch (error: any) {
                                      toast({ title: 'エラー', description: error.message || '請求先の削除に失敗しました', variant: 'destructive' })
                                    }
                                  }
                                }} title="削除">
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Dialog open={isDialogOpen} onOpenChange={async (open) => {
                setIsDialogOpen(open)
                if (open) {
                  // 請求先一覧も取得
                  const clients = await getBillingClients(currentUser?.id)
                  setBillingClients(clients)
                  // ダイアログを開いた時に最新のチーム一覧を取得
                  const updatedTeams = await getTeams(currentUser?.id)
                  setTeams(updatedTeams)
                } else {
                  resetForm()
                  setIsWorkerEditUnlocked(false)
                }
              }}>
                <DialogTrigger asChild>
                <Button
                  onClick={async () => {
                    resetForm()
                    // 新規ワーカー登録時は報酬設定の編集を最初から有効化
                    setIsWorkerEditUnlocked(true)
                    // ワーカー候補（未登録の従業員）を取得
                    try {
                      setIsLoadingCandidates(true)
                      const res = await fetch('/api/workclock/workers/candidates', {
                        headers: {
                          'x-employee-id': currentUser?.id || '',
                        },
                      })
                      if (res.ok) {
                        const data = await res.json()
                        setWorkerCandidates(data.candidates || [])
                      } else {
                        console.error('ワーカー候補の取得に失敗:', res.status)
                        setWorkerCandidates([])
                      }
                    } catch (e) {
                      console.error('ワーカー候補の取得エラー:', e)
                      setWorkerCandidates([])
                    } finally {
                      setIsLoadingCandidates(false)
                    }
                  }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    新規ワーカー登録
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto workclock-worker-dialog">
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
                              if (value === 'none' || value === '__no_candidates__') {
                                setFormData({ ...formData, employeeId: '' })
                                return
                              }
                              const emp = workerCandidates.find((e) => e.id === value)
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
                              <SelectValue placeholder={isLoadingCandidates ? '読み込み中...' : '社員を選択'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>選択してください</SelectItem>
                              {workerCandidates.length === 0 && !isLoadingCandidates ? (
                                <SelectItem value="__no_candidates__" disabled>
                                  登録可能な従業員がいません
                                </SelectItem>
                              ) : (
                                workerCandidates
                                  .filter((e) => (e.employeeType || '').includes('業務委託') || (e.employeeType || '').includes('外注先'))
                                  .map((e) => (
                                    <SelectItem key={e.id} value={e.id}>
                                      {e.name}（{e.employeeType || '種別未設定'}）
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-muted-foreground">
                            社員情報から氏名・メールを自動入力します
                            <br />
                            ※ すでにワーカー登録されている従業員は表示されません
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

                      {/* 請求・消費税設定 */}
                      <div className="grid gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <Label className="text-sm">請求・消費税設定</Label>
                            <p className="text-xs text-muted-foreground">
                              このワーカーの請求書に消費税を含めるかどうかを設定します。
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={formData.billingTaxEnabled}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  billingTaxEnabled: checked,
                                })
                              }
                              disabled={!isWorkerEditUnlocked}
                            />
                            <span className="text-xs text-muted-foreground">
                              {formData.billingTaxEnabled ? '課税対象' : '非課税'}
                            </span>
                          </div>
                        </div>
                        {formData.billingTaxEnabled && (
                          <>
                            <div className="grid grid-cols-[120px,1fr] items-center gap-3">
                              <Label
                                htmlFor="billingTaxRate"
                                className="text-xs text-muted-foreground"
                              >
                                消費税率（%）
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id="billingTaxRate"
                                  type="number"
                                  min={0}
                                  step={0.1}
                                  value={formData.billingTaxRate}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      billingTaxRate: e.target.value,
                                    })
                                  }
                                  placeholder="例: 10"
                                  disabled={!isWorkerEditUnlocked}
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-[120px,1fr] items-center gap-3">
                              <Label className="text-xs text-muted-foreground">
                                税区分
                              </Label>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                                    formData.taxType === 'exclusive'
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background text-muted-foreground border-input hover:bg-accent'
                                  }`}
                                  onClick={() =>
                                    setFormData({ ...formData, taxType: 'exclusive' })
                                  }
                                  disabled={!isWorkerEditUnlocked}
                                >
                                  外税
                                </button>
                                <button
                                  type="button"
                                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                                    formData.taxType === 'inclusive'
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background text-muted-foreground border-input hover:bg-accent'
                                  }`}
                                  onClick={() =>
                                    setFormData({ ...formData, taxType: 'inclusive' })
                                  }
                                  disabled={!isWorkerEditUnlocked}
                                >
                                  内税
                                </button>
                                <span className="text-xs text-muted-foreground">
                                  {formData.taxType === 'exclusive'
                                    ? '報酬額に消費税を上乗せ'
                                    : '報酬額に消費税を含む'}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 源泉徴収設定 */}
                      <div className="grid gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <Label className="text-sm">源泉徴収設定</Label>
                            <p className="text-xs text-muted-foreground">
                              このワーカーのPDF請求書に源泉徴収税額を表示するかどうかを設定します。
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={formData.withholdingTaxEnabled}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  withholdingTaxEnabled: checked,
                                })
                              }
                              disabled={!isWorkerEditUnlocked}
                            />
                            <span className="text-xs text-muted-foreground">
                              {formData.withholdingTaxEnabled ? '対象' : '対象外'}
                            </span>
                          </div>
                        </div>
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
                                <div className="flex items-center gap-2 pt-1">
                                  <Switch
                                    id="withholdingHourlyA"
                                    checked={formData.withholdingHourlyA}
                                    onCheckedChange={(checked) =>
                                      setFormData({ ...formData, withholdingHourlyA: checked })
                                    }
                                    disabled={!canEditCompValues}
                                  />
                                  <Label htmlFor="withholdingHourlyA" className="text-xs cursor-pointer">
                                    源泉徴収
                                  </Label>
                                </div>
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
                                <div className="flex items-center gap-2 pt-1">
                                  <Switch
                                    id="withholdingHourlyB"
                                    checked={formData.withholdingHourlyB}
                                    onCheckedChange={(checked) =>
                                      setFormData({ ...formData, withholdingHourlyB: checked })
                                    }
                                    disabled={!canEditCompValues}
                                  />
                                  <Label htmlFor="withholdingHourlyB" className="text-xs cursor-pointer">
                                    源泉徴収
                                  </Label>
                                </div>
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
                                <div className="flex items-center gap-2 pt-1">
                                  <Switch
                                    id="withholdingHourlyC"
                                    checked={formData.withholdingHourlyC}
                                    onCheckedChange={(checked) =>
                                      setFormData({ ...formData, withholdingHourlyC: checked })
                                    }
                                    disabled={!canEditCompValues}
                                  />
                                  <Label htmlFor="withholdingHourlyC" className="text-xs cursor-pointer">
                                    源泉徴収
                                  </Label>
                                </div>
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
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] text-muted-foreground">円／回</p>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      id="withholdingCountA"
                                      checked={formData.withholdingCountA}
                                      onCheckedChange={(checked) =>
                                        setFormData({ ...formData, withholdingCountA: checked })
                                      }
                                      disabled={!canEditCompValues}
                                    />
                                    <Label htmlFor="withholdingCountA" className="text-xs cursor-pointer">
                                      源泉徴収
                                    </Label>
                                  </div>
                                </div>
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
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] text-muted-foreground">円／回</p>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      id="withholdingCountB"
                                      checked={formData.withholdingCountB}
                                      onCheckedChange={(checked) =>
                                        setFormData({ ...formData, withholdingCountB: checked })
                                      }
                                      disabled={!canEditCompValues}
                                    />
                                    <Label htmlFor="withholdingCountB" className="text-xs cursor-pointer">
                                      源泉徴収
                                    </Label>
                                  </div>
                                </div>
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
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] text-muted-foreground">円／回</p>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      id="withholdingCountC"
                                      checked={formData.withholdingCountC}
                                      onCheckedChange={(checked) =>
                                        setFormData({ ...formData, withholdingCountC: checked })
                                      }
                                      disabled={!canEditCompValues}
                                    />
                                    <Label htmlFor="withholdingCountC" className="text-xs cursor-pointer">
                                      源泉徴収
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4 space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              月額固定
                            </Label>
                            <div className="space-y-2">
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
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] text-muted-foreground">
                                  カレンダー画面の「月額固定 ON/OFF」トグルと連動。
                                </p>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id="withholdingMonthlyFixed"
                                    checked={formData.withholdingMonthlyFixed}
                                    onCheckedChange={(checked) =>
                                      setFormData({ ...formData, withholdingMonthlyFixed: checked })
                                    }
                                    disabled={!canEditCompValues}
                                  />
                                  <Label htmlFor="withholdingMonthlyFixed" className="text-xs cursor-pointer">
                                    源泉徴収
                                  </Label>
                                </div>
                              </div>
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
                        <Label htmlFor="billingClient">請求先</Label>
                        <Select
                          value={formData.billingClientId || 'none'}
                          onValueChange={(value) =>
                            setFormData({ ...formData, billingClientId: value === 'none' ? '' : value })
                          }
                          disabled={!isWorkerEditUnlocked}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="請求先を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">未設定</SelectItem>
                            {billingClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          PDF出力時に「◯◯◯◯御中」として表示されます
                        </p>
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
                        <Label htmlFor="transferDestination">振込先</Label>
                        <textarea
                          id="transferDestination"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.transferDestination}
                          onChange={(e) =>
                            setFormData({ ...formData, transferDestination: e.target.value })
                          }
                          placeholder="銀行名、支店名、口座番号、口座名義などを入力"
                          disabled={!isWorkerEditUnlocked}
                        />
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

              {/* 閲覧ダイアログ */}
              {viewingWorker && (
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto workclock-worker-view-dialog">
                    <DialogHeader>
                      <DialogTitle>ワーカー情報閲覧</DialogTitle>
                      <DialogDescription>
                        ワーカーの情報を閲覧します（編集不可）
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>氏名</Label>
                          <Input
                            value={viewingWorker.name || ''}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>パスワード</Label>
                          <Input
                            type="password"
                            value={viewingWorker.password || ''}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>会社名</Label>
                          <Input
                            value={viewingWorker.companyName || ''}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>適格請求書発行事業者番号</Label>
                          <Input
                            value={viewingWorker.qualifiedInvoiceNumber || ''}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Chatwork ID</Label>
                          <Input
                            value={viewingWorker.chatworkId || ''}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>メールアドレス</Label>
                          <Input
                            value={viewingWorker.email || ''}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>電話番号</Label>
                          <Input
                            value={viewingWorker.phone || ''}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>住所</Label>
                          <Input
                            value={viewingWorker.address || ''}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>権限</Label>
                          <Input
                            value={viewingWorker.role === 'admin' ? 'リーダー' : '業務委託・外注先'}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>時給</Label>
                          <Input
                            value={`¥${(viewingWorker.hourlyRate || 0).toLocaleString()}`}
                            readOnly
                            className="bg-background"
                          />
                        </div>
                      </div>
                      {(viewingWorker.hourlyRateB || viewingWorker.hourlyRateC) && (
                        <div className="grid gap-2">
                          <Label>時給パターン</Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {viewingWorker.hourlyRateB && (
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {viewingWorker.wagePatternLabelB || '時給Bパターン'}
                                </Label>
                                <Input
                                  value={`¥${parseInt(String(viewingWorker.hourlyRateB || 0)).toLocaleString()}／時`}
                                  readOnly
                                  className="bg-background"
                                />
                              </div>
                            )}
                            {viewingWorker.hourlyRateC && (
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {viewingWorker.wagePatternLabelC || '時給Cパターン'}
                                </Label>
                                <Input
                                  value={`¥${parseInt(String(viewingWorker.hourlyRateC || 0)).toLocaleString()}／時`}
                                  readOnly
                                  className="bg-background"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {(viewingWorker.countRateA || viewingWorker.countRateB || viewingWorker.countRateC) && (
                        <div className="grid gap-2">
                          <Label>回数パターン</Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {viewingWorker.countRateA && (
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {viewingWorker.countPatternLabelA || '回数Aパターン'}
                                </Label>
                                <Input
                                  value={`¥${parseInt(String(viewingWorker.countRateA || 0)).toLocaleString()}／回`}
                                  readOnly
                                  className="bg-background"
                                />
                              </div>
                            )}
                            {viewingWorker.countRateB && (
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {viewingWorker.countPatternLabelB || '回数Bパターン'}
                                </Label>
                                <Input
                                  value={`¥${parseInt(String(viewingWorker.countRateB || 0)).toLocaleString()}／回`}
                                  readOnly
                                  className="bg-background"
                                />
                              </div>
                            )}
                            {viewingWorker.countRateC && (
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {viewingWorker.countPatternLabelC || '回数Cパターン'}
                                </Label>
                                <Input
                                  value={`¥${parseInt(String(viewingWorker.countRateC || 0)).toLocaleString()}／回`}
                                  readOnly
                                  className="bg-background"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label>チーム</Label>
                        <div className="flex flex-wrap gap-2">
                          {viewingWorker.teams && viewingWorker.teams.length > 0 ? (
                            viewingWorker.teams.map((team) => (
                              <Badge key={team} variant="outline">
                                {team}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">未設定</span>
                          )}
                        </div>
                      </div>

                      {/* 請求・消費税設定 */}
                      <div className="grid gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
                        <Label className="text-sm font-medium">請求・消費税設定</Label>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm">消費税対象</p>
                            <p className="text-xs text-muted-foreground">
                              {viewingWorker.billingTaxEnabled ? '対象（消費税を請求書に表示）' : '対象外'}
                            </p>
                          </div>
                          <Badge variant={viewingWorker.billingTaxEnabled ? "default" : "secondary"}>
                            {viewingWorker.billingTaxEnabled ? '対象' : '対象外'}
                          </Badge>
                        </div>
                        {viewingWorker.billingTaxEnabled && (
                          <>
                            <div className="flex items-center gap-2 pl-4">
                              <span className="text-sm text-muted-foreground">消費税率:</span>
                              <span className="text-sm font-medium">{viewingWorker.billingTaxRate ?? '-'}%</span>
                            </div>
                            <div className="flex items-center gap-2 pl-4">
                              <span className="text-sm text-muted-foreground">税区分:</span>
                              <Badge variant="outline">
                                {viewingWorker.taxType === 'inclusive' ? '内税' : '外税'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {viewingWorker.taxType === 'inclusive'
                                  ? '（報酬額に消費税を含む）'
                                  : '（報酬額に消費税を上乗せ）'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 源泉徴収設定 */}
                      <div className="grid gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4">
                        <Label className="text-sm font-medium">源泉徴収設定</Label>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm">源泉徴収対象</p>
                            <p className="text-xs text-muted-foreground">
                              {viewingWorker.withholdingTaxEnabled ? '対象（PDF請求書に源泉徴収税額を表示）' : '対象外'}
                            </p>
                          </div>
                          <Badge variant={viewingWorker.withholdingTaxEnabled ? "default" : "secondary"}>
                            {viewingWorker.withholdingTaxEnabled ? '対象' : '対象外'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>振込先</Label>
                        <textarea
                          value={viewingWorker.transferDestination || ''}
                          readOnly
                          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          style={{ resize: 'none' }}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>備考欄</Label>
                        <textarea
                          value={viewingWorker.notes || ''}
                          readOnly
                          className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          style={{ resize: 'none' }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setIsViewDialogOpen(false)}>
                        閉じる
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* 税率設定（折りたたみ式） */}
          <Collapsible open={isTaxSettingsOpen} onOpenChange={setIsTaxSettingsOpen} className="mb-6">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              {/* 常に表示: タイトルと現在の値 */}
              <CollapsibleTrigger asChild>
                <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex flex-wrap items-center gap-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">消費税率:</span>
                      <span className="text-sm font-semibold text-slate-900">{standardTaxRate}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">源泉徴収率:</span>
                      <span className="text-sm font-semibold text-slate-900">{withholdingRateUnder1M}% / {withholdingRateOver1M}%</span>
                      <span className="text-xs text-slate-500">(100万円以下/超)</span>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${isTaxSettingsOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>

              {/* 折りたたみ: 編集UI */}
              <CollapsibleContent>
                <div className="border-t border-slate-200 p-4 space-y-4">
                  {/* 消費税率設定 */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">標準消費税率（全社設定）</h3>
                    <p className="text-xs text-slate-500">
                      ここで変更した税率は、課税対象に設定されているすべてのワーカーの請求に自動反映されます。
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {!isTaxRateEditUnlocked && canEditCompensation && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsTaxRatePasswordDialogOpen(true)}
                        >
                          編集を有効化
                        </Button>
                      )}
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={standardTaxRate}
                        onChange={(e) => setStandardTaxRate(e.target.value)}
                        disabled={isLoadingTax || isSavingTax || !canEditCompensation || !isTaxRateEditUnlocked}
                        className="w-24"
                      />
                      <span className="text-sm text-slate-600">%</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveStandardTaxRate}
                        disabled={isLoadingTax || isSavingTax || !canEditCompensation || !isTaxRateEditUnlocked}
                      >
                        {isSavingTax ? '保存中...' : '保存'}
                      </Button>
                    </div>
                  </div>

                  {/* 源泉徴収率設定 */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">源泉徴収率設定（全社設定）</h3>
                    <p className="text-xs text-slate-500">
                      源泉徴収対象のワーカーのPDF請求書に適用される税率です。法定税率に合わせて設定してください。
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 whitespace-nowrap">100万円以下:</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={withholdingRateUnder1M}
                          onChange={(e) => setWithholdingRateUnder1M(e.target.value)}
                          disabled={isSavingWithholding || !canEditCompensation || !isTaxRateEditUnlocked}
                          className="w-24"
                        />
                        <span className="text-sm text-slate-600">%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 whitespace-nowrap">100万円超:</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={withholdingRateOver1M}
                          onChange={(e) => setWithholdingRateOver1M(e.target.value)}
                          disabled={isSavingWithholding || !canEditCompensation || !isTaxRateEditUnlocked}
                          className="w-24"
                        />
                        <span className="text-sm text-slate-600">%</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveWithholdingTaxRate}
                        disabled={isSavingWithholding || !canEditCompensation || !isTaxRateEditUnlocked}
                      >
                        {isSavingWithholding ? '保存中...' : '保存'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* 税率設定用パスワード認証ダイアログ */}
          <PasswordVerificationDialog
            open={isTaxRatePasswordDialogOpen}
            onOpenChange={(open) => {
              setIsTaxRatePasswordDialogOpen(open)
            }}
            onVerified={handleTaxRateEditVerified}
            currentUser={currentUser}
            actionType="workclock-worker"
          />

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
                            onClick={() => handleView(worker)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEditCompensation && (
                            <>
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
                            </>
                          )}
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
