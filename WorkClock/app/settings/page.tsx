'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarNav } from '@/components/sidebar-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { getWorkers, addWorker, updateWorker, deleteWorker, getTeams, addTeam, deleteTeam, getWorkerCandidates, WorkerCandidate } from '@/lib/storage'
import { Worker } from '@/lib/types'
import { api } from '@/lib/api'
import { Plus, Pencil, Trash2, Tags, X, Percent, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/multi-select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

export default function SettingsPage() {
  const { currentUser } = useAuth()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [candidates, setCandidates] = useState<WorkerCandidate[]>([])
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  
  // 税率設定
  const [standardTaxRate, setStandardTaxRate] = useState<number>(10)
  const [withholdingRateUnder1M, setWithholdingRateUnder1M] = useState<number>(10.21)
  const [withholdingRateOver1M, setWithholdingRateOver1M] = useState<number>(20.42)
  const [isSavingTax, setIsSavingTax] = useState(false)
  const [isSavingWithholding, setIsSavingWithholding] = useState(false)
  
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
    hourlyRate: '',
    teams: [] as string[],
    role: 'worker' as 'admin' | 'worker',
    notes: '',
    billingTaxEnabled: false, // 消費税を請求に反映
    taxType: 'exclusive' as 'exclusive' | 'inclusive', // 外税 | 内税
    withholdingTaxEnabled: false, // 源泉徴収対象
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const workersData = await getWorkers()
        const teamsData = await getTeams()
        setWorkers(workersData)
        setTeams(teamsData)
        
        // 税率設定を読み込む
        try {
          const taxResponse: any = await api.taxSettings.get()
          if (taxResponse?.rate !== undefined) {
            setStandardTaxRate(taxResponse.rate)
          }
        } catch (e) {
          console.warn('消費税率の読み込みに失敗:', e)
        }
        
        try {
          const withholdingResponse: any = await api.withholdingTaxSettings.get()
          if (withholdingResponse?.rateUnder1M !== undefined) {
            setWithholdingRateUnder1M(withholdingResponse.rateUnder1M)
          }
          if (withholdingResponse?.rateOver1M !== undefined) {
            setWithholdingRateOver1M(withholdingResponse.rateOver1M)
          }
        } catch (e) {
          console.warn('源泉徴収率の読み込みに失敗:', e)
        }
      } catch (error) {
        console.error('データの読み込みに失敗しました:', error)
      }
    }
    loadData()
  }, [])

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
      teams: [],
      role: 'worker',
      notes: '',
      billingTaxEnabled: false,
      taxType: 'exclusive',
      withholdingTaxEnabled: false,
    })
    setSelectedEmployeeId('')
    setEditingWorker(null)
  }

  // 候補従業員を読み込む
  const loadCandidates = async () => {
    try {
      const candidatesData = await getWorkerCandidates()
      setCandidates(candidatesData)
    } catch (error) {
      console.error('候補従業員の読み込みに失敗しました:', error)
    }
  }

  // 従業員を選択した時の処理
  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    const employee = candidates.find(c => c.id === employeeId)
    if (employee) {
      setFormData({
        ...formData,
        employeeId: employee.id,
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingWorker) {
        await updateWorker(editingWorker.id, {
          name: formData.name,
          password: formData.password,
          companyName: formData.companyName,
          qualifiedInvoiceNumber: formData.qualifiedInvoiceNumber,
          chatworkId: formData.chatworkId,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          hourlyRate: Number(formData.hourlyRate),
          teams: formData.teams,
          role: formData.role,
          notes: formData.notes,
          billingTaxEnabled: formData.billingTaxEnabled,
          taxType: formData.taxType,
          withholdingTaxEnabled: formData.withholdingTaxEnabled,
        })
        const updatedWorkers = await getWorkers()
        setWorkers(updatedWorkers)
        toast({
          title: '更新完了',
          description: 'ワーカー情報を更新しました',
        })
      } else {
        // 新規登録時は従業員選択が必須
        if (!formData.employeeId) {
          toast({
            title: 'エラー',
            description: '従業員を選択してください',
            variant: 'destructive',
          })
          return
        }
        const newWorker = await addWorker({
          employeeId: formData.employeeId,
          name: formData.name,
          password: formData.password,
          companyName: formData.companyName,
          qualifiedInvoiceNumber: formData.qualifiedInvoiceNumber,
          chatworkId: formData.chatworkId,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          hourlyRate: Number(formData.hourlyRate),
          teams: formData.teams,
          role: formData.role,
          notes: formData.notes,
          billingTaxEnabled: formData.billingTaxEnabled,
          taxType: formData.taxType,
          withholdingTaxEnabled: formData.withholdingTaxEnabled,
        })
        setWorkers([...workers, newWorker])
        // 候補リストを更新（登録された従業員を除外）
        await loadCandidates()
        toast({
          title: '登録完了',
          description: '新しいワーカーを登録しました',
        })
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('保存に失敗しました:', error)
      toast({
        title: 'エラー',
        description: error?.message || 'ワーカー情報の保存に失敗しました',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker)
    setFormData({
      employeeId: worker.employeeId || '',
      name: worker.name,
      password: worker.password || '',
      companyName: worker.companyName || '',
      qualifiedInvoiceNumber: worker.qualifiedInvoiceNumber || '',
      chatworkId: worker.chatworkId || '',
      email: worker.email,
      phone: worker.phone || '',
      address: worker.address || '',
      hourlyRate: String(worker.hourlyRate),
      teams: worker.teams || [],
      role: worker.role,
      notes: worker.notes || '',
      billingTaxEnabled: worker.billingTaxEnabled || false,
      taxType: worker.taxType || 'exclusive',
      withholdingTaxEnabled: worker.withholdingTaxEnabled || false,
    })
    setSelectedEmployeeId(worker.employeeId || '')
    setIsDialogOpen(true)
  }

  const handleDelete = async (workerId: string) => {
    if (confirm('このワーカーを削除してもよろしいですか？')) {
      try {
        await deleteWorker(workerId)
        const updatedWorkers = await getWorkers()
        setWorkers(updatedWorkers)
        toast({
          title: '削除完了',
          description: 'ワーカーを削除しました',
        })
      } catch (error) {
        console.error('削除に失敗しました:', error)
        toast({
          title: 'エラー',
          description: 'ワーカーの削除に失敗しました',
          variant: 'destructive',
        })
      }
    }
  }

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTeamName.trim()) {
      try {
        await addTeam(newTeamName.trim())
        const updatedTeams = await getTeams()
        setTeams(updatedTeams)
        setNewTeamName('')
        toast({
          title: 'チーム追加完了',
          description: `${newTeamName}を追加しました`,
        })
      } catch (error) {
        console.error('チーム追加に失敗しました:', error)
        toast({
          title: 'エラー',
          description: 'チームの追加に失敗しました',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDeleteTeam = async (teamName: string) => {
    if (confirm(`チーム「${teamName}」を削除してもよろしいですか？`)) {
      try {
        await deleteTeam(teamName)
        const updatedTeams = await getTeams()
        setTeams(updatedTeams)
        toast({
          title: 'チーム削除完了',
          description: `${teamName}を削除しました`,
        })
      } catch (error) {
        console.error('チーム削除に失敗しました:', error)
        toast({
          title: 'エラー',
          description: 'チームの削除に失敗しました',
          variant: 'destructive',
        })
      }
    }
  }

  // 消費税率を保存
  const handleSaveTaxRate = async () => {
    setIsSavingTax(true)
    try {
      await api.taxSettings.update(standardTaxRate)
      toast({
        title: '保存完了',
        description: '標準消費税率を更新しました',
      })
    } catch (error) {
      console.error('消費税率の保存に失敗:', error)
      toast({
        title: 'エラー',
        description: '消費税率の保存に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setIsSavingTax(false)
    }
  }

  // 源泉徴収率を保存
  const handleSaveWithholdingRate = async () => {
    setIsSavingWithholding(true)
    try {
      await api.withholdingTaxSettings.update(withholdingRateUnder1M, withholdingRateOver1M)
      toast({
        title: '保存完了',
        description: '源泉徴収率を更新しました',
      })
    } catch (error) {
      console.error('源泉徴収率の保存に失敗:', error)
      toast({
        title: 'エラー',
        description: '源泉徴収率の保存に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setIsSavingWithholding(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav workers={workers} currentRole="admin" />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">設定</h1>
              <p className="text-muted-foreground">
                ワーカーの登録・編集・削除を行います
              </p>
            </div>
            <div className="flex gap-2">
              {/* チーム管理ボタンは総務権限・管理者権限のみ表示 */}
              {(currentUser?.role === 'hr' || currentUser?.role === 'admin') && (
                <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
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
                              type="button"
                              className="ml-2 rounded-full outline-none hover:bg-secondary-foreground/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTeam(team)
                              }}
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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetForm()
                    loadCandidates()
                  }}>
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
                      {/* 新規登録時のみ従業員選択を表示 */}
                      {!editingWorker && (
                        <div className="grid gap-2">
                          <Label htmlFor="employee">従業員を選択 *</Label>
                          <Select
                            value={selectedEmployeeId}
                            onValueChange={handleSelectEmployee}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="従業員を選択してください" />
                            </SelectTrigger>
                            <SelectContent>
                              {candidates.length === 0 ? (
                                <SelectItem value="__no_candidates__" disabled>
                                  登録可能な従業員がいません
                                </SelectItem>
                              ) : (
                                candidates.map((candidate) => (
                                  <SelectItem key={candidate.id} value={candidate.id}>
                                    {candidate.name}
                                    {candidate.employeeType && ` (${candidate.employeeType})`}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            ※ すでにワーカー登録されている従業員は表示されません
                          </p>
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
                            disabled={!editingWorker && !!selectedEmployeeId}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password">システムパスワード *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({ ...formData, password: e.target.value })
                            }
                            required
                            placeholder="ログイン用パスワード"
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
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="qualifiedInvoiceNumber">適格証明番号</Label>
                          <Input
                            id="qualifiedInvoiceNumber"
                            value={formData.qualifiedInvoiceNumber}
                            onChange={(e) =>
                              setFormData({ ...formData, qualifiedInvoiceNumber: e.target.value })
                            }
                            placeholder="T1234567890123"
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
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">電話番号</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            placeholder="03-1234-5678"
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
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="hourlyRate">時給（円）*</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          min="0"
                          value={formData.hourlyRate}
                          onChange={(e) =>
                            setFormData({ ...formData, hourlyRate: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="teams">チーム（複数選択可）</Label>
                        <MultiSelect
                          options={teams}
                          selected={formData.teams}
                          onChange={(selected) => setFormData({ ...formData, teams: selected })}
                          placeholder="チームを選択"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="role">権限 *</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value: 'admin' | 'worker') =>
                            setFormData({ ...formData, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="worker">ワーカー</SelectItem>
                            <SelectItem value="admin">管理者</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 源泉徴収対象スイッチ */}
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="withholdingTaxEnabled" className="text-base">
                            源泉徴収対象
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            業務委託契約の場合は源泉徴収対象にしてください
                          </p>
                        </div>
                        <Switch
                          id="withholdingTaxEnabled"
                          checked={formData.withholdingTaxEnabled}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, withholdingTaxEnabled: checked })
                          }
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
                        />
                      </div>
                    </div>
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

          {/* 税率設定セクション（総務・管理者のみ） */}
          {(currentUser?.role === 'hr' || currentUser?.role === 'admin') && (
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              {/* 標準消費税率 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    標準消費税率
                  </CardTitle>
                  <CardDescription>
                    請求書に適用する消費税率を設定します
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={standardTaxRate}
                      onChange={(e) => setStandardTaxRate(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">%</span>
                    <Button
                      onClick={handleSaveTaxRate}
                      disabled={isSavingTax}
                      size="sm"
                    >
                      {isSavingTax ? '保存中...' : '保存'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ※ 消費税課税対象のワーカーに適用されます
                  </p>
                </CardContent>
              </Card>

              {/* 源泉徴収率 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    源泉徴収税率
                  </CardTitle>
                  <CardDescription>
                    業務委託ワーカーに対する源泉徴収率を設定します
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">100万円以下</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={withholdingRateUnder1M}
                          onChange={(e) => setWithholdingRateUnder1M(Number(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-muted-foreground text-sm">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">100万円超（超過分）</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={withholdingRateOver1M}
                          onChange={(e) => setWithholdingRateOver1M(Number(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-muted-foreground text-sm">%</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveWithholdingRate}
                    disabled={isSavingWithholding}
                    size="sm"
                  >
                    {isSavingWithholding ? '保存中...' : '保存'}
                  </Button>
                  <div className="text-xs text-muted-foreground p-3 bg-muted rounded space-y-1">
                    <p className="font-medium">計算式:</p>
                    <p>• 報酬が100万円以下: 報酬額 × {withholdingRateUnder1M}%</p>
                    <p>• 報酬が100万円超: (超過分 × {withholdingRateOver1M}%) + (100万円 × {withholdingRateUnder1M}%)</p>
                    <p className="mt-2 font-medium">計算例:</p>
                    <p>• 報酬30万円: {(300000 * withholdingRateUnder1M / 100).toLocaleString()}円</p>
                    <p>• 報酬150万円: {Math.floor(1000000 * withholdingRateUnder1M / 100 + 500000 * withholdingRateOver1M / 100).toLocaleString()}円</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                    <TableHead>氏名</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead>時給</TableHead>
                    <TableHead>チーム</TableHead>
                    <TableHead>権限</TableHead>
                    <TableHead>源泉徴収</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">{worker.name}</TableCell>
                      <TableCell>{worker.email}</TableCell>
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
                        {worker.role === 'admin' ? '管理者' : 'ワーカー'}
                      </TableCell>
                      <TableCell>
                        {worker.withholdingTaxEnabled ? (
                          <Badge variant="secondary" className="text-xs">
                            対象
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
