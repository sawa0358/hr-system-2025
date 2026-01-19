"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Plus, Trash2, Calendar as CalendarIcon } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function FiscalYearSettingsPage() {
    const { currentUser } = useAuth()
    const [fiscalYears, setFiscalYears] = useState<any[]>([
        { id: '1', name: '2025年度', startDate: '2025-04-01', endDate: '2026-03-31' },
        { id: '2', name: '2024年度', startDate: '2024-04-01', endDate: '2025-03-31' },
    ])

    const isAdminOrHr = currentUser?.role === 'admin' || currentUser?.role === 'hr'

    if (!isAdminOrHr) {
        return <div className="p-8 text-center">アクセス権限がありません</div>
    }

    const handleAdd = () => {
        const nextYear = fiscalYears.length > 0 ? parseInt(fiscalYears[0].name) + 1 : new Date().getFullYear()
        setFiscalYears([
            {
                id: `new-${Date.now()}`,
                name: `${nextYear}年度`,
                startDate: `${nextYear}-04-01`,
                endDate: `${nextYear + 1}-03-31`
            },
            ...fiscalYears
        ])
    }

    const handleDelete = (id: string) => {
        if (confirm('この年度設定を削除しますか？')) {
            setFiscalYears(fiscalYears.filter(fy => fy.id !== id))
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/evaluations">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">年度設定</h1>
                        <p className="text-slate-500">今年度ポイント等の集計期間を定義します</p>
                    </div>
                </div>
                <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    年度を追加
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>年度一覧</CardTitle>
                    <CardDescription>
                        各年度の開始日と終了日を設定してください。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>年度名称</TableHead>
                                <TableHead>開始日</TableHead>
                                <TableHead>終了日</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fiscalYears.map((fy) => (
                                <TableRow key={fy.id}>
                                    <TableCell>
                                        <Input
                                            defaultValue={fy.name}
                                            className="h-8"
                                            onChange={(e) => {
                                                const newYears = [...fiscalYears]
                                                const target = newYears.find(y => y.id === fy.id)
                                                if (target) target.name = e.target.value
                                                setFiscalYears(newYears)
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="date"
                                            defaultValue={fy.startDate}
                                            className="h-8"
                                            onChange={(e) => {
                                                const newYears = [...fiscalYears]
                                                const target = newYears.find(y => y.id === fy.id)
                                                if (target) target.startDate = e.target.value
                                                setFiscalYears(newYears)
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="date"
                                            defaultValue={fy.endDate}
                                            className="h-8"
                                            onChange={(e) => {
                                                const newYears = [...fiscalYears]
                                                const target = newYears.find(y => y.id === fy.id)
                                                if (target) target.endDate = e.target.value
                                                setFiscalYears(newYears)
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                onClick={() => handleDelete(fy.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-6 flex justify-end">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            設定を保存
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <div className="font-bold flex items-center gap-2 mb-1">
                    <CalendarIcon className="w-4 h-4" />
                    集計ロジックへの影響
                </div>
                ダッシュボードの「今年度獲得pt」は、現在の日付が含まれる年度の開始日から終了日までの期間で集計されます。
                設定を変更すると、過去の集計数値も変動する可能性があるためご注意ください。
            </div>
        </div>
    )
}
