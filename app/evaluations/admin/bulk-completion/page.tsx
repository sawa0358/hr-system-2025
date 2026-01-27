
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
    ArrowLeft,
    Save,
    Search,
    Filter,
    Loader2,
    Calendar as CalendarIcon,
    CheckCircle2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export default function BulkCompletionPage() {
    const router = useRouter()
    const { toast } = useToast()

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [employees, setEmployees] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])

    // Filters
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [selectedTeam, setSelectedTeam] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    // Edited values: { [employeeId]: value }
    const [editedValues, setEditedValues] = useState<Record<string, string>>({})

    // Fetch Teams
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await fetch('/api/evaluations/settings/teams')
                if (res.ok) {
                    const data = await res.json()
                    setTeams(data)
                }
            } catch (error) {
                console.error("Failed to fetch teams", error)
            }
        }
        fetchTeams()
    }, [])

    // Fetch Data
    const fetchData = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('date', date)
            if (selectedTeam !== 'all') params.set('teamId', selectedTeam)
            if (searchQuery) params.set('query', searchQuery)

            const res = await fetch(`/api/evaluations/batch/completion?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch data')

            const data = await res.json()
            setEmployees(data)

            // Initialize editedValues with current values
            const initialValues: Record<string, string> = {}
            data.forEach((emp: any) => {
                // If value is 0, show empty string for easier input? Or keeping 0 is fine.
                // Let's keep 0 if it exists.
                initialValues[emp.id] = String(emp.completionAchieved || 0)
            })
            setEditedValues(initialValues)

        } catch (error) {
            toast({
                title: "エラー",
                description: "データの取得に失敗しました",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    // Trigger fetch on filter change
    useEffect(() => {
        fetchData()
    }, [date, selectedTeam]) // searchQuery is triggered manually or by debounce if needed. Let's do manual enter or blur for now, or use debounce? 
    // Just dependency on date/team for now, search query on blur/enter or easy implementation: add search button or effect.
    // Let's add effect for searchQuery with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData()
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])


    const handleValueChange = (id: string, value: string) => {
        // Allow numbers only or empty
        if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
            setEditedValues(prev => ({ ...prev, [id]: value }))
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Prepare payload
            const items = Object.entries(editedValues).map(([id, val]) => ({
                employeeId: id,
                amount: val === '' ? 0 : Number(val)
            }))

            const res = await fetch('/api/evaluations/batch/completion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    items
                })
            })

            if (!res.ok) throw new Error('Update failed')

            toast({
                title: "保存完了",
                description: `${items.length}件のデータを更新しました`,
                className: "bg-emerald-500 text-white"
            })

            // Refresh data to be sure
            fetchData()

        } catch (error) {
            toast({
                title: "エラー",
                description: "保存に失敗しました",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    // Keyboard navigation helper
    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const nextInput = document.getElementById(`input-${index + 1}`)
            if (nextInput) {
                (nextInput as HTMLInputElement).focus()
            }
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/evaluations')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">完工実績一括入力</h1>
                        <p className="text-slate-500 text-sm">対象月の実績金額を一括で登録できます（数字目標ONの社員のみ）</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        一括保存
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                            {/* Date Filter */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">対象年月（必須）</label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-[180px]"
                                    />
                                </div>
                            </div>

                            {/* Team Filter */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">チーム</label>
                                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="全チーム" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">全チーム</SelectItem>
                                        {teams.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search */}
                            <div className="space-y-1 flex-1 md:flex-none">
                                <label className="text-xs font-medium text-slate-500">社員検索</label>
                                <div className="relative w-full md:w-[240px]">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="名前を入力..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-slate-500">
                            対象: <span className="font-bold text-slate-900">{employees.length}</span> 名
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-[80px]">No.</TableHead>
                                    <TableHead className="w-[150px]">氏名</TableHead>
                                    <TableHead className="w-[150px]">所属チーム</TableHead>
                                    <TableHead className="w-[120px] text-right">目標額</TableHead>
                                    <TableHead className="w-[200px]">完工実績金額 (千円)</TableHead>
                                    <TableHead>状態</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            対象の社員が見つかりません
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((emp, index) => (
                                        <TableRow key={emp.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs text-slate-500">
                                                {String(index + 1).padStart(2, '0')}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {emp.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal text-slate-600">
                                                    {emp.teamName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500">
                                                ¥{emp.completionTarget.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative max-w-[160px]">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">¥</span>
                                                    <Input
                                                        id={`input-${index}`}
                                                        value={editedValues[emp.id] || ''}
                                                        onChange={(e) => handleValueChange(emp.id, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                                        className="pl-7 pr-2 text-right font-bold h-9"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {(editedValues[emp.id] === '' || Number(editedValues[emp.id]) === 0) ? (
                                                    <span className="text-slate-300 text-xs">-</span>
                                                ) : (
                                                    <div className="flex items-center text-emerald-600 text-xs font-bold animate-in fade-in">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        入力済
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
