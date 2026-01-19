"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Search, Save, ArrowLeft, UserPlus, Users, Calculator, Trash2, Lock, Unlock, Edit2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function EmployeeSettingsPage() {
    const [activeTab, setActiveTab] = useState("individual")
    const [isEditing, setIsEditing] = useState(false)
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/evaluations">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">個別・チーム設定</h1>
                        <p className="text-slate-500">社員ごとの目標設定やパターンの割り当て、チーム管理を行います</p>
                    </div>
                </div>
                <div>
                    {!isEditing ? (
                        <Button onClick={() => setShowPasswordDialog(true)} variant="outline" className="gap-2">
                            <Lock className="w-4 h-4" />
                            編集モードにする
                        </Button>
                    ) : (
                        <Button onClick={() => setIsEditing(false)} variant="secondary" className="gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                            <Unlock className="w-4 h-4" />
                            編集モード中
                        </Button>
                    )}
                </div>
            </div>

            <PasswordCheckDialog
                open={showPasswordDialog}
                onOpenChange={setShowPasswordDialog}
                onSuccess={() => setIsEditing(true)}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="individual" className="gap-2">
                        <Users className="w-4 h-4" />
                        個人設定
                    </TabsTrigger>
                    <TabsTrigger value="team" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        チーム設定
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="individual">
                    <IndividualSettings isEditing={isEditing} />
                </TabsContent>
                <TabsContent value="team">
                    <TeamSettings isEditing={isEditing} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function PasswordCheckDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [password, setPassword] = useState("")
    const [error, setError] = useState(false)

    const handleSubmit = () => {
        // Hardcoded password for now as per common requirement when not specified
        if (password === "admin" || password === "password") {
            onSuccess()
            onOpenChange(false)
            setPassword("")
            setError(false)
        } else {
            setError(true)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>パスワード入力</DialogTitle>
                    <DialogDescription>
                        編集を行うにはパスワードを入力してください
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="パスワード"
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                    {error && <p className="text-sm text-red-500">パスワードが間違っています</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
                    <Button onClick={handleSubmit}>確認</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function IndividualSettings({ isEditing }: { isEditing: boolean }) {
    const [employees, setEmployees] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [patterns, setPatterns] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Confirmation Dialog State
    const [confirmState, setConfirmState] = useState<{ open: boolean, emp: any | null }>({ open: false, emp: null })

    useEffect(() => {
        // Fetch All Data
        Promise.all([
            fetch('/api/evaluations/settings/employees').then(res => res.json()),
            fetch('/api/evaluations/settings/teams').then(res => res.json()),
            fetch('/api/evaluations/settings/patterns').then(res => res.json())
        ]).then(([empData, teamData, patternData]) => {
            if (Array.isArray(empData)) setEmployees(empData)
            if (Array.isArray(teamData)) setTeams(teamData)
            if (Array.isArray(patternData)) setPatterns(patternData)
        }).catch(console.error)
    }, [])

    const handleChange = (id: string, field: string, value: any) => {
        setEmployees(employees.map(emp =>
            emp.id === id ? { ...emp, [field]: value } : emp
        ))
    }

    const onSaveClick = (emp: any) => {
        setConfirmState({ open: true, emp })
    }

    const executeSave = async () => {
        const emp = confirmState.emp
        if (!emp) return

        try {
            const res = await fetch(`/api/evaluations/settings/employees/${emp.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: emp.teamId || null,
                    patternId: emp.patternId || null,
                    hasGoals: emp.hasGoals,
                    contractGoal: emp.contractGoal,
                    completionGoal: emp.completionGoal
                })
            })
            if (res.ok) {
                // alert(`${emp.name}の設定を保存しました`)
            } else {
                alert('保存に失敗しました')
            }
        } catch (e) {
            console.error(e)
            alert('エラーが発生しました')
        } finally {
            setConfirmState({ open: false, emp: null })
        }
    }

    const filteredEmployees = employees.filter(e =>
        e.name.includes(searchQuery) ||
        (e.teamName && e.teamName.includes(searchQuery))
    )

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>個人別設定一覧</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="社員を検索..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">社員名</TableHead>
                            <TableHead className="w-[150px]">所属チーム</TableHead>
                            <TableHead className="w-[200px]">評価パターン</TableHead>
                            <TableHead className="w-[100px]">数字目標</TableHead>
                            <TableHead className="w-[200px]">契約目標 (月次)</TableHead>
                            <TableHead className="w-[200px]">完工目標 (月次)</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.map(emp => (
                            <TableRow key={emp.id}>
                                <TableCell className="font-medium">{emp.name}</TableCell>
                                <TableCell>
                                    <Select
                                        value={emp.teamId || 'none'}
                                        onValueChange={val => handleChange(emp.id, 'teamId', val === 'none' ? null : val)}
                                        disabled={!isEditing}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="未所属" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">未所属</SelectItem>
                                            {teams.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={emp.patternId || 'none'}
                                        onValueChange={val => handleChange(emp.id, 'patternId', val === 'none' ? null : val)}
                                        disabled={!isEditing}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="未設定" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">未設定</SelectItem>
                                            {patterns.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-center">
                                        <Switch
                                            checked={emp.hasGoals}
                                            onCheckedChange={checked => handleChange(emp.id, 'hasGoals', checked)}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {emp.hasGoals ? (
                                        <div className="relative">
                                            <span className="absolute left-2 top-1.5 text-xs text-slate-400">¥</span>
                                            <Input
                                                type="number"
                                                value={emp.contractGoal}
                                                onChange={e => handleChange(emp.id, 'contractGoal', e.target.value)}
                                                className="h-8 pl-6 text-right"
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    ) : <span className="text-slate-300 text-xs">-</span>}
                                </TableCell>
                                <TableCell>
                                    {emp.hasGoals ? (
                                        <div className="relative">
                                            <span className="absolute left-2 top-1.5 text-xs text-slate-400">¥</span>
                                            <Input
                                                type="number"
                                                value={emp.completionGoal}
                                                onChange={e => handleChange(emp.id, 'completionGoal', e.target.value)}
                                                className="h-8 pl-6 text-right"
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    ) : <span className="text-slate-300 text-xs">-</span>}
                                </TableCell>
                                <TableCell>
                                    {isEditing && (
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3" onClick={() => onSaveClick(emp)}>
                                            保存
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <AlertDialog open={confirmState.open} onOpenChange={(open) => !open && setConfirmState({ ...confirmState, open: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>変更を保存しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmState.emp?.name} の設定を変更します。よろしいですか？
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={executeSave}>保存</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

function TeamSettings({ isEditing }: { isEditing: boolean }) {
    const [teams, setTeams] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [confirmState, setConfirmState] = useState<{ open: boolean, team: any | null, action: 'edit' | 'delete' | 'create', payload?: any }>({ open: false, team: null, action: 'create' })

    const fetchTeams = () => {
        setLoading(true)
        fetch('/api/evaluations/settings/teams')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTeams(data)
                setLoading(false)
            })
            .catch(e => {
                console.error(e)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchTeams()
    }, [])

    const handleCreateClick = () => {
        const name = prompt('新しいチーム名を入力してください')
        if (!name) return
        setConfirmState({ open: true, team: null, action: 'create', payload: name })
    }

    const handleEditClick = (team: any) => {
        const name = prompt('チーム名を編集', team.name)
        if (!name || name === team.name) return
        setConfirmState({ open: true, team, action: 'edit', payload: name })
    }

    const handleDeleteClick = (team: any) => {
        setConfirmState({ open: true, team, action: 'delete' })
    }

    const executeAction = async () => {
        const { action, team, payload } = confirmState
        try {
            if (action === 'create') {
                const res = await fetch('/api/evaluations/settings/teams', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: payload })
                })
                if (res.ok) fetchTeams()
                else alert('作成に失敗しました')
            } else if (action === 'edit' && team) {
                const res = await fetch('/api/evaluations/settings/teams', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: team.id, name: payload })
                })
                if (res.ok) fetchTeams()
                else alert('更新に失敗しました')
            } else if (action === 'delete' && team) {
                const res = await fetch(`/api/evaluations/settings/teams?id=${team.id}`, { method: 'DELETE' })
                if (res.ok) fetchTeams()
                else alert('削除に失敗しました')
            }
        } catch (e) {
            console.error(e)
            alert('エラーが発生しました')
        } finally {
            setConfirmState({ open: false, team: null, action: 'create' })
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>チーム管理</CardTitle>
                    <Button onClick={handleCreateClick} disabled={!isEditing} className="bg-blue-600 hover:bg-blue-700">
                        {/* Icon optional */}
                        <UserPlus className="w-4 h-4 mr-2" />
                        新規チーム作成
                    </Button>
                </div>
                <CardDescription>
                    評価の集計単位となるチームを管理します
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {teams.length === 0 && <div className="p-4 text-slate-500">チームがありません</div>}
                    {teams.map((team) => (
                        <Card key={team.id} className="border-slate-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{team.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-slate-500 mb-4">
                                    メンバー: {team._count?.members || 0}名
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(team)} disabled={!isEditing}>
                                        編集
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(team)} disabled={!isEditing}>
                                        削除
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>

            <AlertDialog open={confirmState.open} onOpenChange={(open) => !open && setConfirmState({ ...confirmState, open: false })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmState.action === 'create' && 'チームを作成しますか？'}
                            {confirmState.action === 'edit' && 'チーム名を変更しますか？'}
                            {confirmState.action === 'delete' && 'チームを削除しますか？'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmState.action === 'delete' && 'この操作は取り消せません。所属しているメンバーの設定も変更される可能性があります。'}
                            {confirmState.action !== 'delete' && 'この変更を保存しますか？'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={executeAction} className={confirmState.action === 'delete' ? "bg-red-600 hover:bg-red-700" : ""}>
                            {confirmState.action === 'delete' ? '削除' : '保存'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
