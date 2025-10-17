import { uploadFileToS3, getSignedDownloadUrl } from './s3-client'

// TypeScript型定義の拡張
declare global {
  interface Window {
    _isApplyingSettings?: boolean
  }
}

/**
 * ユーザー設定をS3に保存・同期するシステム
 */

export interface UserSettings {
  // 社員検索フィルター設定
  employeeSearch: {
    departments: string[]
    positions: string[]
    employmentTypes: { value: string; label: string }[]
  }
  
  // タスク管理設定
  taskManagement: {
    defaultCardSettings: {
      labels: Array<{ id: string; name: string; color: string }>
      priorities: Array<{ value: string; label: string }>
      statuses: Array<{ value: string; label: string }>
      defaultCardColor: string
      defaultListColor: string
    }
    priorityOptions: Array<{ value: string; label: string }>
    workspaceSelection?: string
    boardSelection?: string
  }
  
  // 勤怠管理設定
  attendance: {
    templates: Array<{
      id: string
      name: string
      employees: string[]
      content?: string
      type?: string
    }>
  }
  
  // その他の設定
  misc: {
    lastUpdated: string
    version: string
  }
}

/**
 * ユーザー設定をS3に保存（API経由）
 */
export async function saveUserSettingsToS3(
  userId: string,
  settings: UserSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/user-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': userId,
      },
      body: JSON.stringify({ settings }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || '設定の保存に失敗しました' }
    }

    const result = await response.json()
    console.log(`ユーザー設定をS3に保存しました: ${userId}`)
    return { success: true }
  } catch (error) {
    console.error('設定保存エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '設定保存に失敗しました'
    }
  }
}

/**
 * ユーザー設定をS3から取得（API経由）
 */
export async function loadUserSettingsFromS3(
  userId: string
): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
  try {
    const response = await fetch('/api/user-settings', {
      method: 'GET',
      headers: {
        'x-employee-id': userId,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      if (response.status === 404) {
        console.log('S3から設定ファイルが見つかりません:', userId)
        return { success: false, error: '設定ファイルが見つかりません' }
      }
      return { success: false, error: errorData.error || '設定の取得に失敗しました' }
    }

    const result = await response.json()
    if (result.success && result.settings) {
      console.log('S3からユーザー設定を取得しました:', userId)
      return { success: true, settings: result.settings }
    } else {
      return { success: false, error: result.error || '設定ファイルが見つかりません' }
    }
  } catch (error) {
    console.error('設定取得エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '設定取得に失敗しました'
    }
  }
}

/**
 * localStorageから現在の設定を取得
 */
export function getCurrentLocalStorageSettings(): Partial<UserSettings> {
  if (typeof window === 'undefined') {
    return {}
  }
  
  const settings: Partial<UserSettings> = {}
  
  try {
    // 社員検索設定
    const departments = localStorage.getItem('available-departments')
    const positions = localStorage.getItem('available-positions')
    const employmentTypes = localStorage.getItem('employment-types')
    
    if (departments) {
      settings.employeeSearch = {
        departments: JSON.parse(departments),
        positions: positions ? JSON.parse(positions) : [],
        employmentTypes: employmentTypes ? JSON.parse(employmentTypes) : []
      }
    }
    
    // タスク管理設定
    const defaultCardSettings = localStorage.getItem('default-card-settings')
    const priorityOptions = localStorage.getItem('task-priority-options')
    const workspaceSelection = localStorage.getItem('currentWorkspace')
    const boardSelection = localStorage.getItem('currentBoard')
    
    if (defaultCardSettings || priorityOptions || workspaceSelection || boardSelection) {
      settings.taskManagement = {
        defaultCardSettings: defaultCardSettings ? JSON.parse(defaultCardSettings) : {
          labels: [],
          priorities: [],
          statuses: [],
          defaultCardColor: '#3b82f6',
          defaultListColor: '#64748b'
        },
        priorityOptions: priorityOptions ? JSON.parse(priorityOptions) : [],
        workspaceSelection: workspaceSelection || undefined,
        boardSelection: boardSelection || undefined
      }
    }
    
    // 勤怠管理設定
    const attendanceTemplates = localStorage.getItem('attendance-templates')
    if (attendanceTemplates) {
      settings.attendance = {
        templates: JSON.parse(attendanceTemplates)
      }
    }
    
    // メタデータ
    settings.misc = {
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    }
    
  } catch (error) {
    console.error('localStorage設定取得エラー:', error)
  }
  
  return settings
}

/**
 * localStorageに設定を適用
 */
export function applySettingsToLocalStorage(settings: UserSettings): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    // 設定適用中フラグを設定（無限ループ防止）
    window._isApplyingSettings = true
    
    // 社員検索設定
    if (settings.employeeSearch) {
      localStorage.setItem('available-departments', JSON.stringify(settings.employeeSearch.departments))
      localStorage.setItem('available-positions', JSON.stringify(settings.employeeSearch.positions))
      localStorage.setItem('employment-types', JSON.stringify(settings.employeeSearch.employmentTypes))
    }
    
    // タスク管理設定
    if (settings.taskManagement) {
      localStorage.setItem('default-card-settings', JSON.stringify(settings.taskManagement.defaultCardSettings))
      localStorage.setItem('task-priority-options', JSON.stringify(settings.taskManagement.priorityOptions))
      
      if (settings.taskManagement.workspaceSelection) {
        localStorage.setItem('currentWorkspace', settings.taskManagement.workspaceSelection)
      }
      if (settings.taskManagement.boardSelection) {
        localStorage.setItem('currentBoard', settings.taskManagement.boardSelection)
      }
    }
    
    // 勤怠管理設定
    if (settings.attendance) {
      localStorage.setItem('attendance-templates', JSON.stringify(settings.attendance.templates))
    }
    
    console.log('設定をlocalStorageに適用しました')
  } catch (error) {
    console.error('localStorage設定適用エラー:', error)
  } finally {
    // 設定適用完了フラグをクリア
    window._isApplyingSettings = false
  }
}

/**
 * 設定を同期（S3から取得してlocalStorageに適用）
 */
export async function syncUserSettings(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('ユーザー設定の同期を開始:', userId)
    
    // S3から設定を取得
    const result = await loadUserSettingsFromS3(userId)
    
    if (result.success && result.settings) {
      // localStorageに適用
      applySettingsToLocalStorage(result.settings)
      console.log('設定の同期が完了しました:', userId)
      return { success: true }
    } else {
      console.log('S3に設定がないため、現在のlocalStorage設定をS3に保存します')
      
      // 現在のlocalStorage設定をS3に保存
      const currentSettings = getCurrentLocalStorageSettings()
      if (Object.keys(currentSettings).length > 0) {
        const saveResult = await saveUserSettingsToS3(userId, currentSettings as UserSettings)
        if (saveResult.success) {
          console.log('現在の設定をS3に保存しました:', userId)
          return { success: true }
        }
      }
      
      return { success: true } // 設定がない場合も成功として扱う
    }
  } catch (error) {
    console.error('設定同期エラー:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '設定同期に失敗しました'
    }
  }
}

/**
 * 設定変更をS3に自動保存
 */
export async function autoSaveUserSettings(userId: string): Promise<void> {
  try {
    const currentSettings = getCurrentLocalStorageSettings()
    if (Object.keys(currentSettings).length > 0) {
      await saveUserSettingsToS3(userId, currentSettings as UserSettings)
      console.log('設定を自動保存しました:', userId)
    }
  } catch (error) {
    console.error('自動保存エラー:', error)
  }
}

/**
 * localStorageの変更を監視してS3に自動保存
 */
export function setupAutoSave(userId: string): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }
  
  const watchedKeys = [
    'available-departments',
    'available-positions',
    'employment-types',
    'default-card-settings',
    'task-priority-options',
    'attendance-templates',
    'currentWorkspace',
    'currentBoard'
  ]
  
  let saveTimeout: NodeJS.Timeout | null = null
  
  const handleStorageChange = () => {
    // 設定適用中の場合は処理をスキップ（無限ループ防止）
    if ((window as any)._isApplyingSettings) {
      return
    }
    
    // デバウンス処理（500ms後に保存）
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    saveTimeout = setTimeout(() => {
      autoSaveUserSettings(userId)
    }, 500)
  }
  
  // ストレージイベントを監視
  window.addEventListener('storage', handleStorageChange)
  
  // カスタムイベントも監視
  const customEvents = [
    'departmentsChanged',
    'positionsChanged',
    'employmentTypesChanged',
    'defaultCardSettingsChanged',
    'taskSettingsChanged',
    'workspaceChanged',
    'boardChanged',
    'attendanceTemplatesChanged'
  ]
  
  customEvents.forEach(eventName => {
    window.addEventListener(eventName, handleStorageChange)
  })
  
  // クリーンアップ関数を返す
  return () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    window.removeEventListener('storage', handleStorageChange)
    customEvents.forEach(eventName => {
      window.removeEventListener(eventName, handleStorageChange)
    })
  }
}