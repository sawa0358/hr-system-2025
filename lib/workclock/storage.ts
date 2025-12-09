import { Worker, TimeEntry } from './types'
import { api } from './api'

const WORKERS_KEY = 'timesheet_workers'
const ENTRIES_KEY = 'timesheet_entries'
const TEAMS_KEY = 'timesheet_teams'

// Workers
export async function getWorkers(): Promise<Worker[]> {
  if (typeof window === 'undefined') return []
  
  try {
    const response = await api.workers.getAll()
    // レスポンスが配列の場合はそのまま、オブジェクトの場合はworkersプロパティを取得
    if (Array.isArray(response)) {
      return response
    }
    return response.workers || []
  } catch (error) {
    console.error('[getWorkers] API error:', error)
    // フォールバック: localStorageから取得
    const data = localStorage.getItem(WORKERS_KEY)
    return data ? JSON.parse(data) : []
  }
}

export function saveWorkers(workers: Worker[]): void {
  localStorage.setItem(WORKERS_KEY, JSON.stringify(workers))
}

export async function getWorkerById(id: string): Promise<Worker | undefined> {
  try {
    const response = await api.workers.getById(id)
    return response.worker
  } catch (error) {
    console.error('[getWorkerById] API error:', error)
    // フォールバック: localStorageから取得
    const workers = await getWorkers()
    return workers.find((w) => w.id === id)
  }
}

export async function updateWorker(id: string, updates: Partial<Worker>): Promise<void> {
  try {
    await api.workers.update(id, updates)
  } catch (error) {
    console.error('[updateWorker] API error:', error)
    throw error
  }
}

export async function deleteWorker(id: string): Promise<void> {
  try {
    await api.workers.delete(id)
  } catch (error) {
    console.error('[deleteWorker] API error:', error)
    throw error
  }
}

export async function addWorker(worker: Omit<Worker, 'id'>): Promise<Worker> {
  try {
    const response = await api.workers.create(worker)
    return response.worker
  } catch (error) {
    console.error('[addWorker] API error:', error)
    throw error
  }
}

// ワーカー候補（未登録の従業員）を取得
export interface WorkerCandidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  employeeType: string | null
  furigana: string | null
  address: string | null
}

export async function getWorkerCandidates(): Promise<WorkerCandidate[]> {
  try {
    const response = await api.workers.getCandidates()
    // レスポンスが配列の場合はそのまま、オブジェクトの場合はcandidatesプロパティを取得
    if (Array.isArray(response)) {
      return response
    }
    return response.candidates || []
  } catch (error) {
    console.error('[getWorkerCandidates] API error:', error)
    return []
  }
}

// Time Entries
export async function getTimeEntries(): Promise<TimeEntry[]> {
  if (typeof window === 'undefined') return []
  
  try {
    const response = await api.timeEntries.getAll()
    // レスポンスが配列の場合はそのまま、オブジェクトの場合はentriesプロパティを取得
    if (Array.isArray(response)) {
      return response
    }
    return response.entries || []
  } catch (error) {
    console.error('[getTimeEntries] API error:', error)
    // フォールバック: localStorageから取得
    const data = localStorage.getItem(ENTRIES_KEY)
    return data ? JSON.parse(data) : []
  }
}

export function saveTimeEntries(entries: TimeEntry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export async function getEntriesByWorker(workerId: string): Promise<TimeEntry[]> {
  try {
    const response = await api.timeEntries.getAll({ workerId })
    if (Array.isArray(response)) {
      return response
    }
    return response.entries || []
  } catch (error) {
    console.error('[getEntriesByWorker] API error:', error)
    const entries = await getTimeEntries()
    return entries.filter((e) => e.workerId === workerId)
  }
}

export async function getEntriesByWorkerAndMonth(
  workerId: string,
  year: number,
  month: number
): Promise<TimeEntry[]> {
  try {
    const response = await api.timeEntries.getAll({ workerId, year, month })
    if (Array.isArray(response)) {
      return response
    }
    return response.entries || []
  } catch (error) {
    console.error('[getEntriesByWorkerAndMonth] API error:', error)
    const entries = await getTimeEntries()
    return entries.filter((e) => {
      if (e.workerId !== workerId) return false
      const entryDate = new Date(e.date)
      return entryDate.getFullYear() === year && entryDate.getMonth() === month
    })
  }
}

export async function addTimeEntry(entry: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
  try {
    const response = await api.timeEntries.create(entry)
    return response.entry
  } catch (error) {
    console.error('[addTimeEntry] API error:', error)
    throw error
  }
}

export async function updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<void> {
  try {
    await api.timeEntries.update(id, updates)
  } catch (error) {
    console.error('[updateTimeEntry] API error:', error)
    throw error
  }
}

export async function deleteTimeEntry(id: string): Promise<void> {
  try {
    await api.timeEntries.delete(id)
  } catch (error) {
    console.error('[deleteTimeEntry] API error:', error)
    throw error
  }
}

// Teams
export async function getTeams(): Promise<string[]> {
  if (typeof window === 'undefined') return []
  
  try {
    const response = await api.teams.getAll()
    // レスポンスが配列の場合はそのまま、オブジェクトの場合はteamsプロパティを取得
    if (Array.isArray(response)) {
      return response
    }
    return response.teams || []
  } catch (error) {
    console.error('[getTeams] API error:', error)
    // フォールバック: localStorageから取得
    const data = localStorage.getItem(TEAMS_KEY)
    return data ? JSON.parse(data) : ['チームA', 'チームB', 'チームC']
  }
}

export function saveTeams(teams: string[]): void {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams))
}

export async function addTeam(teamName: string): Promise<void> {
  try {
    await api.teams.create(teamName)
  } catch (error) {
    console.error('[addTeam] API error:', error)
    throw error
  }
}

export async function deleteTeam(teamName: string): Promise<void> {
  try {
    await api.teams.delete(teamName)
  } catch (error) {
    console.error('[deleteTeam] API error:', error)
    throw error
  }
}

// Initialize with sample data if empty
export async function initializeSampleData(): Promise<void> {
  const workers = await getWorkers()
  if (workers.length === 0) {
    const sampleWorkers: Omit<Worker, 'id'>[] = [
      { name: '山田太郎', email: 'yamada@example.com', hourlyRate: 2500, teams: ['チームA'], role: 'worker' },
      { name: '佐藤花子', email: 'sato@example.com', hourlyRate: 3000, teams: ['チームA', 'チームB'], role: 'worker' },
      { name: '鈴木一郎', email: 'suzuki@example.com', hourlyRate: 2800, teams: ['チームB'], role: 'worker' },
      { name: '管理者', email: 'admin@example.com', hourlyRate: 0, role: 'admin' },
    ]
    for (const worker of sampleWorkers) {
      await addWorker(worker)
    }
  }
}
