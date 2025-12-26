
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Camera, CheckCircle2, AlertCircle, Sparkles, Coins, ClipboardList, Image as ImageIcon, MessageSquare, Loader2, Plus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/workclock/api'
import { ChecklistItem, Worker } from '@/lib/workclock/types'

interface ChecklistPanelProps {
    worker?: Worker | null
    workerId: string
    selectedDate: Date
    onRewardChange?: (reward: number) => void
    onStateChange?: (state: { checkedItems: Record<string, boolean>; freeTextValues: Record<string, string>; memo: string; photoUrl: string; photos: string[]; items: ChecklistItem[] }) => void
    readOnly?: boolean
}

export function ChecklistPanel({ worker, workerId, selectedDate, onRewardChange, onStateChange, readOnly = false }: ChecklistPanelProps) {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
    const [freeTextValues, setFreeTextValues] = useState<Record<string, string>>({})
    const [reportText, setReportText] = useState('')
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [photos, setPhotos] = useState<string[]>([])
    const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const rewardRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const photoRef = useRef<HTMLDivElement>(null)

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

    const notifyParent = (
        currentCheckedItems: Record<string, boolean>,
        currentFreeTextValues: Record<string, string>,
        currentMemo: string,
        currentPhotos: string[],
        currentItems: ChecklistItem[]
    ) => {
        const legacyPhotoUrl = currentPhotos.length > 0 ? currentPhotos[0] : ''
        onStateChange?.({
            checkedItems: currentCheckedItems,
            freeTextValues: currentFreeTextValues,
            memo: currentMemo,
            photoUrl: legacyPhotoUrl,
            photos: currentPhotos,
            items: currentItems
        })
    }

    useEffect(() => {
        const loadData = async () => {
            if (!worker?.isChecklistEnabled || !worker?.checklistPatternId) {
                setChecklistItems([])
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)

                const patternRes = await api.checklist.patterns.getById(worker.checklistPatternId) as { pattern: any }
                let items: ChecklistItem[] = []
                if (patternRes.pattern?.items) {
                    items = patternRes.pattern.items.sort((a: ChecklistItem, b: ChecklistItem) => a.position - b.position)
                    setChecklistItems(items)
                }

                const submissionRes = await api.checklist.submissions.getAll({
                    workerId,
                    startDate: dateStr,
                    endDate: dateStr,
                }) as { submissions: any[] }

                if (submissionRes.submissions && submissionRes.submissions.length > 0) {
                    const submission = submissionRes.submissions[0]
                    setExistingSubmissionId(submission.id)
                    setReportText(submission.memo || '')

                    let loadedPhotos: string[] = []
                    if (submission.photos && Array.isArray(submission.photos)) {
                        loadedPhotos = submission.photos.map((p: any) => p.url)
                    } else if (submission.photoUrl) {
                        loadedPhotos = [submission.photoUrl]
                    }
                    setPhotos(loadedPhotos)

                    const updatedCheckedItems: Record<string, boolean> = {}
                    const updatedFreeTextValues: Record<string, string> = {}
                    if (submission.items && Array.isArray(submission.items)) {
                        submission.items.forEach((subItem: any) => {
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

                    const totalReward = items.reduce((total, item) => {
                        if (item.isFreeText) {
                            return total + (updatedFreeTextValues[item.id]?.trim() ? item.reward : 0)
                        }
                        return total + (updatedCheckedItems[item.id] ? item.reward : 0)
                    }, 0)

                    setTimeout(() => {
                        onRewardChange?.(totalReward)
                        notifyParent(updatedCheckedItems, updatedFreeTextValues, submission.memo || '', loadedPhotos, items)
                    }, 0)
                } else {
                    setTimeout(() => {
                        notifyParent({}, {}, '', [], items)
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
        if (readOnly) return

        setCheckedItems(prev => {
            const newState = {
                ...prev,
                [id]: !prev[id]
            }
            const newTotal = checklistItems.reduce((total, item) => {
                if (item.isFreeText) {
                    return total + (freeTextValues[item.id]?.trim() ? item.reward : 0)
                }
                return total + (newState[item.id] ? item.reward : 0)
            }, 0)
            setTimeout(() => {
                onRewardChange?.(newTotal)
                notifyParent(newState, freeTextValues, reportText, photos, checklistItems)
            }, 0)
            return newState
        })
    }

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        try {
            setIsUploading(true)
            const newPhotoUrls: string[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (!file.type.startsWith('image/')) continue

                const compressed = await compressImage(file)
                const formData = new FormData()
                formData.append('file', compressed, file.name)

                const res = await fetch('/api/workclock/checklist/upload', {
                    method: 'POST',
                    body: formData
                })

                if (!res.ok) throw new Error(`Upload failed for ${file.name}`)

                const data = await res.json()
                if (data.url) {
                    newPhotoUrls.push(data.url)
                }
            }

            if (newPhotoUrls.length > 0) {
                setPhotos(prev => {
                    const nextPhotos = [...prev, ...newPhotoUrls]
                    notifyParent(checkedItems, freeTextValues, reportText, nextPhotos, checklistItems)
                    return nextPhotos
                })
            }
        } catch (error) {
            console.error('Photo upload error:', error)
            alert('画像のアップロードに失敗しました')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDeletePhoto = (index: number) => {
        if (!confirm('この写真を削除してもよろしいですか？')) return

        setPhotos(prev => {
            const nextPhotos = prev.filter((_, i) => i !== index)
            notifyParent(checkedItems, freeTextValues, reportText, nextPhotos, checklistItems)
            return nextPhotos
        })
    }

    const handleDownloadPhoto = (url: string) => {
        const link = document.createElement('a')
        link.href = url
        link.download = url.split('/').pop() || 'photo.jpg'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
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
                    const MAX_WIDTH = 1200
                    const MAX_HEIGHT = 1200
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
                    }, 'image/jpeg', 0.8)
                }
            }
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleUpload(e.target.files)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        handleUpload(e.dataTransfer.files)
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
                                {readOnly && (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[9px] bg-slate-100 text-slate-500 border-slate-200 font-bold">
                                        <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> 編集不可
                                    </Badge>
                                )}
                                {!readOnly && (
                                    isAllMandatoryChecked ? (
                                        <Badge variant="outline" className="h-5 px-1.5 text-[9px] bg-green-50 text-green-600 border-green-200 font-bold">
                                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> 必須完了
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="h-5 px-1.5 text-[9px] font-bold animate-pulse">
                                            未完了 ({pendingMandatoryItems.length})
                                        </Badge>
                                    )
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
                                    item.isDescription ? (
                                        <div key={item.id} className="px-3 py-2 transition-colors" style={{ backgroundColor: '#e2edf0' }}>
                                            <div className="flex items-center gap-2">
                                                <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                                <p className="text-[11px] text-slate-700 leading-relaxed">{item.title}</p>
                                            </div>
                                        </div>
                                    ) : item.isFreeText ? (
                                        <div key={item.id} className={cn("group flex flex-col px-3 py-2 transition-colors relative", readOnly ? "bg-slate-50 cursor-not-allowed" : "bg-purple-50/30 hover:bg-purple-50/50")}>
                                            <div className={cn("absolute left-0 top-0 bottom-0 w-0.5", readOnly ? "bg-slate-300" : "bg-purple-400")} />
                                            <div className="flex items-center justify-between mb-1.5">
                                                <Label htmlFor={`freetext-${item.id}`} className={cn("text-[11px] font-bold flex items-center gap-1", readOnly ? "text-slate-500" : "text-purple-700")}>
                                                    <MessageSquare className="w-3 h-3" />
                                                    {item.title}
                                                </Label>
                                                {item.reward > 0 && <span className={cn("font-mono text-[9px] font-bold", readOnly ? "text-slate-400" : "text-purple-600")}>+¥{item.reward}</span>}
                                            </div>
                                            <Textarea
                                                id={`freetext-${item.id}`}
                                                value={freeTextValues[item.id] || ''}
                                                onChange={(e) => {
                                                    if (readOnly) return
                                                    const newValues = { ...freeTextValues, [item.id]: e.target.value }
                                                    setFreeTextValues(newValues)
                                                    const newTotal = checklistItems.reduce((total, it) => {
                                                        if (it.isFreeText) return total + (newValues[it.id]?.trim() ? it.reward : 0)
                                                        return total + (checkedItems[it.id] ? it.reward : 0)
                                                    }, 0)
                                                    setTimeout(() => {
                                                        onRewardChange?.(newTotal)
                                                        notifyParent(checkedItems, newValues, reportText, photos, checklistItems)
                                                    }, 0)
                                                }}
                                                placeholder={readOnly ? "入力済み" : "入力してください..."}
                                                disabled={readOnly}
                                                className={cn("text-xs bg-white min-h-[60px] max-h-[150px] resize-y overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-purple-200", readOnly ? "border-slate-200 text-slate-500 resize-none" : "border-purple-200 focus:border-purple-400")}
                                            />
                                        </div>
                                    ) : (
                                        <div key={item.id} onClick={() => !readOnly && handleToggle(item.id)} className={cn(
                                            "group flex items-center px-3 py-1.5 min-h-[36px] transition-colors duration-75 relative",
                                            readOnly ? "cursor-default opacity-80" : "cursor-pointer",
                                            checkedItems[item.id] ? (readOnly ? "bg-slate-50" : "bg-blue-50/40") : "bg-white",
                                            !readOnly && !checkedItems[item.id] && "hover:bg-slate-50/50",
                                            !readOnly && item.isMandatory && !checkedItems[item.id] && "bg-red-50/10"
                                        )}>
                                            {item.isMandatory && <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 transition-colors", checkedItems[item.id] ? (readOnly ? "bg-slate-400" : "bg-green-400") : (readOnly ? "bg-slate-300" : "bg-red-400"))} />}
                                            <div className="w-10 flex justify-center mr-2" onClick={(e) => !readOnly && e.stopPropagation()}>
                                                <Switch id={`item-${item.id}`} checked={!!checkedItems[item.id]} onCheckedChange={() => !readOnly && handleToggle(item.id)} disabled={readOnly} className={cn("scale-[0.65]", !readOnly && "data-[state=checked]:bg-green-500")} />
                                            </div>
                                            <div className="flex-1 py-0.5">
                                                <Label htmlFor={`item-${item.id}`} className={cn("text-[11px] font-medium leading-tight block transition-all", checkedItems[item.id] ? "text-slate-400 line-through" : (readOnly ? "text-slate-500" : "text-slate-600"))}>{item.title}</Label>
                                                {item.isMandatory && !checkedItems[item.id] && !readOnly && <span className="inline-flex items-center text-[8px] font-bold text-red-400 mt-0.5"><AlertCircle className="w-2 h-2 mr-0.5" /> 必須項目</span>}
                                            </div>
                                            <div className="w-16 text-right">
                                                {item.reward > 0 ? <span className={cn("font-mono text-[9px] font-bold", checkedItems[item.id] ? (readOnly ? "text-slate-500" : "text-yellow-600") : "text-slate-300")}>+¥{item.reward}</span> : <span className="text-[9px] text-slate-200 font-mono">-</span>}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </Card>
                    </section>

                    <section ref={photoRef} className="scroll-mt-16 space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4 text-green-600" /> 報告用写真
                            </h3>
                            <span className="text-[10px] text-slate-400">{photos.length}枚 アップロード済み</span>
                        </div>
                        <Card className={cn("overflow-hidden border-slate-200 shadow-sm rounded-lg bg-white transition-all p-3", isUploading && "opacity-50 pointer-events-none")} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {/* アップロードボタン */}
                                <div
                                    className="aspect-square bg-slate-50 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-all group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="bg-white p-2.5 rounded-full mb-2 shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                                        {isUploading ? <Loader2 className="w-5 h-5 text-green-500 animate-spin" /> : <Plus className="w-5 h-5 text-slate-400 group-hover:text-green-500" />}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500">写真を追加</p>
                                </div>

                                {/* 写真一覧 */}
                                {photos.map((url, index) => (
                                    <div key={url} className="relative aspect-square group bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                        <img src={url} alt={`Report ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />

                                        {/* オーバーレイアクション */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-7 text-[10px] bg-white/90 hover:bg-white text-slate-700"
                                                onClick={() => handleDownloadPhoto(url)}
                                            >
                                                保存
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-7 text-[10px] bg-red-500/90 hover:bg-red-600 text-white"
                                                onClick={() => handleDeletePhoto(index)}
                                            >
                                                削除
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {photos.length === 0 && !isUploading && (
                                <div className="mt-4 text-center py-4 border-t border-slate-100">
                                    <p className="text-[11px] text-slate-400 italic">まだ写真がありません</p>
                                </div>
                            )}
                        </Card>
                    </section>
                </div>
            </div>
        </div>
    )
}
