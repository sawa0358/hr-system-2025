import { Worker, TimeEntry, Reward } from './types'
import { calculateDuration, formatDuration, getMonthlyTotal } from './time-utils'
import { getWagePatternLabels } from './wage-patterns'

// 源泉徴収率の型定義
export interface WithholdingTaxRates {
  rateUnder1M: number  // 100万円以下の税率（%）
  rateOver1M: number   // 100万円超の税率（%）
}

// 源泉徴収率のデフォルト値（法定税率）
export const DEFAULT_WITHHOLDING_RATES: WithholdingTaxRates = {
  rateUnder1M: 10.21,
  rateOver1M: 20.42,
}

// 源泉徴収税額の計算
function calculateWithholdingTax(amount: number, rates: WithholdingTaxRates): number {
  if (amount <= 0) return 0
  if (amount <= 1000000) {
    return Math.floor(amount * (rates.rateUnder1M / 100))
  } else {
    const under1M = Math.floor(1000000 * (rates.rateUnder1M / 100))
    const over1M = Math.floor((amount - 1000000) * (rates.rateOver1M / 100))
    return under1M + over1M
  }
}

function formatDateLabel(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (!year || !month || !day) {
    return dateStr
  }

  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export function generatePDFContent(
  worker: Worker,
  entries: TimeEntry[],
  month: Date,
  rewards: Reward[] = [],
  withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES
): string {
  const monthName = month.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  // 全エントリの時間合計を計算
  const monthlyTotal = getMonthlyTotal(entries)
  const totalHours = monthlyTotal.hours + monthlyTotal.minutes / 60
  
  // 時給パターン別の集計（wagePattern が設定されているエントリのみ対象）
  const entriesByPattern = entries.reduce((acc, entry) => {
    const pattern = entry.wagePattern
    if (!pattern) {
      return acc
    }
    if (!acc[pattern]) acc[pattern] = []
    acc[pattern].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  // 時給パターン別の時間と金額を計算
  const patternTotals = {
    A: { hours: 0, minutes: 0, amount: 0 },
    B: { hours: 0, minutes: 0, amount: 0 },
    C: { hours: 0, minutes: 0, amount: 0 },
  }

  Object.entries(entriesByPattern).forEach(([pattern, patternEntries]) => {
    const total = getMonthlyTotal(patternEntries)
    const hours = total.hours + total.minutes / 60
    const rate =
      pattern === 'A'
        ? worker.hourlyRate
        : pattern === 'B'
        ? worker.hourlyRateB || worker.hourlyRate
        : worker.hourlyRateC || worker.hourlyRate
    patternTotals[pattern as 'A' | 'B' | 'C'] = {
      hours: total.hours,
      minutes: total.minutes,
      amount: hours * rate,
    }
  })

  // 回数パターン別の集計と金額を計算（countPatternが設定されているエントリから計算）
  const countTotals = {
    A: { count: 0, amount: 0 },
    B: { count: 0, amount: 0 },
    C: { count: 0, amount: 0 },
  }

  entries.forEach(entry => {
    if (entry.countPattern) {
      const pattern = entry.countPattern
      const count = entry.count || 1
      const rate =
        pattern === 'A'
          ? worker.countRateA || 0
          : pattern === 'B'
          ? worker.countRateB || 0
          : worker.countRateC || 0
      countTotals[pattern as 'A' | 'B' | 'C'].count += count
      countTotals[pattern as 'A' | 'B' | 'C'].amount += count * rate
    }
  })

  const monthlyFixedAmount =
    typeof worker.monthlyFixedAmount === 'number' && worker.monthlyFixedAmount > 0
      ? worker.monthlyFixedAmount
      : null

  // 特別報酬の計算
  const rewardAmount = rewards.reduce((acc, r) => acc + r.amount, 0)

  // パターン別金額の小計（PDF表示・合計計算の両方で利用）
  const hourlyPatternTotalAmount =
    patternTotals.A.amount + patternTotals.B.amount + patternTotals.C.amount
  const countPatternTotalAmount =
    countTotals.A.amount + countTotals.B.amount + countTotals.C.amount

  // 時給パターンの合計 ＋ 回数パターンの合計 ＋ 月額固定 ＋ 特別報酬 を「報酬合計」として扱う（税抜）
  const totalAmount =
    hourlyPatternTotalAmount + countPatternTotalAmount + (monthlyFixedAmount ?? 0) + rewardAmount

  // 消費税計算用（ワーカーごとの設定）
  const baseAmount = totalAmount
  const billingTaxEnabled: boolean = (worker as any).billingTaxEnabled ?? false
  const workerTaxRateRaw = (worker as any).billingTaxRate
  // 税率は「10.0」などの百分率で保存する想定。未設定の場合はデフォルト10%を使用
  const effectiveTaxRatePercent: number =
    billingTaxEnabled && typeof workerTaxRateRaw === 'number'
      ? workerTaxRateRaw
      : billingTaxEnabled
      ? 10
      : 0
  const taxAmount: number =
    billingTaxEnabled && effectiveTaxRatePercent > 0
      ? Math.floor(baseAmount * (effectiveTaxRatePercent / 100))
      : 0
  const totalWithTax: number = baseAmount + taxAmount

  // 源泉徴収税額の計算（対象の場合のみ）
  const withholdingTaxEnabled: boolean = (worker as any).withholdingTaxEnabled ?? false
  const withholdingTaxAmount: number = withholdingTaxEnabled
    ? calculateWithholdingTax(baseAmount, withholdingRates)
    : 0
  
  // 最終支払額（消費税を加算し、源泉徴収税を減算）
  const finalPaymentAmount: number = totalWithTax - withholdingTaxAmount

  // DB優先でパターン名を取得
  const scopeKey = (worker as any).employeeId || worker.id
  const baseLabels = getWagePatternLabels(scopeKey)
  const wageLabels = {
    A: worker.wagePatternLabelA || baseLabels.A,
    B: worker.wagePatternLabelB || baseLabels.B,
    C: worker.wagePatternLabelC || baseLabels.C,
  }
  const countLabels = {
    A: worker.countPatternLabelA || '回数Aパターン',
    B: worker.countPatternLabelB || '回数Bパターン',
    C: worker.countPatternLabelC || '回数Cパターン',
  }

  const teamsText =
    Array.isArray(worker.teams) && worker.teams.length > 0
      ? worker.teams.join(', ')
      : ''

  // Sort entries by date (文字列比較でOK: YYYY-MM-DD形式)
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  // Group by date
  const entriesByDate = sortedEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = []
    }
    acc[entry.date].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  let html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>勤務報告書 / 請求書 - ${worker.name} - ${monthName}</title>
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
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        
        th {
          background: #f0f0f0;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #ddd;
          font-size: 11px;
        }
        
        td {
          padding: 6px 10px;
          border: 1px solid #ddd;
          vertical-align: top;
          font-size: 11px;
        }
        
        .date-cell {
          white-space: nowrap;
          background: #fafafa;
          font-weight: 600;
        }
        
        .date-total-small {
          margin-top: 4px;
          font-size: 10px;
          color: #0066cc;
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
          white-space: nowrap;
        }
        
        .notes {
          color: #666;
          font-size: 11px;
        }
        
        .notes-row {
          background: #fafafa;
        }
        
        .notes-row td {
          border-top: none;
        }
        
        .notes-cell {
          color: #555;
          font-size: 10px;
          padding: 6px 10px 8px 10px;
          line-height: 1.5;
          word-break: break-all;
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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>勤務報告書 / 請求書</h1>
        <div class="header-info">
          <div class="worker-info">
            <p><strong>氏名:</strong> ${worker.name}</p>
            ${teamsText ? `<p><strong>所属:</strong> ${teamsText}</p>` : ''}
            <p><strong>時給設定:</strong></p>
            <p style="margin-left: 1em; font-size: 11px;">
              ${wageLabels.A}: ¥${worker.hourlyRate.toLocaleString()}
              ${worker.hourlyRateB ? ` ／ ${wageLabels.B}: ¥${worker.hourlyRateB.toLocaleString()}` : ''}
              ${worker.hourlyRateC ? ` ／ ${wageLabels.C}: ¥${worker.hourlyRateC.toLocaleString()}` : ''}
            </p>
            ${
              monthlyFixedAmount
                ? `<p><strong>月額固定:</strong> ¥${monthlyFixedAmount.toLocaleString()}</p>`
                : ''
            }
            ${
              worker.transferDestination
                ? `<p><strong>振込先:</strong> <span style="white-space: pre-wrap;">${worker.transferDestination}</span></p>`
                : ''
            }
          </div>
          <div class="period">${monthName}</div>
        </div>
      </div>
      
      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">勤務日数</span>
            <span class="summary-value">${Object.keys(entriesByDate).length}日</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">総勤務時間</span>
            <span class="summary-value">${formatDuration(monthlyTotal.hours, monthlyTotal.minutes)}</span>
          </div>
          ${
            patternTotals.A.hours + patternTotals.A.minutes > 0 || 
            patternTotals.B.hours + patternTotals.B.minutes > 0 || 
            patternTotals.C.hours + patternTotals.C.minutes > 0
              ? `
          <div class="summary-item" style="grid-column: 1 / -1; font-size: 11px; padding-top: 8px; border-top: 1px solid #ddd;">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start;">
              <div style="display: flex; gap: 16px; flex-wrap: wrap; flex: 1;">
                ${patternTotals.A.hours + patternTotals.A.minutes > 0 ? `
                  <div>
                    <span class="summary-label">${wageLabels.A}:</span>
                    <span class="summary-value">${formatDuration(patternTotals.A.hours, patternTotals.A.minutes)} × ¥${worker.hourlyRate.toLocaleString()} = ¥${Math.floor(patternTotals.A.amount).toLocaleString()}</span>
                  </div>
                ` : ''}
                ${patternTotals.B.hours + patternTotals.B.minutes > 0 && worker.hourlyRateB ? `
                  <div>
                    <span class="summary-label">${wageLabels.B}:</span>
                    <span class="summary-value">${formatDuration(patternTotals.B.hours, patternTotals.B.minutes)} × ¥${worker.hourlyRateB.toLocaleString()} = ¥${Math.floor(patternTotals.B.amount).toLocaleString()}</span>
                  </div>
                ` : ''}
                ${patternTotals.C.hours + patternTotals.C.minutes > 0 && worker.hourlyRateC ? `
                  <div>
                    <span class="summary-label">${wageLabels.C}:</span>
                    <span class="summary-value">${formatDuration(patternTotals.C.hours, patternTotals.C.minutes)} × ¥${worker.hourlyRateC.toLocaleString()} = ¥${Math.floor(patternTotals.C.amount).toLocaleString()}</span>
                  </div>
                ` : ''}
              </div>
              <span class="summary-value">¥${Math.floor(hourlyPatternTotalAmount).toLocaleString()}</span>
            </div>
          </div>
              `
              : ''
          }
          ${
            countTotals.A.count + countTotals.B.count + countTotals.C.count > 0
              ? `
          <div class="summary-item" style="grid-column: 1 / -1; font-size: 11px; padding-top: 6px; border-top: 1px dashed #ccc;">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start;">
              <div style="display: flex; gap: 16px; flex-wrap: wrap; flex: 1;">
                ${countTotals.A.count > 0 && worker.countRateA ? `
                  <div>
                    <span class="summary-label">${countLabels.A}:</span>
                    <span class="summary-value">${countTotals.A.count}回 × ¥${worker.countRateA.toLocaleString()} = ¥${Math.floor(countTotals.A.amount).toLocaleString()}</span>
                  </div>
                ` : ''}
                ${countTotals.B.count > 0 && worker.countRateB ? `
                  <div>
                    <span class="summary-label">${countLabels.B}:</span>
                    <span class="summary-value">${countTotals.B.count}回 × ¥${worker.countRateB.toLocaleString()} = ¥${Math.floor(countTotals.B.amount).toLocaleString()}</span>
                  </div>
                ` : ''}
                ${countTotals.C.count > 0 && worker.countRateC ? `
                  <div>
                    <span class="summary-label">${countLabels.C}:</span>
                    <span class="summary-value">${countTotals.C.count}回 × ¥${worker.countRateC.toLocaleString()} = ¥${Math.floor(countTotals.C.amount).toLocaleString()}</span>
                  </div>
                ` : ''}
              </div>
              <span class="summary-value">¥${Math.floor(countPatternTotalAmount).toLocaleString()}</span>
            </div>
          </div>
              `
              : ''
          }
          ${
            rewards.length > 0
              ? `
          <div class="summary-item" style="grid-column: 1 / -1; font-size: 11px; padding-top: 6px; border-top: 1px dashed #ccc;">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start;">
                <div style="display: flex; gap: 8px; flex: 1;">
                    <span class="summary-label">特別報酬・経費:</span>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        ${rewards.map(r => `
                            <span>${r.description} (¥${r.amount.toLocaleString()})</span>
                        `).join('')}
                    </div>
                </div>
                <span class="summary-value">¥${rewardAmount.toLocaleString()}</span>
            </div>
          </div>
              `
              : ''
          }
          ${
            billingTaxEnabled
              ? `
          <div class="summary-item" style="grid-column: 1 / -1; padding-top: 10px; border-top: 2px solid #333;">
            <span class="summary-label">税抜小計</span>
            <span class="summary-value">¥${Math.floor(baseAmount).toLocaleString()}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">消費税（${effectiveTaxRatePercent}%）</span>
            <span class="summary-value">¥${taxAmount.toLocaleString()}</span>
          </div>
          <div class="summary-item total-amount">
            <span class="summary-label">税込合計</span>
            <span class="summary-value">¥${Math.floor(totalWithTax).toLocaleString()}</span>
          </div>
              `
              : `
          <div class="summary-item total-amount">
            <span class="summary-label">報酬合計</span>
            <span class="summary-value">¥${Math.floor(baseAmount).toLocaleString()}</span>
          </div>
              `
          }
          ${
            withholdingTaxEnabled
              ? `
          <div class="summary-item" style="padding-top: 10px; border-top: 1px dashed #666;">
            <span class="summary-label">源泉徴収税額</span>
            <span class="summary-value" style="color: #c00;">-¥${withholdingTaxAmount.toLocaleString()}</span>
          </div>
          <div class="summary-item total-amount" style="background: #e8f5e9; padding: 8px; border-radius: 4px;">
            <span class="summary-label" style="font-weight: bold;">差引支払額</span>
            <span class="summary-value" style="font-weight: bold; font-size: 1.2em;">¥${Math.floor(finalPaymentAmount).toLocaleString()}</span>
          </div>
          <div class="tax-note" style="font-size: 10px; color: #666; margin-top: 8px;">
            <p>※ 源泉徴収税は報酬額（税抜）に対して計算されています。</p>
            <p>※ 100万円以下: ${withholdingRates.rateUnder1M}%、100万円超（超過分）: ${withholdingRates.rateOver1M}%</p>
          </div>
              `
              : ''
          }
        </div>
      </div>
  `

  if (Object.keys(entriesByDate).length > 0) {
    html += `
      <div class="details">
        <h2>勤務詳細</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 170px;">日付 / 合計時間</th>
              <th style="width: 140px;">時間帯</th>
              <th style="width: 70px;">休憩</th>
              <th style="width: 110px;">実働時間</th>
              <th>パターン</th>
              <th style="width: 100px;">小計</th>
            </tr>
          </thead>
          <tbody>
    `

    Object.entries(entriesByDate).forEach(([date, dayEntries]) => {
      const formattedDate = formatDateLabel(date)
      const dayTotal = getMonthlyTotal(dayEntries)

      // 同じ日付内では登録が古い順（createdAt昇順）に並べる
      const sortedDayEntries = [...dayEntries].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return aTime - bTime
      })

      // メモがあるエントリの数をカウント（rowspan計算用）
      const entriesWithNotes = sortedDayEntries.filter(e => e.notes && e.notes.trim()).length
      // 日付セルのrowspanは、エントリ数 + メモ行数
      const dateRowspan = sortedDayEntries.length + entriesWithNotes

      sortedDayEntries.forEach((entry, index) => {
        const duration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
        const pattern = (entry as any).wagePattern as 'A' | 'B' | 'C' | null

        // 時給パターンによる金額
        let hourlyAmount = 0
        let hourlyLabel = ''
        let hourlyInfo = ''
        if (pattern === 'A' || pattern === 'B' || pattern === 'C') {
          const rate =
            pattern === 'A'
              ? worker.hourlyRate
              : pattern === 'B'
              ? worker.hourlyRateB || worker.hourlyRate
              : worker.hourlyRateC || worker.hourlyRate
          const hours = duration.hours + duration.minutes / 60
          hourlyAmount = Math.floor(hours * rate)
          hourlyLabel =
            pattern === 'A' ? wageLabels.A : pattern === 'B' ? wageLabels.B : wageLabels.C
          const durationText = formatDuration(duration.hours, duration.minutes)
          // 例: 「1時間0分／Bパターン（¥1,500）」のように表示
          hourlyInfo = `${durationText}／${hourlyLabel}（¥${rate.toLocaleString()}）`
        }

        // 回数パターンの金額（あれば加算）
        let countInfo = ''
        let countAmount = 0
        if (entry.countPattern) {
          const cPattern = entry.countPattern
          const count = entry.count || 1
          const cRate =
            cPattern === 'A'
              ? worker.countRateA || 0
              : cPattern === 'B'
              ? worker.countRateB || 0
              : worker.countRateC || 0
          countAmount = count * cRate
          const cLabel =
            cPattern === 'A' ? countLabels.A :
            cPattern === 'B' ? countLabels.B :
            countLabels.C
          countInfo = cRate > 0
            ? `${cLabel}（${count}回×¥${cRate.toLocaleString()}）`
            : `${cLabel}（${count}回）`
        }

        const subtotal = hourlyAmount + countAmount

        const hourlyDisplay = hourlyInfo || hourlyLabel

        let patternLabel = '-'
        if (hourlyDisplay && countInfo) {
          // 両方ある場合は「時給／回数」の2行表示
          patternLabel = `${hourlyDisplay}<br/><span style="font-size: 10px; color: #555;">＋ ${countInfo}</span>`
        } else if (hourlyDisplay) {
          patternLabel = hourlyDisplay
        } else if (countInfo) {
          patternLabel = countInfo
        }

        // メイン行
        html += '<tr>'

        if (index === 0) {
          html += `
            <td class="date-cell" rowspan="${dateRowspan}">
              <div>${formattedDate}</div>
              <div class="date-total-small">${formatDuration(
                dayTotal.hours,
                dayTotal.minutes
              )}</div>
            </td>
          `
        }

        html += `
          <td class="time-range">${entry.startTime} - ${entry.endTime}</td>
          <td style="text-align: center; white-space: nowrap;">${entry.breakMinutes}分</td>
          <td class="duration">${formatDuration(duration.hours, duration.minutes)}</td>
          <td style="text-align: center; font-size: 10px; white-space: nowrap;">${patternLabel}</td>
          <td style="text-align: right; font-weight: 600; white-space: nowrap;">¥${subtotal.toLocaleString()}</td>
        </tr>
        `

        // メモ行（メモがある場合のみ表示）
        if (entry.notes && entry.notes.trim()) {
          // メモを2行分（約100文字）に切り詰め
          const maxLength = 100
          const trimmedNotes = entry.notes.length > maxLength 
            ? entry.notes.substring(0, maxLength) + '...' 
            : entry.notes
          html += `
        <tr class="notes-row">
          <td colspan="5" class="notes-cell">📝 ${trimmedNotes}</td>
        </tr>
          `
        }
      })
    })

    html += `
          </tbody>
        </table>
      </div>
    `
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

export function downloadPDF(
  worker: Worker,
  entries: TimeEntry[],
  month: Date,
  rewards: Reward[] = [],
  withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES
): void {
  const htmlContent = generatePDFContent(worker, entries, month, rewards, withholdingRates)
  
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

interface WorkerWithEntries {
  worker: Worker
  entries: TimeEntry[]
  rewards?: Reward[]
}

/**
 * 個人PDF出力を再利用して全員分のPDFを生成
 * 各ワーカーのgeneratePDFContentを呼び出し、body部分を抽出して結合
 */
export function generateCombinedPDFContent(
  items: WorkerWithEntries[],
  month: Date,
  withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES
): string {
  const monthName = month.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })
  
  // 各ワーカーの個人PDFを生成し、body部分を抽出
  const workerSections = items.map((item) => {
    const individualPDF = generatePDFContent(item.worker, item.entries, month, item.rewards, withholdingRates)
    
    // <body>タグの中身を抽出（開始タグと終了タグを除く）
    const bodyMatch = individualPDF.match(/<body[^>]*>([\s\S]*)<\/body>/)
    if (bodyMatch && bodyMatch[1]) {
      // worker-sectionクラスでラップして改ページ制御
      return `<div class="worker-section">${bodyMatch[1]}</div>`
    }
    return ''
  }).filter(section => section !== '')

  // 個人PDFのスタイルを取得（最初の個人PDFから抽出）
  const firstPDF = items.length > 0 ? generatePDFContent(items[0].worker, items[0].entries, month, items[0].rewards) : ''
  const styleMatch = firstPDF.match(/<style>([\s\S]*?)<\/style>/)
  const styles = styleMatch ? styleMatch[1] : ''
  
  // 改ページ制御用のスタイルを追加
  const combinedStyles = `
    ${styles}
    
    .worker-section {
      page-break-after: always;
    }
    
    .worker-section:last-child {
      page-break-after: auto;
    }
  `

  // HTMLドキュメントを構築
  let html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>勤務報告書 / 請求書（複数人） - ${monthName}</title>
      <style>${combinedStyles}</style>
    </head>
    <body>
  `

  // 各ワーカーのセクションを結合
  html += workerSections.join('\n')

  html += `
    </body>
    </html>
  `

  return html
}

export function downloadCombinedPDF(
  items: WorkerWithEntries[],
  month: Date,
  withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES
): void {
  if (!items || items.length === 0) {
    alert('PDF出力対象のワーカーがいません。')
    return
  }

  const htmlContent = generateCombinedPDFContent(items, month, withholdingRates)

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('ポップアップがブロックされました。ブラウザの設定を確認してください。')
    return
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
