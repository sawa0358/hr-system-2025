export interface TimeEntry {
  id: string
  workerId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  breakMinutes: number
  notes?: string
  wagePattern: 'A' | 'B' | 'C'
  countPattern?: 'A' | 'B' | 'C'
  count?: number
  createdAt?: string
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

  // 時給パターン
  wagePatternLabelA?: string
  wagePatternLabelB?: string
  wagePatternLabelC?: string
  hourlyRateB?: number
  hourlyRateC?: number

  // 回数パターン
  countPatternLabelA?: string
  countPatternLabelB?: string
  countPatternLabelC?: string
  countRateA?: number
  countRateB?: number
  countRateC?: number

  // 固定額設定
  monthlyFixedAmount?: number
  monthlyFixedEnabled?: boolean

  // 振込先
  transferDestination?: string

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

  // 請求先
  billingClientId?: string // 請求先ID
  billingClientName?: string // 請求先名（API経由で取得）
  // 過去記録の編集許可フラグ
  allowPastEntryEdit?: boolean

  // 業務チェックリスト設定
  checklistPatternId?: string
  checklistPatternIds?: string[]
  checklistPatterns?: { id: string; name: string }[]
  isChecklistEnabled?: boolean
}

export interface WorkSummary {
  totalHours: number
  totalMinutes: number
  totalAmount: number
  entries: TimeEntry[]
}

export interface Reward {
  id: string
  workerId: string
  month: string // YYYY-MM
  date: string // YYYY-MM-DD
  description?: string
  amount: number
  status: 'pending' | 'paid'
}

export interface RewardPreset {
  id: string
  workerId: string
  description: string
  amount: number
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ChecklistItem {
  id: string
  patternId: string
  title: string
  reward: number
  isMandatory: boolean
  isFreeText?: boolean  // 自由記入欄かどうか
  isDescription?: boolean  // 説明文かどうか
  category?: string
  position: number
}

export interface ChecklistPattern {
  id: string
  name: string
  items?: ChecklistItem[]
  _count?: {
    items: number
  }
}

export interface ChecklistSubmissionItem {
  id: string
  submissionId: string
  title: string
  reward: number
  isMandatory: boolean
  isChecked: boolean
  isFreeText?: boolean  // 自由記入欄かどうか
  isDescription?: boolean  // 説明文かどうか
  freeTextValue?: string  // 自由記入欄の入力値
  category?: string
}

export interface ChecklistSubmission {
  id: string
  workerId: string
  worker?: {
    name: string
    teams: string[]
    role: string
  }
  date: string

  // どのパターンで提出したか
  patternId?: string
  pattern?: ChecklistPattern

  memo?: string
  photoUrl?: string
  hasPhoto: boolean
  isSafetyAlert: boolean
  items?: ChecklistSubmissionItem[]
  createdAt?: string
}
