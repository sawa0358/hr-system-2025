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
import { getWorkers, addWorker, saveWorkers, getTeams, saveTeams, addTeam } from '@/lib/workclock/storage'
import { Worker } from '@/lib/workclock/types'
import { Plus, Pencil, Trash2, Tags, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/workclock/multi-select'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [formData, setFormData] = useState({
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
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setWorkers(getWorkers())
    setTeams(getTeams())
  }, [])

  const resetForm = () => {
    setFormData({
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
    })
    setEditingWorker(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingWorker) {
      const updatedWorkers = workers.map((w) =>
        w.id === editingWorker.id
          ? {
              ...w,
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
            }
          : w
      )
      saveWorkers(updatedWorkers)
      setWorkers(updatedWorkers)
      toast({
        title: '更新完了',
        description: 'ワーカー情報を更新しました',
      })
    } else {
      const newWorker = addWorker({
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
      })
      setWorkers([...workers, newWorker])
      toast({
        title: '登録完了',
        description: '新しいワーカーを登録しました',
      })
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker)
    setFormData({
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
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (workerId: string) => {
    if (confirm('このワーカーを削除してもよろしいですか？')) {
      const updatedWorkers = workers.filter((w) => w.id !== workerId)
      saveWorkers(updatedWorkers)
      setWorkers(updatedWorkers)
      toast({
        title: '削除完了',
        description: 'ワーカーを削除しました',
      })
    }
  }

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTeamName.trim()) {
      addTeam(newTeamName.trim())
      setTeams([...teams, newTeamName.trim()])
      setNewTeamName('')
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
      setTeams(updatedTeams)
      toast({
        title: 'チーム削除完了',
        description: `${teamName}を削除しました`,
      })
    }
  }

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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
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
