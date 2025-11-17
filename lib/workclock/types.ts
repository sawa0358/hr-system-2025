export interface TimeEntry {
  id: string
  workerId: string
  date: string // YYYY-MM-DD format
  startTime: string // HH:mm format (24-hour)
  endTime: string // HH:mm format (24-hour)
  breakMinutes: number
  notes?: string
  // 時給パターン（未指定の場合は A とみなす）
  wagePattern?: 'A' | 'B' | 'C'
}

export interface Worker {
  id: string
  employeeId?: string
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
  // 時給パターン名（ラベル）
  wagePatternLabelA?: string
  wagePatternLabelB?: string
  wagePatternLabelC?: string
  // 追加の時給パターン金額
  hourlyRateB?: number
  hourlyRateC?: number
  // 月額固定
  monthlyFixedAmount?: number
  monthlyFixedEnabled?: boolean
}

export interface WorkSummary {
  totalHours: number
  totalMinutes: number
  totalAmount: number
  entries: TimeEntry[]
}
