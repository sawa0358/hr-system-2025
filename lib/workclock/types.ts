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
  // 回数パターン（時給パターンと排他的に使用）
  countPattern?: 'A' | 'B' | 'C'
  count?: number // 回数
}

export interface Reward {
  id: string
  workerId: string
  amount: number
  description: string
  date: string // ISO date string or YYYY-MM-DD
  createdAt?: string
  updatedAt?: string
}

export interface RewardPreset {
  id: string
  workerId: string
  amount: number
  description: string
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Worker {
  id: string
  employeeId?: string
  /**
   * HRシステム側の雇用形態（例: 業務委託, 外注先 など）
   * WorkClockWorker.employee とのJOIN結果として付与される
   */
  employeeType?: string | null
  name: string
  furigana?: string // フリガナ（並び替え用）
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
  // 回数パターン名（ラベル）
  countPatternLabelA?: string
  countPatternLabelB?: string
  countPatternLabelC?: string
  // 回数パターン金額（〇〇円／回）
  countRateA?: number
  countRateB?: number
  countRateC?: number
  // 月額固定
  monthlyFixedAmount?: number
  monthlyFixedEnabled?: boolean
  // 消費税設定
  billingTaxEnabled?: boolean // 消費税を請求に反映するか
  billingTaxRate?: number     // 個別税率（例: 10.0）。未設定時は標準税率を使用
}

export interface WorkSummary {
  totalHours: number
  totalMinutes: number
  totalAmount: number
  entries: TimeEntry[]
}
