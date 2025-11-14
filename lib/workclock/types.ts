export interface TimeEntry {
  id: string
  workerId: string
  date: string // YYYY-MM-DD format
  startTime: string // HH:mm format (24-hour)
  endTime: string // HH:mm format (24-hour)
  breakMinutes: number
  notes?: string
}

export interface Worker {
  id: string
  name: string
  password?: string
  companyName?: string // 屋号・会社名
  qualifiedInvoiceNumber?: string // 適格証明番号
  chatworkId?: string // チャットワークID
  email: string
  phone?: string // 電話番号
  address?: string // 住所
  hourlyRate: number
  teams?: string[]
  role: 'worker' | 'admin'
  notes?: string // 備考欄
}

export interface WorkSummary {
  totalHours: number
  totalMinutes: number
  totalAmount: number
  entries: TimeEntry[]
}
