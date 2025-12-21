export interface TimeEntry {
  id: string
  workerId: string
  date: string // YYYY-MM-DD format
  startTime: string // HH:mm format (24-hour)
  endTime: string // HH:mm format (24-hour)
  breakMinutes: number
  notes?: string
  wagePattern?: WagePattern // 時給パターン（A/B/C）
  countPattern?: WagePattern // 回数パターン（A/B/C）
  count?: number // 回数パターンの回数
}

export type WagePattern = 'A' | 'B' | 'C'

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
  hourlyRate: number // 時給パターンA（デフォルト）
  teams?: string[]
  role: 'worker' | 'admin'
  notes?: string // 備考欄
  
  // 時給パターン設定
  wagePatternLabelA?: string // 時給パターンAラベル
  wagePatternLabelB?: string // 時給パターンBラベル
  wagePatternLabelC?: string // 時給パターンCラベル
  hourlyRateB?: number // 時給パターンB金額
  hourlyRateC?: number // 時給パターンC金額
  
  // 回数パターン設定
  countPatternLabelA?: string // 回数パターンAラベル
  countPatternLabelB?: string // 回数パターンBラベル
  countPatternLabelC?: string // 回数パターンCラベル
  countRateA?: number // 回数パターンA金額
  countRateB?: number // 回数パターンB金額
  countRateC?: number // 回数パターンC金額
  
  // 月額固定設定
  monthlyFixedAmount?: number // 月額固定金額
  monthlyFixedEnabled?: boolean // 月額固定有効フラグ
  
  // 消費税設定
  billingTaxEnabled?: boolean // 消費税を請求に反映するか
  billingTaxRate?: number // 個別の消費税率
  taxType?: 'exclusive' | 'inclusive' // 外税 | 内税（デフォルト: 外税）
  
  // 源泉徴収設定（レガシー）
  withholdingTaxEnabled?: boolean // 源泉徴収対象かどうか（レガシー用）
  
  // 時給パターン別の源泉徴収ON/OFF
  withholdingHourlyA?: boolean // 時給パターンA源泉徴収
  withholdingHourlyB?: boolean // 時給パターンB源泉徴収
  withholdingHourlyC?: boolean // 時給パターンC源泉徴収
  
  // 回数パターン別の源泉徴収ON/OFF
  withholdingCountA?: boolean // 回数パターンA源泉徴収
  withholdingCountB?: boolean // 回数パターンB源泉徴収
  withholdingCountC?: boolean // 回数パターンC源泉徴収
  
  // 月額固定の源泉徴収ON/OFF
  withholdingMonthlyFixed?: boolean // 月額固定源泉徴収
  
  // 振込先
  transferDestination?: string
}

export interface WorkSummary {
  totalHours: number
  totalMinutes: number
  totalAmount: number
  entries: TimeEntry[]
}
