import { Worker, TimeEntry } from './types'
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
  const totalHours = monthlyTotal.hours + monthlyTotal.minutes / 60
  const baseAmount = Math.floor(totalHours * worker.hourlyRate)

  // 消費税計算
  let taxAmount = 0
  if (worker.billingTaxEnabled && worker.billingTaxRate) {
    taxAmount = Math.floor(baseAmount * (worker.billingTaxRate / 100))
  }

  // 消費税込みの小計
  const subtotalWithTax = baseAmount + taxAmount

  // 源泉徴収計算（源泉徴収対象の場合のみ）
  let withholdingAmount = 0
  if (worker.withholdingTaxEnabled) {
    // 源泉徴収は報酬額（税抜）に対して計算
    withholdingAmount = calculateWithholdingTax(baseAmount, withholdingRates)
  }

  // 最終支払額
  const finalAmount = subtotalWithTax - withholdingAmount

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
          <div class="summary-item">
            <span class="summary-label">報酬（税抜）</span>
            <span class="summary-value">¥${baseAmount.toLocaleString()}</span>
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
        ${worker.withholdingTaxEnabled ? `
        <div class="tax-note">
          <p>※ 源泉徴収税は報酬額（税抜）に対して計算されています。</p>
          <p>※ 100万円以下: ${withholdingRates.rateUnder1M}%、100万円超（超過分）: ${withholdingRates.rateOver1M}%</p>
        </div>
        ` : ''}
      </div>
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
