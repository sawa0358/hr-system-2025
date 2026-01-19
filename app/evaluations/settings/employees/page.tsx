"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Search, Save, ArrowLeft, UserPlus, Users, Calculator, Trash2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function EmployeeSettingsPage() {
    const [activeTab, setActiveTab] = useState("individual")

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
            </div>

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
                    <IndividualSettings />
                </TabsContent>
                <TabsContent value="team">
                    <TeamSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function IndividualSettings() {
    const [employees, setEmployees] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [patterns, setPatterns] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')

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

    const handleSave = async (emp: any) => {
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
                alert(`${emp.name}の設定を保存しました`)
            } else {
                alert('保存に失敗しました')
            }
        } catch (e) {
            console.error(e)
            alert('エラーが発生しました')
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
                                            />
                                        </div>
                                    ) : <span className="text-slate-300 text-xs">-</span>}
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3" onClick={() => handleSave(emp)}>
                                        保存
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function TeamSettings() {
    const [teams, setTeams] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

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

    const handleCreate = async () => {
        const name = prompt('新しいチーム名を入力してください')
        if (!name) return

        try {
            const res = await fetch('/api/evaluations/settings/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            if (res.ok) fetchTeams()
            else alert('作成に失敗しました')
        } catch (e) {
            console.error(e)
            alert('エラーが発生しました')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('このチームを削除してもよろしいですか？')) return

        try {
            const res = await fetch(`/api/evaluations/settings/teams?id=${id}`, { method: 'DELETE' })
            if (res.ok) fetchTeams()
            else alert('削除に失敗しました')
        } catch (e) {
            console.error(e)
            alert('エラーが発生しました')
        }
    }

    const handleEdit = async (team: any) => {
        const name = prompt('チーム名を編集', team.name)
        if (!name || name === team.name) return

        try {
            const res = await fetch('/api/evaluations/settings/teams', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: team.id, name })
            })
            if (res.ok) fetchTeams()
            else alert('更新に失敗しました')
        } catch (e) {
            console.error(e)
            alert('エラーが発生しました')
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>チーム管理</CardTitle>
                    <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">新規チーム作成</Button>
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
                                    {/* Edit logic can be added later if needed, assume Delete is sufficient for now */}
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(team)}>
                                            編集
                                        </Button>
                                        <Button variant="ghost" size="sm" className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(team.id)}>
                                            削除
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
