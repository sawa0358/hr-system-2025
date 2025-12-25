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

type PatternBreakdown = {
  label: string
  rate: number
  amount: number
  hours?: number
  minutes?: number
  count?: number
  isWithholding: boolean
}

function calculatePatternBreakdowns(
  worker: Worker,
  entries: TimeEntry[],
  wageLabels: { A: string; B: string; C: string },
  countLabels: { A: string; B: string; C: string },
  rewards: Reward[]
): PatternBreakdown[] {
  const breakdowns: PatternBreakdown[] = []
  const globalWithholding = (worker as any).withholdingTaxEnabled ?? false

  // 時給パターン別の集計
  const hourlyTotals: Record<string, { hours: number; minutes: number }> = {
    A: { hours: 0, minutes: 0 },
    B: { hours: 0, minutes: 0 },
    C: { hours: 0, minutes: 0 },
  }

  // 回数パターン別の集計
  const countTotals: Record<string, number> = { A: 0, B: 0, C: 0 }

  entries.forEach((entry) => {
    // 時給パターンを集計（未設定はAとして計上）
    const wagePattern = (entry as any).wagePattern || 'A'
    const duration = calculateDuration(entry.startTime, entry.endTime, entry.breakMinutes)
    hourlyTotals[wagePattern].hours += duration.hours
    hourlyTotals[wagePattern].minutes += duration.minutes

    // 回数パターンを集計
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

  // 時給パターン
  const hourlyRates = {
    A: worker.hourlyRate,
    B: worker.hourlyRateB || worker.hourlyRate,
    C: worker.hourlyRateC || worker.hourlyRate,
  };
  (['A', 'B', 'C'] as Array<'A' | 'B' | 'C'>).forEach((p) => {
    const totalHours = hourlyTotals[p].hours + hourlyTotals[p].minutes / 60
    const amount = Math.floor(totalHours * (hourlyRates[p] || 0))
    if (totalHours > 0 && amount > 0) {
      breakdowns.push({
        label: wageLabels[p],
        hours: hourlyTotals[p].hours,
        minutes: hourlyTotals[p].minutes,
        rate: hourlyRates[p] || 0,
        amount,
        isWithholding:
          (p === 'A'
            ? worker.withholdingHourlyA
            : p === 'B'
              ? worker.withholdingHourlyB
              : worker.withholdingHourlyC) ?? globalWithholding,
      })
    }
  })

  // 回数パターン
  const countRates = {
    A: worker.countRateA || 0,
    B: worker.countRateB || 0,
    C: worker.countRateC || 0,
  };
  (['A', 'B', 'C'] as Array<'A' | 'B' | 'C'>).forEach((p) => {
    const count = countTotals[p]
    const amount = Math.floor(count * (countRates[p] || 0))
    if (count > 0 && amount > 0) {
      breakdowns.push({
        label: countLabels[p],
        count,
        rate: countRates[p] || 0,
        amount,
        isWithholding:
          (p === 'A'
            ? worker.withholdingCountA
            : p === 'B'
              ? worker.withholdingCountB
              : worker.withholdingCountC) ?? globalWithholding,
      })
    }
  })

  // 月額固定
  const monthlyFixedAmount =
    typeof worker.monthlyFixedAmount === 'number' && worker.monthlyFixedAmount > 0
      ? worker.monthlyFixedAmount
      : null
  if (monthlyFixedAmount) {
    breakdowns.push({
      label: '月額固定',
      rate: monthlyFixedAmount,
      amount: monthlyFixedAmount,
      isWithholding: (worker as any).withholdingMonthlyFixed ?? globalWithholding,
    })
  }

  // 特別報酬（集計のみ、明細は従来通り別枠で表示）
  const rewardAmount = rewards.reduce((acc, r) => acc + r.amount, 0)
  if (rewardAmount > 0) {
    breakdowns.push({
      label: '特別報酬・経費',
      rate: rewardAmount,
      amount: rewardAmount,
      isWithholding: globalWithholding,
    })
  }

  return breakdowns
}

export function generatePDFContent(
  worker: Worker,
  entries: TimeEntry[],
  month: Date,
  rewards: Reward[] = [],
  withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES,
  checklistReward: number = 0
): string {
  const monthName = month.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  // 全エントリの時間合計を計算
  const monthlyTotal = getMonthlyTotal(entries)

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

  // 1. 各パターンの詳細（時給・回数・固定・報酬）を計算・集計
  const breakdowns = calculatePatternBreakdowns(worker, entries, wageLabels, countLabels, rewards);

  // チェックリスト報酬を追加
  if (checklistReward > 0) {
    breakdowns.push({
      label: '業務チェック報酬',
      rate: 0,
      amount: checklistReward,
      isWithholding: false, // チェックリスト報酬は源泉なし
    });
  }

  // 2. 源泉あり/なしの小計を算出
  const subtotalWithholding = breakdowns
    .filter((b) => b.isWithholding)
    .reduce((sum, b) => sum + b.amount, 0);
  const subtotalNonWithholding = breakdowns
    .filter((b) => !b.isWithholding)
    .reduce((sum, b) => sum + b.amount, 0);
  const baseAmountBeforeTax = subtotalWithholding + subtotalNonWithholding;

  // 3. 消費税計算
  const billingTaxEnabled: boolean = (worker as any).billingTaxEnabled ?? false;
  const workerTaxRateRaw = (worker as any).billingTaxRate;
  const taxType: 'exclusive' | 'inclusive' = (worker as any).taxType || 'exclusive';
  const effectiveTaxRatePercent: number =
    billingTaxEnabled && typeof workerTaxRateRaw === 'number'
      ? workerTaxRateRaw
      : billingTaxEnabled
        ? 10
        : 0;

  // 源泉あり小計・源泉なし小計それぞれの税抜金額を算出
  let subtotalWithholdingExclTax: number; // 源泉あり小計の税抜金額
  let subtotalNonWithholdingExclTax: number; // 源泉なし小計の税抜金額

  if (billingTaxEnabled && effectiveTaxRatePercent > 0 && taxType === 'inclusive') {
    // 内税の場合：小計に税が含まれているので税抜金額に変換
    subtotalWithholdingExclTax = Math.floor(subtotalWithholding / (1 + effectiveTaxRatePercent / 100));
    subtotalNonWithholdingExclTax = Math.floor(subtotalNonWithholding / (1 + effectiveTaxRatePercent / 100));
  } else {
    // 外税または消費税なしの場合：小計がそのまま税抜金額
    subtotalWithholdingExclTax = subtotalWithholding;
    subtotalNonWithholdingExclTax = subtotalNonWithholding;
  }

  const baseAmountExclTax = subtotalWithholdingExclTax + subtotalNonWithholdingExclTax;

  let taxAmount: number;
  let totalWithTax: number;

  if (billingTaxEnabled && effectiveTaxRatePercent > 0) {
    if (taxType === 'inclusive') {
      // 内税：税抜金額から税額を逆算
      taxAmount = baseAmountBeforeTax - baseAmountExclTax;
      totalWithTax = baseAmountBeforeTax;
    } else {
      // 外税：税抜金額に税率を掛ける
      taxAmount = Math.floor(baseAmountExclTax * (effectiveTaxRatePercent / 100));
      totalWithTax = baseAmountExclTax + taxAmount;
    }
  } else {
    taxAmount = 0;
    totalWithTax = baseAmountExclTax;
  }

  // 4. 源泉徴収税額の計算（源泉あり小計の税抜金額に対してのみ計算）
  const hasWithholding = subtotalWithholdingExclTax > 0;
  const withholdingTaxAmount: number = hasWithholding
    ? calculateWithholdingTax(subtotalWithholdingExclTax, withholdingRates)
    : 0;

  // 5. 最終支払額
  const finalPaymentAmount: number = totalWithTax - withholdingTaxAmount;

  // --- 表示用HTMLの組み立て ---

  // パターン別詳細行の生成（サマリー欄）
  const breakdownRowsHtml = breakdowns.map(item => {
    let detailText = '';
    if (item.hours !== undefined && item.minutes !== undefined) {
      detailText = `${formatDuration(item.hours, item.minutes)} × ¥${item.rate.toLocaleString()} = `;
    } else if (item.count !== undefined) {
      detailText = `${item.count}回 × ¥${item.rate.toLocaleString()} = `;
    }

    // 特別報酬・経費の場合は内訳を表示
    if (item.label === '特別報酬・経費' && rewards.length > 0) {
      const rewardDetailsHtml = rewards.map(r => {
        let dateStr = '';
        if (r.date) {
          const d = new Date(r.date);
          dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
        }
        return `<span style="font-size: 10px; color: #555; margin-right: 12px;">・${dateStr ? `(${dateStr}) ` : ''}${r.description || '報酬'}: ¥${r.amount.toLocaleString()}</span>`;
      }).join('');

      return `
        <div class="summary-item" style="grid-column: 1 / -1; font-size: 11px; padding-top: 4px; border-top: 1px dashed #eee;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
            <div style="flex: 1;">
              <div style="margin-bottom: 4px;">
                ${item.label}${item.isWithholding ? ' <span style="color: #c00; font-size: 0.8em; border: 1px solid #c00; padding: 0 2px; border-radius: 2px; margin-left: 4px;">源泉対象</span>' : ''}:
              </div>
              <div style="display: flex; flex-wrap: wrap;">${rewardDetailsHtml}</div>
            </div>
            <span style="font-weight: bold; white-space: nowrap; margin-left: 16px;">¥${item.amount.toLocaleString()}</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="summary-item" style="grid-column: 1 / -1; font-size: 11px; padding-top: 4px; border-top: 1px dashed #eee;">
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <span>
            ${item.label}${item.isWithholding ? ' <span style="color: #c00; font-size: 0.8em; border: 1px solid #c00; padding: 0 2px; border-radius: 2px; margin-left: 4px;">源泉対象</span>' : ''}:
            <span style="color: #666; margin-left: 8px;">${detailText}</span>
          </span>
          <span style="font-weight: bold;">¥${item.amount.toLocaleString()}</span>
        </div>
      </div>
    `;
  }).join('');

  const teamsText =
    Array.isArray(worker.teams) && worker.teams.length > 0
      ? worker.teams.join(', ')
      : ''

  // 時給設定の項目を動的に生成（0円や未設定は除外）
  const wageSettings: string[] = []
  if (worker.hourlyRate && worker.hourlyRate > 0) {
    wageSettings.push(`${wageLabels.A}: ¥${worker.hourlyRate.toLocaleString()}`)
  }
  if (worker.hourlyRateB && worker.hourlyRateB > 0) {
    wageSettings.push(`${wageLabels.B}: ¥${worker.hourlyRateB.toLocaleString()}`)
  }
  if (worker.hourlyRateC && worker.hourlyRateC > 0) {
    wageSettings.push(`${wageLabels.C}: ¥${worker.hourlyRateC.toLocaleString()}`)
  }

  // 回数設定の項目を動的に生成（0円や未設定は除外）
  const countSettings: string[] = []
  if (worker.countRateA && worker.countRateA > 0) {
    countSettings.push(`${countLabels.A}: ¥${worker.countRateA.toLocaleString()}`)
  }
  if (worker.countRateB && worker.countRateB > 0) {
    countSettings.push(`${countLabels.B}: ¥${worker.countRateB.toLocaleString()}`)
  }
  if (worker.countRateC && worker.countRateC > 0) {
    countSettings.push(`${countLabels.C}: ¥${worker.countRateC.toLocaleString()}`)
  }

  const hasWageSettings = wageSettings.length > 0
  const hasCountSettings = countSettings.length > 0

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
          background: #fff;
        }
        
        .header {
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .header-title {
          background: #f5f5f5;
          padding: 15px 20px;
          margin-bottom: 15px;
          border-radius: 8px;
        }
        
        .header-title h1 {
          font-size: 24px;
          margin-bottom: 0;
          color: #000;
        }
        
        .period {
          font-size: 14px;
          color: #666;
        }
        
        .header-info {
          display: flex;
          gap: 40px;
          margin-top: 15px;
        }
        
        .worker-info p, .worker-info-right p {
          margin-bottom: 3px;
        }
        
        .summary {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border: 1px solid #eee;
        }
        
        .summary-grid {
          display: grid;
          grid-template-cols: repeat(2, 1fr);
          gap: 15px;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding-bottom: 8px;
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
        <div class="header-title">
          <h1>勤務報告書 / 請求書　　　<span style="font-size: 18px;">対象期間: ${monthName}</span></h1>
        </div>
        ${(worker as any).billingClientName ? `
        <div style="margin-top: 12px; margin-bottom: 8px; font-size: 18px; font-weight: bold;">
          ${(worker as any).billingClientName} 御中
        </div>
        ` : ''}
        <div class="header-info">
          <div class="worker-info">
            ${worker.companyName ? `<p><strong>${worker.companyName}</strong></p>` : ''}
            <p><strong>氏名:</strong> ${worker.name}</p>
            ${worker.address ? `<p><strong>住所:</strong> ${worker.address}</p>` : ''}
            ${worker.phone ? `<p><strong>電話:</strong> ${worker.phone}</p>` : ''}
            ${worker.email ? `<p><strong>メール:</strong> ${worker.email}</p>` : ''}
          </div>

          <div class="worker-info-right">
            ${teamsText ? `<p><strong>所属:</strong> ${teamsText}</p>` : ''}
            ${hasWageSettings ? `
            <p><strong>時給設定:</strong></p>
            <p style="margin-left: 1em; font-size: 11px; margin-top: 0;">
              ${wageSettings.join(' ／ ')}
            </p>
            ` : ''}
            ${hasCountSettings ? `
            <p><strong>回数設定:</strong></p>
            <p style="margin-left: 1em; font-size: 11px; margin-top: 0;">
              ${countSettings.join(' ／ ')}
            </p>
            ` : ''}
            ${worker.monthlyFixedAmount
      ? `<p><strong>月額固定:</strong> ¥${worker.monthlyFixedAmount.toLocaleString()}</p>`
      : ''
    }
            ${worker.transferDestination
      ? `<p style="margin-top: 8px;"><strong>振込先:</strong></p><p style="margin-left: 1em; font-size: 11px; white-space: pre-wrap;">${worker.transferDestination}</p>`
      : ''
    }
          </div>
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
          ${breakdownRowsHtml}
          ${billingTaxEnabled
      ? taxType === 'inclusive'
        ? `
          <div class="summary-item" style="grid-column: 1 / -1; padding-top: 10px; border-top: 2px solid #333;">
            <span class="summary-label">報酬額（税込）</span>
            <span class="summary-value">¥${Math.floor(totalWithTax).toLocaleString()}</span>
          </div>
          <div class="summary-item" style="font-size: 11px; color: #666;">
            <span class="summary-label">　└ 内税額（${effectiveTaxRatePercent}%）</span>
            <span class="summary-value">うち ¥${taxAmount.toLocaleString()}</span>
          </div>
          <div class="summary-item" style="font-size: 11px; color: #666;">
            <span class="summary-label">　└ 税抜金額</span>
            <span class="summary-value">¥${Math.floor(baseAmountExclTax).toLocaleString()}</span>
          </div>
                `
        : `
          <div class="summary-item" style="grid-column: 1 / -1; padding-top: 10px; border-top: 2px solid #333;">
            <span class="summary-label">税抜小計</span>
            <span class="summary-value">¥${Math.floor(baseAmountExclTax).toLocaleString()}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">消費税（${effectiveTaxRatePercent}%・外税）</span>
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
            <span class="summary-value">¥${Math.floor(baseAmountBeforeTax).toLocaleString()}</span>
          </div>
              `
    }
          ${hasWithholding
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
            <p>※ 源泉徴収税は「源泉あり小計」（税抜）に対して計算しています。</p>
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
          <td style="text-align: center;">${entry.startTime} - ${entry.endTime}</td>
          <td style="text-align: center;">${entry.breakMinutes}分</td>
          <td class="duration">${formatDuration(duration.hours, duration.minutes)}</td>
          <td class="notes">${patternLabel}</td>
          <td style="text-align: right; font-weight: 600;">¥${subtotal.toLocaleString()}</td>
        </tr>
        `

        // メモ行（あれば）
        if (entry.notes && entry.notes.trim()) {
          html += `
            <tr class="notes-row">
              <td colspan="5" class="notes-cell">
                <strong>[メモ]</strong> ${entry.notes}
              </td>
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

  // 特別報酬・経費の詳細を表示
  if (rewards.length > 0) {
    // dateを正規化してソート（ISO文字列またはDateオブジェクトに対応）
    const sortedRewards = [...rewards].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateA - dateB
    })
    html += `
      <div class="details" style="margin-top: 20px;">
        <h2>特別報酬・経費の詳細</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 170px;">日付</th>
              <th>内容</th>
              <th style="width: 120px;">金額</th>
            </tr>
          </thead>
          <tbody>
    `

    sortedRewards.forEach((reward) => {
      // dateをDateオブジェクトとして扱い、YYYY-MM-DD形式に変換
      let dateStr = ''
      if (reward.date) {
        const d = new Date(reward.date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${day}`
      }
      html += `
            <tr>
              <td class="date-cell" style="text-align: center;">${dateStr ? formatDateLabel(dateStr) : '-'}</td>
              <td>${reward.description || '特別報酬・経費'}</td>
              <td style="text-align: right; font-weight: 600;">¥${reward.amount.toLocaleString()}</td>
            </tr>
      `
    })

    html += `
          </tbody>
        </table>
      </div>
    `
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
  withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES,
  checklistReward: number = 0
): void {
  const htmlContent = generatePDFContent(worker, entries, month, rewards, withholdingRates, checklistReward)

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

  // 最初のワーカーのPDFを生成して、CSSやヘッダーを流用する
  const firstPDF = items.length > 0 ? generatePDFContent(items[0].worker, items[0].entries, month, items[0].rewards || [], withholdingRates) : ''
  if (!firstPDF) return ''

  // HTMLの構造を分割
  const htmlStart = firstPDF.split('<body>')[0] + '<body>'
  const htmlEnd = '</body></html>'

  // 各ワーカーのbodyコンテンツを抽出
  const bodies = items.map((item, index) => {
    const fullHTML = generatePDFContent(item.worker, item.entries, month, item.rewards || [], withholdingRates)
    const bodyMatch = fullHTML.match(/<body>([\s\S]*)<\/body>/)
    const bodyContent = bodyMatch ? bodyMatch[1] : ''

    // 2ページ目以降はページブレークを入れる
    return index === 0
      ? `<div class="pdf-page">${bodyContent}</div>`
      : `<div class="pdf-page" style="page-break-before: always;">${bodyContent}</div>`
  }).join('')

  return htmlStart + bodies + htmlEnd
}

/**
 * 全員分のPDFをダウンロード（印刷ダイアログ表示）
 */
export function downloadCombinedPDF(
  items: WorkerWithEntries[],
  month: Date,
  withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES
): void {
  const htmlContent = generateCombinedPDFContent(items, month, withholdingRates)

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('ポップアップがブロックされました。')
    return
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}
