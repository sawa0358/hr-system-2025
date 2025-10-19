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
    statusOptions: Array<{ value: string; label: string; isDefault?: boolean }>
    customLabels: Array<{ id: string; name: string; color: string }>
    workspaceSelection?: string
    boardSelection?: string
    listCollapseStates: Record<string, boolean> // リストの折りたたみ状態
    cardColors: Record<string, string> // カードの色設定
    listColors: Record<string, string> // リストの色設定
    taskFolders: Record<string, string[]> // タスクごとのフォルダ設定 {taskId: [folder1, folder2, ...]}
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
  
  // ダッシュボード設定
  dashboard: {
    announcements: Array<{
      id: string
      title: string
      content: string
      category: string
      createdAt: string
    }>
    categories: Array<{
      id: string
      name: string
      color: string
    }>
  }
  
  // 社員詳細設定
  employeeDetails: {
    customFields: Record<string, any>
    preferences: Record<string, any>
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
    const statusOptions = localStorage.getItem('task-status-options')
    const customLabels = localStorage.getItem('task-custom-labels')
    const workspaceSelection = localStorage.getItem('currentWorkspace')
    const boardSelection = localStorage.getItem('currentBoard')
    const listCollapseStates = localStorage.getItem('task-list-collapse-states')
    const cardColors = localStorage.getItem('task-card-colors')
    const listColors = localStorage.getItem('task-list-colors')
    
    // タスクフォルダ設定を取得（動的キー）
    const taskFolders: Record<string, string[]> = {}
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('task-folders-')) {
          const taskId = key.replace('task-folders-', '')
          try {
            const folders = JSON.parse(localStorage.getItem(key) || '[]')
            taskFolders[taskId] = folders
          } catch (error) {
            console.error(`タスクフォルダ設定の読み込みエラー (${key}):`, error)
          }
        }
      }
    }
    
    if (defaultCardSettings || priorityOptions || statusOptions || customLabels || 
        workspaceSelection || boardSelection || listCollapseStates || cardColors || listColors || 
        Object.keys(taskFolders).length > 0) {
      settings.taskManagement = {
        defaultCardSettings: defaultCardSettings ? JSON.parse(defaultCardSettings) : {
          labels: [],
          priorities: [],
          statuses: [],
          defaultCardColor: '#3b82f6',
          defaultListColor: '#64748b'
        },
        priorityOptions: priorityOptions ? JSON.parse(priorityOptions) : [],
        statusOptions: statusOptions ? JSON.parse(statusOptions) : [],
        customLabels: customLabels ? JSON.parse(customLabels) : [],
        workspaceSelection: workspaceSelection || undefined,
        boardSelection: boardSelection || undefined,
        listCollapseStates: listCollapseStates ? JSON.parse(listCollapseStates) : {},
        cardColors: cardColors ? JSON.parse(cardColors) : {},
        listColors: listColors ? JSON.parse(listColors) : {},
        taskFolders: taskFolders
      }
    }
    
    // 勤怠管理設定
    const attendanceTemplates = localStorage.getItem('attendance-templates')
    if (attendanceTemplates) {
      settings.attendance = {
        templates: JSON.parse(attendanceTemplates)
      }
    }
    
    // ダッシュボード設定
    const dashboardAnnouncements = localStorage.getItem('dashboard-announcements')
    const dashboardCategories = localStorage.getItem('dashboard-categories')
    if (dashboardAnnouncements || dashboardCategories) {
      settings.dashboard = {
        announcements: dashboardAnnouncements ? JSON.parse(dashboardAnnouncements) : [],
        categories: dashboardCategories ? JSON.parse(dashboardCategories) : []
      }
    }
    
    // 社員詳細設定
    const employeeCustomFields = localStorage.getItem('employee-custom-fields')
    const employeePreferences = localStorage.getItem('employee-preferences')
    if (employeeCustomFields || employeePreferences) {
      settings.employeeDetails = {
        customFields: employeeCustomFields ? JSON.parse(employeeCustomFields) : {},
        preferences: employeePreferences ? JSON.parse(employeePreferences) : {}
      }
    }
    
    // メタデータ
    settings.misc = {
      lastUpdated: new Date().toISOString(),
          version: '1.7.5'
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
      
      if (settings.taskManagement.statusOptions) {
        localStorage.setItem('task-status-options', JSON.stringify(settings.taskManagement.statusOptions))
      }
      if (settings.taskManagement.customLabels) {
        localStorage.setItem('task-custom-labels', JSON.stringify(settings.taskManagement.customLabels))
      }
      if (settings.taskManagement.listCollapseStates) {
        localStorage.setItem('task-list-collapse-states', JSON.stringify(settings.taskManagement.listCollapseStates))
      }
      if (settings.taskManagement.cardColors) {
        localStorage.setItem('task-card-colors', JSON.stringify(settings.taskManagement.cardColors))
      }
      if (settings.taskManagement.listColors) {
        localStorage.setItem('task-list-colors', JSON.stringify(settings.taskManagement.listColors))
      }
      if (settings.taskManagement.taskFolders) {
        // タスクフォルダ設定を適用
        Object.entries(settings.taskManagement.taskFolders).forEach(([taskId, folders]) => {
          localStorage.setItem(`task-folders-${taskId}`, JSON.stringify(folders))
        })
      }
      
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
    
    // ダッシュボード設定
    if (settings.dashboard) {
      if (settings.dashboard.announcements) {
        localStorage.setItem('dashboard-announcements', JSON.stringify(settings.dashboard.announcements))
      }
      if (settings.dashboard.categories) {
        localStorage.setItem('dashboard-categories', JSON.stringify(settings.dashboard.categories))
      }
    }
    
    // 社員詳細設定
    if (settings.employeeDetails) {
      if (settings.employeeDetails.customFields) {
        localStorage.setItem('employee-custom-fields', JSON.stringify(settings.employeeDetails.customFields))
      }
      if (settings.employeeDetails.preferences) {
        localStorage.setItem('employee-preferences', JSON.stringify(settings.employeeDetails.preferences))
      }
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
    'task-status-options',
    'task-custom-labels',
    'task-list-collapse-states',
    'task-card-colors',
    'task-list-colors',
    'attendance-templates',
    'dashboard-announcements',
    'dashboard-categories',
    'employee-custom-fields',
    'employee-preferences',
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
    'taskStatusChanged',
    'taskLabelsChanged',
    'taskListCollapseChanged',
    'taskCardColorChanged',
    'taskListColorChanged',
    'taskFoldersChanged',
    'workspaceChanged',
    'boardChanged',
    'attendanceTemplatesChanged',
    'dashboardAnnouncementsChanged',
    'dashboardCategoriesChanged',
    'employeeDetailsChanged'
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