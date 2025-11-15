import { Worker, TimeEntry } from './types'
import { calculateDuration, formatDuration, getMonthlyTotal } from './time-utils'

export function generatePDFContent(
  worker: Worker,
  entries: TimeEntry[],
  month: Date
): string {
  const monthName = month.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  })

  const monthlyTotal = getMonthlyTotal(entries)
  const totalHours = monthlyTotal.hours + monthlyTotal.minutes / 60
  const totalAmount = totalHours * worker.hourlyRate

  const teamsText =
    Array.isArray(worker.teams) && worker.teams.length > 0
      ? worker.teams.join(', ')
      : ''

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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>勤務報告書</h1>
        <div class="header-info">
          <div class="worker-info">
            <p><strong>氏名:</strong> ${worker.name}</p>
            ${teamsText ? `<p><strong>所属:</strong> ${teamsText}</p>` : ''}
            <p><strong>時給:</strong> ¥${worker.hourlyRate.toLocaleString()}</p>
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
          <div class="summary-item total-amount">
            <span class="summary-label">報酬合計</span>
            <span class="summary-value">¥${Math.floor(totalAmount).toLocaleString()}</span>
          </div>
        </div>
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

export function downloadPDF(worker: Worker, entries: TimeEntry[], month: Date): void {
  const htmlContent = generatePDFContent(worker, entries, month)
  
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
