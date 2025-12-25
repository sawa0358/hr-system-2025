
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Camera, CheckCircle2, AlertCircle, Sparkles, Coins, ClipboardList, Image as ImageIcon, MessageSquare, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/workclock/api'
import { ChecklistItem, Worker } from '@/lib/workclock/types'

interface ChecklistPanelProps {
    worker?: Worker | null
    workerId: string
    selectedDate: Date
    onRewardChange?: (reward: number) => void
    onStateChange?: (state: { checkedItems: Record<string, boolean>; freeTextValues: Record<string, string>; memo: string; photoUrl: string; items: ChecklistItem[] }) => void
}

export function ChecklistPanel({ worker, workerId, selectedDate, onRewardChange, onStateChange }: ChecklistPanelProps) {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
    const [freeTextValues, setFreeTextValues] = useState<Record<string, string>>({})  // 自由記入欄の値
    const [reportText, setReportText] = useState('')
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [photoUrl, setPhotoUrl] = useState('')
    const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const rewardRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const photoRef = useRef<HTMLDivElement>(null)
    const memoRef = useRef<HTMLDivElement>(null)

    // 日付文字列を生成
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

    // チェックリストパターンを読み込み、既存の提出データも取得
    useEffect(() => {
        const loadData = async () => {
            if (!worker?.isChecklistEnabled || !worker?.checklistPatternId) {
                setChecklistItems([])
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)

                // パターンのアイテムを取得
                const patternRes = await api.checklist.patterns.getById(worker.checklistPatternId) as { pattern: any }
                let items: ChecklistItem[] = []
                if (patternRes.pattern?.items) {
                    items = patternRes.pattern.items.sort((a: ChecklistItem, b: ChecklistItem) => a.position - b.position)
                    setChecklistItems(items)
                }

                // 既存の提出データを取得
                const submissionRes = await api.checklist.submissions.getAll({
                    workerId,
                    startDate: dateStr,
                    endDate: dateStr,
                }) as { submissions: any[] }

                if (submissionRes.submissions && submissionRes.submissions.length > 0) {
                    const submission = submissionRes.submissions[0]
                    setExistingSubmissionId(submission.id)
                    setReportText(submission.memo || '')
                    setPhotoUrl(submission.photoUrl || '')

                    // チェック済み項目と自由記入欄の値を復元
                    const updatedCheckedItems: Record<string, boolean> = {}
                    const updatedFreeTextValues: Record<string, string> = {}
                    if (submission.items && Array.isArray(submission.items)) {
                        submission.items.forEach((subItem: any) => {
                            // タイトルでマッチング（前後の空白を除去して比較）
                            const subTitle = subItem.title?.trim()
                            const matchingItem = items.find(i => i.title?.trim() === subTitle)

                            if (matchingItem) {
                                if (subItem.isFreeText) {
                                    updatedFreeTextValues[matchingItem.id] = subItem.freeTextValue || ''
                                } else if (subItem.isChecked) {
                                    updatedCheckedItems[matchingItem.id] = true
                                }
                            }
                        })
                    }

                    setCheckedItems(updatedCheckedItems)
                    setFreeTextValues(updatedFreeTextValues)

                    // 報酬を再計算
                    const totalReward = items.reduce((total, item) => {
                        if (item.isFreeText) {
                            return total + (updatedFreeTextValues[item.id]?.trim() ? item.reward : 0)
                        }
                        return total + (updatedCheckedItems[item.id] ? item.reward : 0)
                    }, 0)

                    // 親に通知
                    setTimeout(() => {
                        onRewardChange?.(totalReward)
                        onStateChange?.({ checkedItems: updatedCheckedItems, freeTextValues: updatedFreeTextValues, memo: submission.memo || '', photoUrl: submission.photoUrl || '', items })
                    }, 0)
                } else {
                    // 初期状態を親に通知
                    setTimeout(() => {
                        onStateChange?.({ checkedItems: {}, freeTextValues: {}, memo: '', photoUrl: '', items })
                    }, 0)
                }
            } catch (error) {
                console.error('チェックリストデータの読み込みに失敗:', error)
                setChecklistItems([])
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [worker?.checklistPatternId, worker?.isChecklistEnabled, workerId, dateStr])

    const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const handleToggle = (id: string) => {
        setCheckedItems(prev => {
            const newState = {
                ...prev,
                [id]: !prev[id]
            }
            // 報酬合計を再計算
            const newTotal = checklistItems.reduce((total, item) => {
                if (item.isFreeText) {
                    return total + (freeTextValues[item.id]?.trim() ? item.reward : 0)
                }
                return total + (newState[item.id] ? item.reward : 0)
            }, 0)
            setTimeout(() => {
                onRewardChange?.(newTotal)
                onStateChange?.({ checkedItems: newState, freeTextValues, memo: reportText, photoUrl, items: checklistItems })
            }, 0)
            return newState
        })
    }

    // 画像圧縮とアップロード
    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) return

        try {
            setIsUploading(true)

            // 1. 画像圧縮 (Canvasを使用)
            const compressed = await compressImage(file)

            // 2. アップロード
            const formData = new FormData()
            formData.append('file', compressed, file.name)

            const res = await fetch('/api/workclock/checklist/upload', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error('Upload failed')

            const data = await res.json()
            if (data.url) {
                setPhotoUrl(data.url)
                onStateChange?.({ checkedItems, freeTextValues, memo: reportText, photoUrl: data.url, items: checklistItems })
            }
        } catch (error) {
            console.error('Photo upload error:', error)
            alert('画像のアップロードに失敗しました')
        } finally {
            setIsUploading(false)
        }
    }

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (e) => {
                const img = new Image()
                img.src = e.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 1024
                    const MAX_HEIGHT = 1024
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    canvas.toBlob((blob) => {
                        resolve(blob || file)
                    }, 'image/jpeg', 0.7) // 品質を0.7に設定して軽量化
                }
            }
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) handleUpload(file)
    }

    // メモ変更時も親に通知
    const handleMemoChange = (text: string) => {
        setReportText(text)
        setTimeout(() => {
            onStateChange?.({ checkedItems, freeTextValues, memo: text, photoUrl, items: checklistItems })
        }, 0)
    }

    const currentRewardTotal = checklistItems.reduce((total, item) => {
        if (item.isFreeText) {
            return total + (freeTextValues[item.id]?.trim() ? item.reward : 0)
        }
        return total + (checkedItems[item.id] ? item.reward : 0)
    }, 0)

    const pendingMandatoryItems = checklistItems.filter(item => item.isMandatory && !checkedItems[item.id])
    const isAllMandatoryChecked = pendingMandatoryItems.length === 0

    if (!worker?.isChecklistEnabled) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <ClipboardList className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-slate-400 mb-2">業務チェックリストは無効です</h3>
                <p className="text-sm text-slate-300">このワーカーには業務チェックリストが設定されていません。</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-sm text-slate-500">チェックリストを読み込み中...</p>
            </div>
        )
    }

    if (checklistItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-2">チェックリスト項目がありません</h3>
                <p className="text-sm text-slate-400">チェックリスト設定ページで項目を追加してください。</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50 min-h-0">

            <div className="sticky top-0 z-20 flex items-center gap-1.5 p-2 bg-white/90 backdrop-blur-md border-b shadow-sm px-4">
                <Button variant="ghost" size="sm" onClick={() => scrollToSection(rewardRef)} className="h-7 px-2 text-[10px] md:text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-100 rounded-md">
                    <Coins className="w-3 h-3 mr-1" /> 本日の獲得
                </Button>
                <Button variant="ghost" size="sm" onClick={() => scrollToSection(listRef)} className="h-7 px-2 text-[10px] md:text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-md">
                    <ClipboardList className="w-3 h-3 mr-1" /> 業務チェック
                </Button>
                <Button variant="ghost" size="sm" onClick={() => scrollToSection(photoRef)} className="h-7 px-2 text-[10px] md:text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-100 rounded-md">
                    <ImageIcon className="w-3 h-3 mr-1" /> 報告用写真
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
                <div className="py-4 space-y-6 max-w-4xl mx-auto pb-16">

                    <section ref={rewardRef} className="scroll-mt-16">
                        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-gradient-to-r from-yellow-50 to-white border border-yellow-200 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-sm font-bold text-yellow-900 flex items-center gap-1.5">
                                    <Coins className="w-4 h-4" /> 本日の獲得予定寸志
                                </h3>
                                <p className="text-[10px] text-yellow-700/70">全ての業務を完了してボーナスを獲得</p>
                            </div>
                            <div className="relative z-10">
                                <div className={cn(
                                    "px-4 py-1.5 rounded-lg font-mono text-xl font-black transition-all duration-300",
                                    currentRewardTotal > 0 ? "bg-white text-yellow-600 border border-yellow-300 shadow-sm" : "bg-slate-100 text-slate-400 border border-slate-200"
                                )}>
                                    <span className="text-xs mr-0.5">¥</span>{currentRewardTotal.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section ref={listRef} className="scroll-mt-16 space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-800">業務チェック項目</h3>
                                {isAllMandatoryChecked ? (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[9px] bg-green-50 text-green-600 border-green-200 font-bold">
                                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> 必須完了
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="h-5 px-1.5 text-[9px] font-bold animate-pulse">
                                        未完了 ({pendingMandatoryItems.length})
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Card className="overflow-hidden border-slate-200 shadow-sm rounded-lg">
                            <div className="bg-slate-50/80 border-b px-3 py-1 flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                <div className="w-10 text-center mr-2">Status</div>
                                <div className="flex-1">Task Content</div>
                                <div className="w-16 text-right">Reward</div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {checklistItems.map(item => (
                                    item.isFreeText ? (
                                        <div key={item.id} className="group flex flex-col px-3 py-2 bg-purple-50/30 hover:bg-purple-50/50 transition-colors relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-400" />
                                            <div className="flex items-center justify-between mb-1.5">
                                                <Label htmlFor={`freetext-${item.id}`} className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                                                    <MessageSquare className="w-3 h-3" />
                                                    {item.title}
                                                </Label>
                                                {item.reward > 0 && <span className="font-mono text-[9px] font-bold text-purple-600">+¥{item.reward}</span>}
                                            </div>
                                            <Input
                                                id={`freetext-${item.id}`}
                                                value={freeTextValues[item.id] || ''}
                                                onChange={(e) => {
                                                    const newValues = { ...freeTextValues, [item.id]: e.target.value }
                                                    setFreeTextValues(newValues)
                                                    const newTotal = checklistItems.reduce((total, it) => {
                                                        if (it.isFreeText) return total + (newValues[it.id]?.trim() ? it.reward : 0)
                                                        return total + (checkedItems[it.id] ? it.reward : 0)
                                                    }, 0)
                                                    setTimeout(() => {
                                                        onRewardChange?.(newTotal)
                                                        onStateChange?.({ checkedItems, freeTextValues: newValues, memo: reportText, photoUrl, items: checklistItems })
                                                    }, 0)
                                                }}
                                                placeholder="入力してください..."
                                                className="text-xs h-8 bg-white border-purple-200 focus:border-purple-400"
                                            />
                                        </div>
                                    ) : (
                                        <div key={item.id} onClick={() => handleToggle(item.id)} className={cn("group flex items-center px-3 py-1.5 min-h-[36px] cursor-pointer transition-colors duration-75 relative", checkedItems[item.id] ? "bg-blue-50/40" : "bg-white hover:bg-slate-50/50", item.isMandatory && !checkedItems[item.id] && "bg-red-50/10")}>
                                            {item.isMandatory && <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 transition-colors", checkedItems[item.id] ? "bg-green-400" : "bg-red-400")} />}
                                            <div className="w-10 flex justify-center mr-2" onClick={(e) => e.stopPropagation()}>
                                                <Switch id={`item-${item.id}`} checked={!!checkedItems[item.id]} onCheckedChange={() => handleToggle(item.id)} className="scale-[0.65] data-[state=checked]:bg-green-500" />
                                            </div>
                                            <div className="flex-1 py-0.5">
                                                <Label htmlFor={`item-${item.id}`} className={cn("text-[11px] font-medium leading-tight block transition-all", checkedItems[item.id] ? "text-slate-300 line-through" : "text-slate-600")}>{item.title}</Label>
                                                {item.isMandatory && !checkedItems[item.id] && <span className="inline-flex items-center text-[8px] font-bold text-red-400 mt-0.5"><AlertCircle className="w-2 h-2 mr-0.5" /> 必須項目</span>}
                                            </div>
                                            <div className="w-16 text-right">
                                                {item.reward > 0 ? <span className={cn("font-mono text-[9px] font-bold", checkedItems[item.id] ? "text-yellow-600" : "text-slate-300")}>+¥{item.reward}</span> : <span className="text-[9px] text-slate-200 font-mono">-</span>}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </Card>
                    </section>

                    <section ref={photoRef} className="scroll-mt-16 space-y-2">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 px-1">
                            <ImageIcon className="w-4 h-4 text-green-600" /> 報告用写真
                        </h3>
                        <Card className={cn("overflow-hidden border-slate-200 shadow-sm rounded-lg bg-white transition-all", isUploading && "opacity-50 pointer-events-none")} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-4 py-8 bg-slate-50/50 flex flex-col items-center justify-center border-r border-slate-100 cursor-pointer hover:bg-slate-100/80 transition-colors group" onClick={() => fileInputRef.current?.click()}>
                                    <div className="bg-white p-4 rounded-full mb-3 shadow-md border border-slate-100 group-hover:scale-110 transition-transform">
                                        {isUploading ? <Loader2 className="w-6 h-6 text-green-500 animate-spin" /> : <Camera className="w-6 h-6 text-slate-400 group-hover:text-green-500" />}
                                    </div>
                                    <p className="text-xs font-bold text-slate-600">{isUploading ? "アップロード中..." : "写真撮影 / アップロード"}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">タップしてカメラ起動・ドラッグ＆ドロップ可</p>
                                </div>
                                <div className="p-4 flex flex-col items-center justify-center min-h-[160px]">
                                    {photoUrl ? (
                                        <div className="relative group w-full h-full flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                                            <img src={photoUrl} alt="Report" className="max-w-full max-h-[140px] object-contain shadow-sm" />
                                            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setPhotoUrl(''); onStateChange?.({ checkedItems, freeTextValues, memo: reportText, photoUrl: '', items: checklistItems }) }}>
                                                <Plus className="w-3 h-3 rotate-45" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border border-dashed border-slate-200 rounded-lg p-6 w-full h-full flex flex-col items-center justify-center bg-slate-50/30">
                                            <ImageIcon className="w-10 h-10 text-slate-100 mb-2" />
                                            <p className="text-[11px] text-slate-400 italic font-medium">画像がありません</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </section>
                </div>
            </div>
        </div>
    )
}
