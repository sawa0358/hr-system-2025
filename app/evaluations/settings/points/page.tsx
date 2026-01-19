
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Heart, Info, Trophy, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function PointSettingsPage() {
    const { currentUser } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState({
        thankYouSendPoints: 5,
        thankYouReceivePoints: 10,
        thankYouDailyLimit: 50
    })

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/evaluations/settings/config')
                if (res.ok) {
                    const data = await res.json()
                    setConfig({
                        thankYouSendPoints: data.thankYouSendPoints ?? 5,
                        thankYouReceivePoints: data.thankYouReceivePoints ?? 10,
                        thankYouDailyLimit: data.thankYouDailyLimit ?? 50
                    })
                }
            } catch (error) {
                console.error("Failed to fetch config:", error)
                toast.error("設定の読み込みに失敗しました")
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            // 個別に保存
            const keys = Object.keys(config) as Array<keyof typeof config>
            for (const key of keys) {
                await fetch('/api/evaluations/settings/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-employee-id': currentUser?.id || ''
                    },
                    body: JSON.stringify({
                        key,
                        value: config[key].toString()
                    })
                })
            }
            toast.success("設定を保存しました")
        } catch (error) {
            console.error("Save error:", error)
            toast.error("保存に失敗しました")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">読み込み中...</div>

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/evaluations">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">ありがとう設定</h1>
                            <p className="text-sm text-slate-500">ありがとう機能の獲得ポイントを管理します</p>
                        </div>
                    </div>
                </header>

                <Card className="border-pink-100 shadow-md">
                    <CardHeader className="bg-pink-50/50 border-b border-pink-100">
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                            <CardTitle className="text-lg text-pink-900">ありがとう設定</CardTitle>
                        </div>
                        <CardDescription>
                            メッセージの送受信時に付与されるポイントを設定します
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="sendPoints" className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    送信時の獲得ポイント
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="sendPoints"
                                        type="number"
                                        value={config.thankYouSendPoints}
                                        onChange={e => setConfig({ ...config, thankYouSendPoints: parseInt(e.target.value) || 0 })}
                                        className="max-w-[120px] text-lg font-bold text-center"
                                    />
                                    <span className="text-slate-600 font-medium">pt</span>
                                </div>
                                <p className="text-xs text-slate-400 italic">「ありがとう」を送った人に即時付与されます</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="receivePoints" className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-emerald-500" />
                                    受信時の獲得ポイント
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="receivePoints"
                                        type="number"
                                        value={config.thankYouReceivePoints}
                                        onChange={e => setConfig({ ...config, thankYouReceivePoints: parseInt(e.target.value) || 0 })}
                                        className="max-w-[120px] text-lg font-bold text-center"
                                    />
                                    <span className="text-slate-600 font-medium">pt</span>
                                </div>
                                <p className="text-xs text-slate-400 italic">「ありがとう」を受け取った人に即時付与されます</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dailyLimit" className="flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                                    1日の獲得上限
                                </Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        id="dailyLimit"
                                        type="number"
                                        value={config.thankYouDailyLimit}
                                        onChange={e => setConfig({ ...config, thankYouDailyLimit: parseInt(e.target.value) || 0 })}
                                        className="max-w-[120px] text-lg font-bold text-center border-rose-100"
                                    />
                                    <span className="text-slate-600 font-medium">pt</span>
                                </div>
                                <p className="text-xs text-slate-400 italic">無分なポイント獲得を防ぐための1日の合計上限です</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 mt-4">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-700 space-y-1">
                                <p className="font-bold">運用のアドバイス：</p>
                                <p>・送信ptを少し低めに、受信ptを高めに設定すると「感謝される行動」をより促せます。</p>
                                <p>・上限設定により、特定のペアでの過剰なやりとりを制御できます。</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 hover:bg-slate-800 text-white gap-2 px-8"
                    >
                        {saving ? "保存中..." : (
                            <>
                                <Save className="w-4 h-4" />
                                設定を保存
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
