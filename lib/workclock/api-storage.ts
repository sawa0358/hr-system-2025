import { Worker, TimeEntry, Reward, RewardPreset } from './types'

// APIベースのストレージ関数（localStorageの代替）
// 認証情報は自動的にx-employee-idヘッダーに含まれる

const API_BASE = '/api/workclock'

// 現在のユーザーIDを取得（localStorage/sessionStorageから）
// auth-context.tsxと同じロジックを使用
function getCurrentUserId(): string {
  if (typeof window === 'undefined') return ''
  
  try {
    // まずlocalStorage（rememberMe=true）をチェック
    let savedUser = localStorage.getItem('currentUser')
    
    // localStorageにない場合はsessionStorage（rememberMe=false）をチェック
    if (!savedUser) {
      savedUser = sessionStorage.getItem('currentUser')
    }
    
    if (savedUser) {
      const user = JSON.parse(savedUser)
      
      // 古い形式のIDの場合は空文字を返す（auth-context.tsxと同じチェック）
      // 注意: 実際のユーザーIDは除外リストに含めないこと
      if (user.id === "admin" || user.id === "manager" || user.id === "sub" || 
          user.id === "ippan" || user.id === "etsuran" || 
          user.id === "001" || user.id === "002" || user.id === "003") {
        console.warn('WorkClock: 古いユーザーIDが検出されました', user.id)
        return ''
      }
      
      // idフィールドを確認
      if (user.id && typeof user.id === 'string' && user.id.length > 0) {
        return user.id
      }
      
      console.warn('WorkClock: ユーザーIDが無効です', user)
      return ''
    }
  } catch (error) {
    console.error('WorkClock: ユーザー情報のパースエラー', error)
    return ''
  }
  
  // ユーザー情報が見つからない場合は警告を出さない（ログイン前は正常）
  return ''
}

// Workers
export async function getWorkers(userId?: string): Promise<Worker[]> {
  try {
    // userIdが渡されていない場合は、ストレージから取得を試みる
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      console.error('WorkClock: ユーザーIDが取得できません')
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/workers`, {
      headers: {
        'x-employee-id': finalUserId,
      },
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('認証が必要です。ログインしてください。')
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'ワーカー一覧の取得に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('getWorkers error:', error)
    throw error
  }
}

export async function saveWorkers(workers: Worker[]): Promise<void> {
  // 一括保存は個別に更新する必要がある
  // この関数は互換性のため残すが、実際には使用しない
  console.warn('saveWorkers: 一括保存はサポートされていません。個別に更新してください。')
}

export async function getWorkerById(id: string, userId?: string): Promise<Worker | undefined> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      console.error('WorkClock: ユーザーIDが取得できません')
      return undefined
    }
    const response = await fetch(`${API_BASE}/workers/${id}`, {
      headers: {
        'x-employee-id': finalUserId,
      },
    })
    if (!response.ok) {
      return undefined
    }
    return await response.json()
  } catch (error) {
    console.error('getWorkerById error:', error)
    return undefined
  }
}

export async function updateWorker(id: string, updates: Partial<Worker>, userId?: string): Promise<void> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }
    const response = await fetch(`${API_BASE}/workers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': finalUserId,
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('ワーカーの更新に失敗しました')
    }
  } catch (error) {
    console.error('updateWorker error:', error)
    throw error
  }
}

export async function deleteWorker(id: string, userId?: string): Promise<void> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/workers/${id}`, {
      method: 'DELETE',
      headers: {
        'x-employee-id': finalUserId,
      },
    })
    if (!response.ok) {
      throw new Error('ワーカーの削除に失敗しました')
    }
  } catch (error) {
    console.error('deleteWorker error:', error)
    throw error
  }
}

// WorkClockWorker 新規作成時のペイロード（Employeeとのリンク必須）
export interface NewWorkerPayload extends Omit<Worker, 'id'> {
  employeeId: string
}

export async function addWorker(worker: NewWorkerPayload, userId?: string): Promise<Worker> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }
    const response = await fetch(`${API_BASE}/workers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': finalUserId,
      },
      body: JSON.stringify(worker),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'ワーカーの作成に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('addWorker error:', error)
    throw error
  }
}

// Time Entries
export async function getTimeEntries(userId?: string): Promise<TimeEntry[]> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      console.error('WorkClock: ユーザーIDが取得できません')
      return []
    }
    const response = await fetch(`${API_BASE}/time-entries`, {
      headers: {
        'x-employee-id': finalUserId,
      },
    })
    if (!response.ok) {
      throw new Error('時間記録一覧の取得に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('getTimeEntries error:', error)
    return []
  }
}

export async function saveTimeEntries(entries: TimeEntry[]): Promise<void> {
  // 一括保存はサポートしない（個別に追加・更新）
  console.warn('saveTimeEntries: 一括保存はサポートされていません。個別に追加・更新してください。')
}

export async function getEntriesByWorker(workerId: string): Promise<TimeEntry[]> {
  try {
    const response = await fetch(`${API_BASE}/time-entries?workerId=${workerId}`, {
      headers: {
        'x-employee-id': getCurrentUserId(),
      },
    })
    if (!response.ok) {
      throw new Error('時間記録の取得に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('getEntriesByWorker error:', error)
    return []
  }
}

export async function getEntriesByWorkerAndMonth(
  workerId: string,
  year: number,
  month: number,
  userId?: string
): Promise<TimeEntry[]> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      console.error('WorkClock: ユーザーIDが取得できません')
      return []
    }

    const response = await fetch(
      `${API_BASE}/time-entries?workerId=${workerId}&year=${year}&month=${month}`,
      {
        headers: {
          'x-employee-id': finalUserId,
        },
      }
    )
    if (!response.ok) {
      throw new Error('時間記録の取得に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('getEntriesByWorkerAndMonth error:', error)
    return []
  }
}

export async function addTimeEntry(
  entry: Omit<TimeEntry, 'id'>,
  userId?: string
): Promise<TimeEntry> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/time-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': finalUserId,
      },
      body: JSON.stringify(entry),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '時間記録の作成に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('addTimeEntry error:', error)
    throw error
  }
}

export async function updateTimeEntry(
  id: string,
  updates: Partial<TimeEntry>,
  userId?: string
): Promise<void> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/time-entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': finalUserId,
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('時間記録の更新に失敗しました')
    }
  } catch (error) {
    console.error('updateTimeEntry error:', error)
    throw error
  }
}

export async function deleteTimeEntry(id: string, userId?: string): Promise<void> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/time-entries/${id}`, {
      method: 'DELETE',
      headers: {
        'x-employee-id': finalUserId,
      },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '時間記録の削除に失敗しました')
    }
  } catch (error) {
    console.error('deleteTimeEntry error:', error)
    throw error
  }
}

// Rewards
export async function getRewardsByWorkerAndMonth(
  workerId: string,
  year: number,
  month: number,
  userId?: string
): Promise<Reward[]> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      console.error('WorkClock: ユーザーIDが取得できません')
      return []
    }

    const response = await fetch(
      `${API_BASE}/rewards?workerId=${workerId}&year=${year}&month=${month}`,
      {
        headers: {
          'x-employee-id': finalUserId,
        },
      }
    )
    if (!response.ok) {
      throw new Error('特別報酬の取得に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('getRewardsByWorkerAndMonth error:', error)
    return []
  }
}

export async function addReward(
  reward: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'>,
  userId?: string
): Promise<Reward> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/rewards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': finalUserId,
      },
      body: JSON.stringify(reward),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || '特別報酬の作成に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('addReward error:', error)
    throw error
  }
}

export async function updateReward(
  id: string,
  updates: Partial<Reward>,
  userId?: string
): Promise<void> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/rewards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': finalUserId,
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error('特別報酬の更新に失敗しました')
    }
  } catch (error) {
    console.error('updateReward error:', error)
    throw error
  }
}

export async function deleteReward(id: string, userId?: string): Promise<void> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/rewards/${id}`, {
      method: 'DELETE',
      headers: {
        'x-employee-id': finalUserId,
      },
    })
    if (!response.ok) {
      throw new Error('特別報酬の削除に失敗しました')
    }
  } catch (error) {
    console.error('deleteReward error:', error)
    throw error
  }
}

// Reward Presets
export async function getRewardPresets(workerId: string, userId?: string): Promise<RewardPreset[]> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      console.error('WorkClock: ユーザーIDが取得できません')
      return []
    }

    const response = await fetch(`${API_BASE}/reward-presets?workerId=${workerId}`, {
      headers: {
        'x-employee-id': finalUserId,
      },
    })
    if (!response.ok) {
      throw new Error('プリセットの取得に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('getRewardPresets error:', error)
    return []
  }
}

export async function addRewardPreset(
  preset: Omit<RewardPreset, 'id' | 'createdAt' | 'updatedAt' | 'isEnabled'>,
  userId?: string
): Promise<RewardPreset> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/reward-presets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-employee-id': finalUserId,
      },
      body: JSON.stringify(preset),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'プリセットの作成に失敗しました')
    }
    return await response.json()
  } catch (error) {
    console.error('addRewardPreset error:', error)
    throw error
  }
}

export async function deleteRewardPreset(id: string, userId?: string): Promise<void> {
  try {
    const finalUserId = userId || getCurrentUserId()
    if (!finalUserId) {
      throw new Error('認証が必要です。ログインしてください。')
    }

    const response = await fetch(`${API_BASE}/reward-presets?id=${id}`, {
      method: 'DELETE',
      headers: {
        'x-employee-id': finalUserId,
      },
    })
    if (!response.ok) {
      throw new Error('プリセットの削除に失敗しました')
    }
  } catch (error) {
    console.error('deleteRewardPreset error:', error)
    throw error
  }
}

// Teams (localStorageで管理、APIは不要)
export function getTeams(): string[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem('timesheet_teams')
  return data ? JSON.parse(data) : ['チームA', 'チームB', 'チームC']
}

export function saveTeams(teams: string[]): void {
  localStorage.setItem('timesheet_teams', JSON.stringify(teams))
}

export function addTeam(teamName: string): void {
  const teams = getTeams()
  if (!teams.includes(teamName)) {
    teams.push(teamName)
    saveTeams(teams)
  }
}

export function deleteTeam(teamName: string): void {
  const teams = getTeams()
  saveTeams(teams.filter(t => t !== teamName))
}

// Initialize with sample data if empty (API移行後は不要)
export function initializeSampleData(): void {
  // API移行後は初期化不要
  console.log('initializeSampleData: API移行後は初期化不要です')
}
