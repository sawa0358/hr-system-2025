import { Worker, TimeEntry } from './types'

const WORKERS_KEY = 'timesheet_workers'
const ENTRIES_KEY = 'timesheet_entries'
const TEAMS_KEY = 'timesheet_teams'

// Workers
export function getWorkers(): Worker[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(WORKERS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveWorkers(workers: Worker[]): void {
  localStorage.setItem(WORKERS_KEY, JSON.stringify(workers))
}

export function getWorkerById(id: string): Worker | undefined {
  return getWorkers().find((w) => w.id === id)
}

export function updateWorker(id: string, updates: Partial<Worker>): void {
  const workers = getWorkers()
  const index = workers.findIndex((w) => w.id === id)
  if (index !== -1) {
    workers[index] = { ...workers[index], ...updates }
    saveWorkers(workers)
  }
}

export function deleteWorker(id: string): void {
  const workers = getWorkers()
  saveWorkers(workers.filter((w) => w.id !== id))
}

export function addWorker(worker: Omit<Worker, 'id'>): Worker {
  const workers = getWorkers()
  const newWorker = { ...worker, id: crypto.randomUUID() }
  workers.push(newWorker)
  saveWorkers(workers)
  return newWorker
}

// Time Entries
export function getTimeEntries(): TimeEntry[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(ENTRIES_KEY)
  return data ? JSON.parse(data) : []
}

export function saveTimeEntries(entries: TimeEntry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export function getEntriesByWorker(workerId: string): TimeEntry[] {
  return getTimeEntries().filter((e) => e.workerId === workerId)
}

export function getEntriesByWorkerAndMonth(
  workerId: string,
  year: number,
  month: number
): TimeEntry[] {
  return getTimeEntries().filter((e) => {
    if (e.workerId !== workerId) return false
    const entryDate = new Date(e.date)
    return entryDate.getFullYear() === year && entryDate.getMonth() === month
  })
}

export function addTimeEntry(entry: Omit<TimeEntry, 'id'>): TimeEntry {
  const entries = getTimeEntries()
  const newEntry = { ...entry, id: crypto.randomUUID() }
  entries.push(newEntry)
  saveTimeEntries(entries)
  return newEntry
}

export function updateTimeEntry(id: string, updates: Partial<TimeEntry>): void {
  const entries = getTimeEntries()
  const index = entries.findIndex((e) => e.id === id)
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates }
    saveTimeEntries(entries)
  }
}

export function deleteTimeEntry(id: string): void {
  const entries = getTimeEntries()
  saveTimeEntries(entries.filter((e) => e.id !== id))
}

// Teams
export function getTeams(): string[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(TEAMS_KEY)
  return data ? JSON.parse(data) : ['チームA', 'チームB', 'チームC']
}

export function saveTeams(teams: string[]): void {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams))
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

// Initialize with sample data if empty
export function initializeSampleData(): void {
  if (getWorkers().length === 0) {
    const sampleWorkers: Omit<Worker, 'id'>[] = [
      { name: '山田太郎', email: 'yamada@example.com', hourlyRate: 2500, teams: ['チームA'], role: 'worker' },
      { name: '佐藤花子', email: 'sato@example.com', hourlyRate: 3000, teams: ['チームA', 'チームB'], role: 'worker' },
      { name: '鈴木一郎', email: 'suzuki@example.com', hourlyRate: 2800, teams: ['チームB'], role: 'worker' },
      { name: '管理者', email: 'admin@example.com', hourlyRate: 0, role: 'admin' },
    ]
    sampleWorkers.forEach(addWorker)
  }
}
