import { Worker, TimeEntry, WagePattern } from './types'
import { calculateDuration, formatDuration, getMonthlyTotal } from './time-utils'

// 源泉徴収率の型定義
export interface WithholdingTaxRates {
  rateUnder1M: number  // 100万円以下の税率（%）
  rateOver1M: number   // 100万円超の税率（%）
}

// デフォルトの源泉徴収率（現行法律）
export const DEFAULT_WITHHOLDING_RATES: WithholdingTaxRates = {
  rateUnder1M: 10.21,
  rateOver1M: 20.42,
}

/**
 * 源泉徴収額を計算する
 * @param amount 報酬額
 * @param rates 源泉徴収率
 * @returns 源泉徴収額
 */
export function calculateWithholdingTax(
  amount: number,
  rates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES
): number {
  if (amount <= 0) return 0
  
  if (amount <= 1000000) {
    // 100万円以下: 報酬額 × 税率
    return Math.floor(amount * (rates.rateUnder1M / 100))
  } else {
    // 100万円超: (100万円 × 低税率) + (超過分 × 高税率)
    const baseAmount = 1000000 * (rates.rateUnder1M / 100)
    const excessAmount = (amount - 1000000) * (rates.rateOver1M / 100)
    return Math.floor(baseAmount + excessAmount)
  }
}

// パターン別報酬明細の型
interface PatternBreakdown {
  label: string
  hours?: number
  minutes?: number
  count?: number
  rate: number
  amount: number
  isWithholding: boolean
}

/**
 * 各パターンの報酬を計算
 */
function calculatePatternBreakdowns(
  worker: Worker,
  entries: TimeEntry[]
): PatternBreakdown[] {
  const breakdowns: PatternBreakdown[] = []
  
  // 時給パターン別の集計
  const hourlyTotals: Record<string, { hours: number; minutes: number }> = {
    A: { hours: 0, minutes: 0 },
    B: { hours: 0, minutes: 0 },
    C: { hours: 0, minutes: 0 },
  }
  
  // 回数パターン別の集計
  const countTotals: Record<string, number> = {
    A: 0,
    B: 0,
    C: 0,
  }
  
  // エントリを集計
  entries.forEach((entry) => {
    // 時給パターンの集計
    const wagePattern = entry.wagePattern || 'A'
    const duration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
    hourlyTotals[wagePattern].hours += duration.hours
    hourlyTotals[wagePattern].minutes += duration.minutes
    
    // 回数パターンの集計
    if (entry.countPattern && entry.count) {
      countTotals[entry.countPattern] += entry.count
    }
  })
  
  // 分を時間に変換
  Object.keys(hourlyTotals).forEach((pattern) => {
    const total = hourlyTotals[pattern]
    total.hours += Math.floor(total.minutes / 60)
    total.minutes = total.minutes % 60
  })
  
  // 時給パターンA
  const hoursA = hourlyTotals.A.hours + hourlyTotals.A.minutes / 60
  if (hoursA > 0) {
    breakdowns.push({
      label: worker.wagePatternLabelA || 'Aパターン',
      hours: hourlyTotals.A.hours,
      minutes: hourlyTotals.A.minutes,
      rate: worker.hourlyRate,
      amount: Math.floor(hoursA * worker.hourlyRate),
      isWithholding: worker.withholdingHourlyA || false,
    })
  }
  
  // 時給パターンB
  if (worker.hourlyRateB) {
    const hoursB = hourlyTotals.B.hours + hourlyTotals.B.minutes / 60
    if (hoursB > 0) {
      breakdowns.push({
        label: worker.wagePatternLabelB || 'Bパターン',
        hours: hourlyTotals.B.hours,
        minutes: hourlyTotals.B.minutes,
        rate: worker.hourlyRateB,
        amount: Math.floor(hoursB * worker.hourlyRateB),
        isWithholding: worker.withholdingHourlyB || false,
      })
    }
  }
  
  // 時給パターンC
  if (worker.hourlyRateC) {
    const hoursC = hourlyTotals.C.hours + hourlyTotals.C.minutes / 60
    if (hoursC > 0) {
      breakdowns.push({
        label: worker.wagePatternLabelC || 'Cパターン',
        hours: hourlyTotals.C.hours,
        minutes: hourlyTotals.C.minutes,
        rate: worker.hourlyRateC,
        amount: Math.floor(hoursC * worker.hourlyRateC),
        isWithholding: worker.withholdingHourlyC || false,
      })
    }
  }
  
  // 回数パターンA
  if (worker.countRateA && countTotals.A > 0) {
    breakdowns.push({
      label: worker.countPatternLabelA || '回数Aパターン',
      count: countTotals.A,
      rate: worker.countRateA,
      amount: Math.floor(countTotals.A * worker.countRateA),
      isWithholding: worker.withholdingCountA || false,
    })
  }
  
  // 回数パターンB
  if (worker.countRateB && countTotals.B > 0) {
    breakdowns.push({
      label: worker.countPatternLabelB || '回数Bパターン',
      count: countTotals.B,
      rate: worker.countRateB,
      amount: Math.floor(countTotals.B * worker.countRateB),
      isWithholding: worker.withholdingCountB || false,
    })
  }
  
  // 回数パターンC
  if (worker.countRateC && countTotals.C > 0) {
    breakdowns.push({
      label: worker.countPatternLabelC || '回数Cパターン',
      count: countTotals.C,
      rate: worker.countRateC,
      amount: Math.floor(countTotals.C * worker.countRateC),
      isWithholding: worker.withholdingCountC || false,
    })
  }
  
  // 月額固定
  if (worker.monthlyFixedEnabled && worker.monthlyFixedAmount) {
    breakdowns.push({
      label: '月額固定',
      rate: worker.monthlyFixedAmount,
      amount: worker.monthlyFixedAmount,
      isWithholding: worker.withholdingMonthlyFixed || false,
    })
  }
  
  return breakdowns
}

export function generatePDFContent(
  worker: Worker,
  entries: TimeEntry[],
  month: Date,
  withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES
): string {
  const monthName = month.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  const monthlyTotal = getMonthlyTotal(entries)
  
  // 源泉あり/なしの小計をパターン別設定から算出
  const breakdowns = calculatePatternBreakdowns(worker, entries)
  const subtotalWithholding = breakdowns
    .filter((b) => b.isWithholding)
    .reduce((sum, b) => sum + b.amount, 0)
  const subtotalNonWithholding = breakdowns
    .filter((b) => !b.isWithholding)
    .reduce((sum, b) => sum + b.amount, 0)
  const baseAmountBeforeTax = subtotalWithholding + subtotalNonWithholding

  // 消費税計算
  const billingTaxEnabled = worker.billingTaxEnabled ?? false
  const billingTaxRate = worker.billingTaxRate ?? 10
  let taxAmount = 0
  let totalWithTax = baseAmountBeforeTax
  
  if (billingTaxEnabled && billingTaxRate > 0) {
    taxAmount = Math.floor(baseAmountBeforeTax * (billingTaxRate / 100))
    totalWithTax = baseAmountBeforeTax + taxAmount
  }

  // 源泉徴収額を計算（源泉徴収対象分のみ）
  const hasWithholding = subtotalWithholding > 0
  const withholdingAmount = hasWithholding
    ? calculateWithholdingTax(subtotalWithholding, withholdingRates)
    : 0

  // 最終支払額
  const finalAmount = totalWithTax - withholdingAmount

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Group by date
  const entriesByDate = sortedEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = []
    }
    acc[entry.date].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  // 報酬明細のHTML生成
  let breakdownRows = ''
  
  breakdowns.forEach((item) => {
    let detail = ''
    if (item.hours !== undefined && item.minutes !== undefined) {
      detail = `${formatDuration(item.hours, item.minutes)} × ¥${item.rate.toLocaleString()}/時`
    } else if (item.count !== undefined) {
      detail = `${item.count}回 × ¥${item.rate.toLocaleString()}/回`
    } else {
      detail = '月額固定'
    }
    
    const withholdingBadge = item.isWithholding 
      ? '<span class="withholding-badge">源泉</span>' 
      : ''
    
    breakdownRows += `
          <div class="breakdown-item ${item.isWithholding ? 'has-withholding' : ''}">
            <span class="breakdown-label">${item.label} ${withholdingBadge}</span>
            <span class="breakdown-detail">${detail}</span>
            <span class="breakdown-amount">¥${item.amount.toLocaleString()}</span>
          </div>
    `
  })

  // サマリー行を生成
  let summaryRows = `
          <div class="summary-item">
            <span class="summary-label">勤務日数</span>
            <span class="summary-value">${Object.keys(entriesByDate).length}日</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">総勤務時間</span>
            <span class="summary-value">${formatDuration(monthlyTotal.hours, monthlyTotal.minutes)}</span>
          </div>
  `

  // 源泉あり・なし小計（両方ある場合のみ表示）
  if (subtotalWithholding > 0 && subtotalNonWithholding > 0) {
    summaryRows += `
          <div class="summary-item subtotal-withholding">
            <span class="summary-label">源泉あり小計</span>
            <span class="summary-value">¥${subtotalWithholding.toLocaleString()}</span>
          </div>
          <div class="summary-item subtotal-non-withholding">
            <span class="summary-label">源泉なし小計</span>
            <span class="summary-value">¥${subtotalNonWithholding.toLocaleString()}</span>
          </div>
    `
  }

  summaryRows += `
          <div class="summary-item">
            <span class="summary-label">報酬（税抜）</span>
            <span class="summary-value">¥${baseAmountBeforeTax.toLocaleString()}</span>
          </div>
  `

  // 消費税がある場合
  if (taxAmount > 0) {
    summaryRows += `
          <div class="summary-item">
            <span class="summary-label">消費税（${worker.billingTaxRate}%）</span>
            <span class="summary-value">+ ¥${taxAmount.toLocaleString()}</span>
          </div>
    `
  }

  // 源泉徴収がある場合
  if (withholdingAmount > 0) {
    summaryRows += `
          <div class="summary-item withholding">
            <span class="summary-label">源泉徴収税</span>
            <span class="summary-value withholding-value">- ¥${withholdingAmount.toLocaleString()}</span>
          </div>
    `
  }

  // 最終支払額
  summaryRows += `
          <div class="summary-item total-amount">
            <span class="summary-label">お支払い額</span>
            <span class="summary-value">¥${finalAmount.toLocaleString()}</span>
          </div>
  `

  let html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>勤務報告書 - ${worker.name} - ${monthName}</title>
      <style>
        @media print {
          @page { margin: 2cm; }
          body { margin: 0; }
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
          font-size: 12px;
          line-height: 1.6;
          color: #333;
          padding: 40px;
          max-width: 210mm;
          margin: 0 auto;
        }
        
        .header {
          margin-bottom: 30px;
          border-bottom: 3px solid #333;
          padding-bottom: 15px;
        }
        
        .header h1 {
          font-size: 24px;
          margin-bottom: 10px;
          color: #000;
        }
        
        .header-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .worker-info {
          font-size: 14px;
        }
        
        .worker-info p {
          margin: 5px 0;
        }
        
        .period {
          font-size: 16px;
          font-weight: bold;
          color: #555;
        }
        
        .summary {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
          border: 1px solid #ddd;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #ddd;
        }
        
        .summary-item:last-child {
          border-bottom: none;
        }
        
        .summary-label {
          font-weight: 600;
          color: #666;
        }
        
        .summary-value {
          font-weight: bold;
          color: #000;
        }
        
        .summary-item.withholding {
          background: #fff5f5;
          padding: 8px;
          margin: 0 -8px;
          border-radius: 4px;
        }
        
        .withholding-value {
          color: #dc2626 !important;
        }
        
        .total-amount {
          grid-column: 1 / -1;
          margin-top: 10px;
          padding-top: 15px;
          border-top: 2px solid #333;
          font-size: 16px;
        }
        
        .total-amount .summary-value {
          color: #0066cc;
          font-size: 20px;
        }
        
        .subtotal-withholding {
          background: #fff5f5;
          padding: 8px;
          margin: 0 -8px;
          border-radius: 4px;
        }
        
        .subtotal-non-withholding {
          background: #f5fff5;
          padding: 8px;
          margin: 0 -8px;
          border-radius: 4px;
        }
        
        .breakdown-section {
          margin: 20px 0;
          padding: 15px;
          background: #fafafa;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        
        .breakdown-section h3 {
          font-size: 14px;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px dotted #ddd;
        }
        
        .breakdown-item:last-child {
          border-bottom: none;
        }
        
        .breakdown-item.has-withholding {
          background: #fff5f5;
          margin: 0 -8px;
          padding: 8px;
          border-radius: 4px;
        }
        
        .breakdown-label {
          font-weight: 600;
          flex: 1;
        }
        
        .breakdown-detail {
          color: #666;
          font-size: 11px;
          flex: 1;
          text-align: center;
        }
        
        .breakdown-amount {
          font-weight: bold;
          flex: 0 0 100px;
          text-align: right;
        }
        
        .withholding-badge {
          display: inline-block;
          background: #dc2626;
          color: white;
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 3px;
          margin-left: 5px;
        }
        
        .details {
          margin-top: 30px;
        }
        
        .details h2 {
          font-size: 18px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #333;
        }
        
        .date-group {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .date-header {
          background: #f9f9f9;
          padding: 10px 15px;
          font-weight: bold;
          border-left: 4px solid #0066cc;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .date-total {
          color: #0066cc;
          font-size: 14px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        
        th {
          background: #f0f0f0;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #ddd;
          font-size: 11px;
        }
        
        td {
          padding: 10px;
          border: 1px solid #ddd;
          vertical-align: top;
        }
        
        .time-range {
          font-weight: 600;
          color: #333;
          white-space: nowrap;
        }
        
        .duration {
          color: #0066cc;
          font-weight: bold;
          text-align: right;
        }
        
        .notes {
          color: #666;
          font-size: 11px;
          max-width: 300px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #999;
          font-size: 10px;
        }
        
        .no-data {
          text-align: center;
          padding: 40px;
          color: #999;
          font-style: italic;
        }
        
        .tax-note {
          margin-top: 10px;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 4px;
          font-size: 10px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>勤務報告書 / 請求書</h1>
        <div class="header-info">
          <div class="worker-info">
            <p><strong>氏名:</strong> ${worker.name}</p>
            ${worker.companyName ? `<p><strong>屋号:</strong> ${worker.companyName}</p>` : ''}
            ${worker.teams && worker.teams.length > 0 ? `<p><strong>所属:</strong> ${worker.teams.join(', ')}</p>` : ''}
            <p><strong>時給:</strong> ¥${worker.hourlyRate.toLocaleString()}</p>
          </div>
          <div class="period">${monthName}</div>
        </div>
      </div>
      
      <div class="summary">
        <div class="summary-grid">
          ${summaryRows}
        </div>
        ${withholdingAmount > 0 ? `
        <div class="tax-note">
          <p>※ 源泉徴収税は源泉対象報酬額（税抜 ¥${subtotalWithholding.toLocaleString()}）に対して計算されています。</p>
          <p>※ 100万円以下: ${withholdingRates.rateUnder1M}%、100万円超（超過分）: ${withholdingRates.rateOver1M}%</p>
        </div>
        ` : ''}
      </div>
      
      ${breakdowns.length > 1 ? `
      <div class="breakdown-section">
        <h3>報酬明細</h3>
        ${breakdownRows}
      </div>
      ` : ''}
  `

  if (Object.keys(entriesByDate).length > 0) {
    html += '<div class="details"><h2>勤務詳細</h2>'

    Object.entries(entriesByDate).forEach(([date, dayEntries]) => {
      const dateObj = new Date(date)
      const formattedDate = dateObj.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })

      const dayTotal = getMonthlyTotal(dayEntries)
      
      html += `
        <div class="date-group">
          <div class="date-header">
            <span>${formattedDate}</span>
            <span class="date-total">${formatDuration(dayTotal.hours, dayTotal.minutes)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 120px;">時間</th>
                <th style="width: 80px;">休憩</th>
                <th style="width: 100px;">実働時間</th>
                <th>メモ</th>
              </tr>
            </thead>
            <tbody>
      `

      dayEntries.forEach((entry) => {
        const duration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
        
        html += `
          <tr>
            <td class="time-range">${entry.startTime} - ${entry.endTime}</td>
            <td style="text-align: center;">${entry.breakMinutes}分</td>
            <td class="duration">${formatDuration(duration.hours, duration.minutes)}</td>
            <td class="notes">${entry.notes || '-'}</td>
          </tr>
        `
      })

      html += `
            </tbody>
          </table>
        </div>
      `
    })

    html += '</div>'
  } else {
    html += '<div class="no-data">この期間の勤務記録はありません</div>'
  }

  html += `
      <div class="footer">
        <p>この報告書は時間管理システムより自動生成されました</p>
        <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
      </div>
    </body>
    </html>
  `

  return html
}

export async function downloadPDF(
  worker: Worker,
  entries: TimeEntry[],
  month: Date,
  withholdingRates?: WithholdingTaxRates
): Promise<void> {
  const rates = withholdingRates || DEFAULT_WITHHOLDING_RATES
  const htmlContent = generatePDFContent(worker, entries, month, rates)
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank')
  
  if (!printWindow) {
    alert('ポップアップがブロックされました。ブラウザの設定を確認してください。')
    return
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // Wait for content to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
