"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Search, Save, ArrowLeft, UserPlus, Users, Calculator } from "lucide-react"
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
    // Mock data
    const employees = [
        { id: '1', name: '田中 太郎', team: 'Aチーム', pattern: '一般社員用', hasGoals: true, contractGoal: 2000000, completionGoal: 1500000 },
        { id: '2', name: '佐藤 花子', team: 'Bチーム', pattern: '店長用', hasGoals: true, contractGoal: 3000000, completionGoal: 3000000 },
        { id: '3', name: '鈴木 一郎', team: '未所属', pattern: '未設定', hasGoals: false, contractGoal: 0, completionGoal: 0 },
    ]

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>個人別設定一覧</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input placeholder="社員を検索..." className="pl-9" />
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
                        {employees.map(emp => (
                            <TableRow key={emp.id}>
                                <TableCell className="font-medium">{emp.name}</TableCell>
                                <TableCell>
                                    <Select defaultValue={emp.team === '未所属' ? undefined : 'a'}>
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="チーム選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="a">Aチーム</SelectItem>
                                            <SelectItem value="b">Bチーム</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Select defaultValue={emp.pattern === '未設定' ? undefined : 'p1'}>
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="パターン選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="p1">一般社員用</SelectItem>
                                            <SelectItem value="p2">店長用</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-center">
                                        <Switch defaultChecked={emp.hasGoals} />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {emp.hasGoals ? (
                                        <div className="relative">
                                            <span className="absolute left-2 top-1.5 text-xs text-slate-400">¥</span>
                                            <Input
                                                type="number"
                                                defaultValue={emp.contractGoal}
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
                                                defaultValue={emp.completionGoal}
                                                className="h-8 pl-6 text-right"
                                            />
                                        </div>
                                    ) : <span className="text-slate-300 text-xs">-</span>}
                                </TableCell>
                                <TableCell>
                                    <Button size="sm" variant="ghost">
                                        <Save className="w-4 h-4 text-blue-600" />
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
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>チーム管理</CardTitle>
                    <Button className="bg-blue-600 hover:bg-blue-700">新規チーム作成</Button>
                </div>
                <CardDescription>
                    評価の集計単位となるチームを管理します
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Aチーム', 'Bチーム', '営業1課'].map((team, i) => (
                        <Card key={i} className="border-slate-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{team}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-slate-500 mb-4">メンバー: 5名</div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="w-full">編集</Button>
                                    <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-700 hover:bg-red-50">削除</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
