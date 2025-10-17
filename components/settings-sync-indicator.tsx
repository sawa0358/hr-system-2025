"use client"

import { useState } from 'react'
import { CheckCircle, AlertCircle, RefreshCw, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSettingsSync } from '@/hooks/use-settings-sync'

interface SettingsSyncIndicatorProps {
  className?: string
}

export function SettingsSyncIndicator({ className = "" }: SettingsSyncIndicatorProps) {
  const { isSyncing, lastSyncTime, syncError, syncSettings, clearError } = useSettingsSync()
  const [isExpanded, setIsExpanded] = useState(false)

  const formatLastSyncTime = (date: Date | null) => {
    if (!date) return '未同期'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) return 'たった今'
    if (diffMinutes < 60) return `${diffMinutes}分前`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}時間前`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}日前`
  }

  const getSyncStatus = () => {
    if (isSyncing) return 'syncing'
    if (syncError) return 'error'
    if (lastSyncTime) return 'synced'
    return 'pending'
  }

  const status = getSyncStatus()

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-8 px-2 text-slate-600 hover:text-slate-900"
      >
        {status === 'syncing' && (
          <>
            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            <span className="text-xs">同期中</span>
          </>
        )}
        {status === 'synced' && (
          <>
            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
            <span className="text-xs">同期済み</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-4 h-4 mr-1 text-red-600" />
            <span className="text-xs">エラー</span>
          </>
        )}
        {status === 'pending' && (
          <>
            <Cloud className="w-4 h-4 mr-1 text-blue-600" />
            <span className="text-xs">同期待ち</span>
          </>
        )}
      </Button>

      {isExpanded && (
        <div className="absolute right-0 top-10 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">設定同期状況</h3>
              <Cloud className="w-4 h-4 text-slate-500" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">最終同期:</span>
                <span className="text-slate-900">{formatLastSyncTime(lastSyncTime)}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">状態:</span>
                <Badge 
                  variant={
                    status === 'synced' ? 'default' :
                    status === 'error' ? 'destructive' :
                    status === 'syncing' ? 'secondary' : 'outline'
                  }
                  className="text-xs"
                >
                  {status === 'syncing' && '同期中'}
                  {status === 'synced' && '同期済み'}
                  {status === 'error' && 'エラー'}
                  {status === 'pending' && '同期待ち'}
                </Badge>
              </div>
            </div>

            {syncError && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs text-red-800">{syncError}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-800 mt-1"
                >
                  エラーをクリア
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncSettings()}
                disabled={isSyncing}
                className="flex-1 h-8 text-xs"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                手動同期
              </Button>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-200 pt-2">
              <p>設定は自動的にS3に保存され、他のデバイスと同期されます。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}