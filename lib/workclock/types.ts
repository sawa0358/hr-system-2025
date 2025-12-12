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
  employeeId?: string // HR システムの従業員ID
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
  // 消費税設定
  billingTaxEnabled?: boolean // 消費税を請求に反映するか
  billingTaxRate?: number // 個別の消費税率
  taxType?: 'exclusive' | 'inclusive' // 外税 | 内税（デフォルト: 外税）
  // 源泉徴収設定
  withholdingTaxEnabled?: boolean // 源泉徴収対象かどうか
}

export interface WorkSummary {
  totalHours: number
  totalMinutes: number
  totalAmount: number
  entries: TimeEntry[]
}
