import { useEffect, useCallback, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { syncUserSettings, setupAutoSave, getCurrentLocalStorageSettings, saveUserSettingsToS3 } from '@/lib/settings-sync'

/**
 * ユーザー設定の同期を管理するカスタムフック
 */
export function useSettingsSync() {
  const { currentUser } = useAuth()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  /**
   * 設定を同期
   */
  const syncSettings = useCallback(async (userId: string) => {
    if (isSyncing) return
    
    setIsSyncing(true)
    setSyncError(null)
    
    try {
      console.log('設定同期を開始:', userId)
      
      const result = await syncUserSettings(userId)
      
      if (result.success) {
        setLastSyncTime(new Date())
        console.log('設定同期が完了しました:', userId)
      } else {
        setSyncError(result.error || '設定の同期に失敗しました')
        console.error('設定同期エラー:', result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '設定同期に失敗しました'
      setSyncError(errorMessage)
      console.error('設定同期エラー:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  /**
   * 手動で設定を保存
   */
  const saveSettings = useCallback(async (userId: string) => {
    try {
      const currentSettings = getCurrentLocalStorageSettings()
      if (Object.keys(currentSettings).length > 0) {
        const result = await saveUserSettingsToS3(userId, currentSettings as any)
        if (result.success) {
          setLastSyncTime(new Date())
          console.log('設定を手動保存しました:', userId)
          return true
        } else {
          setSyncError(result.error || '設定の保存に失敗しました')
          return false
        }
      }
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '設定保存に失敗しました'
      setSyncError(errorMessage)
      console.error('設定保存エラー:', error)
      return false
    }
  }, [])

  /**
   * ユーザーがログインした時に設定を同期
   */
  useEffect(() => {
    if (currentUser?.id) {
      syncSettings(currentUser.id)
    }
  }, [currentUser?.id, syncSettings])

  /**
   * 自動保存のセットアップ
   */
  useEffect(() => {
    if (!currentUser?.id) return

    console.log('自動保存をセットアップ:', currentUser.id)
    const cleanup = setupAutoSave(currentUser.id)

    return cleanup
  }, [currentUser?.id])

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    syncSettings: () => currentUser?.id ? syncSettings(currentUser.id) : Promise.resolve(),
    saveSettings: () => currentUser?.id ? saveSettings(currentUser.id) : Promise.resolve(false),
    clearError: () => setSyncError(null)
  }
}