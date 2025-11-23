'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Coins, Settings, Save, X } from 'lucide-react'
import { Reward, Worker, RewardPreset } from '@/lib/workclock/types'
import {
  getRewardsByWorkerAndMonth,
  addReward,
  deleteReward,
  getRewardPresets,
  addRewardPreset,
  deleteRewardPreset,
} from '@/lib/workclock/api-storage'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface RewardManagerModalProps {
  worker: Worker
  month: Date
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function RewardManagerModal({
  worker,
  month,
  isOpen,
  onClose,
  onUpdate,
}: RewardManagerModalProps) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [presets, setPresets] = useState<RewardPreset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("current")

  // Form state for new reward
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('') // YYYY-MM-DD

  // Form state for new preset
  const [presetAmount, setPresetAmount] = useState('')
  const [presetDescription, setPresetDescription] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadData()
      // デフォルト日付を今月の1日に設定、または今日が今月なら今日
      const now = new Date()
      if (now.getMonth() === month.getMonth() && now.getFullYear() === month.getFullYear()) {
        setDate(formatDate(now))
      } else {
        // 月初にする
        const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
        setDate(formatDate(firstDay))
      }
    }
  }, [isOpen, month, worker.id])

  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${m}-${day}`
  }

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [rewardsData, presetsData] = await Promise.all([
        getRewardsByWorkerAndMonth(worker.id, month.getFullYear(), month.getMonth() + 1),
        getRewardPresets(worker.id)
      ])
      setRewards(rewardsData)
      setPresets(presetsData)
    } catch (error) {
      console.error(error)
      toast.error('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !description || !date) return

    try {
      setIsLoading(true)
      await addReward({
        workerId: worker.id,
        amount: parseInt(amount),
        description,
        date: date,
      })
      
      setAmount('')
      setDescription('')
      toast.success('特別報酬を追加しました')
      
      // 更新
      const rewardsData = await getRewardsByWorkerAndMonth(
        worker.id,
        month.getFullYear(),
        month.getMonth() + 1
      )
      setRewards(rewardsData)
      onUpdate?.()
    } catch (error) {
      console.error(error)
      toast.error('追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteReward = async (id: string) => {
    if (!confirm('この報酬を削除してもよろしいですか？')) return

    try {
      setIsLoading(true)
      await deleteReward(id)
      toast.success('削除しました')
      
      // 更新
      const rewardsData = await getRewardsByWorkerAndMonth(
        worker.id,
        month.getFullYear(),
        month.getMonth() + 1
      )
      setRewards(rewardsData)
      onUpdate?.()
    } catch (error) {
      console.error(error)
      toast.error('削除に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!presetAmount || !presetDescription) return

    try {
      setIsLoading(true)
      await addRewardPreset({
        workerId: worker.id,
        amount: parseInt(presetAmount),
        description: presetDescription,
      })

      setPresetAmount('')
      setPresetDescription('')
      toast.success('固定項目プリセットを追加しました')
      
      const presetsData = await getRewardPresets(worker.id)
      setPresets(presetsData)
    } catch (error) {
      console.error(error)
      toast.error('プリセットの追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePreset = async (id: string) => {
      if(!confirm('このプリセットを削除してもよろしいですか？')) return

      try {
          setIsLoading(true)
          await deleteRewardPreset(id)
          toast.success('プリセットを削除しました')

          const presetsData = await getRewardPresets(worker.id)
          setPresets(presetsData)
      } catch (error) {
          console.error(error)
          toast.error('削除に失敗しました')
      } finally {
          setIsLoading(false)
      }
  }

  const handleApplyPreset = async (preset: RewardPreset) => {
      if (!confirm(`「${preset.description}」(¥${preset.amount.toLocaleString()}) を今月の報酬に追加しますか？`)) return

      try {
          setIsLoading(true)
          // デフォルト日付（基本は月初または今日）
          await addReward({
              workerId: worker.id,
              amount: preset.amount,
              description: preset.description,
              date: date // 現在選択されている日付を使用
          })

          toast.success('固定項目を反映しました')
          
          const rewardsData = await getRewardsByWorkerAndMonth(
              worker.id,
              month.getFullYear(),
              month.getMonth() + 1
          )
          setRewards(rewardsData)
          onUpdate?.()
          
          // タブを切り替え
          setActiveTab("current")
      } catch (error) {
          console.error(error)
          toast.error('反映に失敗しました')
      } finally {
          setIsLoading(false)
      }
  }
  
  const handleApplyAllPresets = async () => {
      if (presets.length === 0) return
      if (!confirm(`${presets.length}件の固定項目をすべて今月の報酬に追加しますか？`)) return
      
      try {
          setIsLoading(true)
          
          // 並列で実行
          await Promise.all(presets.map(preset => 
             addReward({
                 workerId: worker.id,
                 amount: preset.amount,
                 description: preset.description,
                 date: date
             })
          ))
          
          toast.success('すべての固定項目を反映しました')
          
          const rewardsData = await getRewardsByWorkerAndMonth(
              worker.id,
              month.getFullYear(),
              month.getMonth() + 1
          )
          setRewards(rewardsData)
          onUpdate?.()
          
          setActiveTab("current")
      } catch (error) {
          console.error(error)
          toast.error('一括反映に失敗しました')
      } finally {
          setIsLoading(false)
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              特別報酬・経費の管理
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">今月の報酬一覧</TabsTrigger>
                <TabsTrigger value="presets">固定項目設定</TabsTrigger>
            </TabsList>
            
            {/* 今月の報酬タブ */}
            <TabsContent value="current" className="flex-1 flex flex-col gap-4 overflow-hidden pt-4">
                <div className="space-y-4 border-b pb-4 shrink-0">
                    <div className="text-sm text-muted-foreground">
                        新しい報酬・経費を追加します。固定項目タブからよく使う項目を呼び出すこともできます。
                    </div>
                    <form onSubmit={handleAddReward} className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">日付</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount">金額</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="例: 5000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">説明</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="description"
                                    placeholder="例: ボーナス、交通費調整など"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                                <Button type="submit" disabled={isLoading}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-2">
                        {rewards.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8 flex flex-col items-center gap-2">
                                <p>登録された報酬はありません</p>
                                {presets.length > 0 && (
                                    <Button variant="link" onClick={() => setActiveTab("presets")} className="text-primary">
                                        固定項目から追加する
                                    </Button>
                                )}
                            </div>
                        ) : (
                            rewards.map((reward) => (
                                <div key={reward.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border group">
                                    <div className="min-w-0 flex-1 mr-4">
                                        <div className="text-sm font-medium truncate">{reward.description}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(reward.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-sm">¥{reward.amount.toLocaleString()}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteReward(reward.id)}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="pt-2 border-t flex justify-between items-center shrink-0">
                    <span className="font-semibold text-sm">合計</span>
                    <span className="font-bold text-lg">
                        ¥{rewards.reduce((acc, r) => acc + r.amount, 0).toLocaleString()}
                    </span>
                </div>
            </TabsContent>

            {/* 固定項目プリセットタブ */}
            <TabsContent value="presets" className="flex-1 flex flex-col gap-4 overflow-hidden pt-4">
                <div className="space-y-4 border-b pb-4 shrink-0">
                    <div className="text-sm text-muted-foreground">
                        毎月発生する交通費などの固定項目を登録しておくと、簡単に呼び出すことができます。
                    </div>
                    <form onSubmit={handleAddPreset} className="grid gap-4">
                        <div className="grid grid-cols-[1fr,120px,auto] gap-2 items-end">
                            <div className="grid gap-2">
                                <Label htmlFor="p-desc">項目名</Label>
                                <Input
                                    id="p-desc"
                                    placeholder="例: 通勤交通費"
                                    value={presetDescription}
                                    onChange={(e) => setPresetDescription(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="p-amount">金額</Label>
                                <Input
                                    id="p-amount"
                                    type="number"
                                    placeholder="金額"
                                    value={presetAmount}
                                    onChange={(e) => setPresetAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                <Save className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {presets.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            固定項目は登録されていません
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex justify-end mb-2">
                                <Button variant="outline" size="sm" onClick={handleApplyAllPresets} className="text-xs">
                                    すべて今月に追加
                                </Button>
                            </div>
                            {presets.map((preset) => (
                                <div key={preset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border group">
                                    <div className="min-w-0 flex-1 mr-4">
                                        <div className="text-sm font-medium truncate">{preset.description}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-sm mr-2">¥{preset.amount.toLocaleString()}</span>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => handleApplyPreset(preset)}
                                            disabled={isLoading}
                                        >
                                            反映
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeletePreset(preset.id)}
                                            disabled={isLoading}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

