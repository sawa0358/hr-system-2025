/**
 * 有給管理履歴スナップショットの画像/PDF生成
 * Browserless.io（本番）またはローカルChrome（開発）を使用してサーバーサイドで生成
 */

import { getBrowser } from "@/lib/browserless"
import { prisma } from "@/lib/prisma"
import { getVacationStats } from "@/lib/vacation-stats"
import type { Browser } from "puppeteer-core"

interface GenerateSnapshotOptions {
  employeeId: string
  snapshotDate: Date
  grantYear: number
  grantDate: Date
}

/**
 * 有給管理画面のHTMLを生成
 */
function generateLeavePageHTML(
  employeeName: string,
  stats: {
    totalRemaining: number
    used: number
    pending: number
    totalGranted: number
    joinDate: Date
  },
  snapshotDate: Date
): string {
  const joinDateStr = new Date(stats.joinDate).toISOString().slice(0, 10).replaceAll("-", "/")
  const snapshotDateStr = new Date(snapshotDate).toISOString().slice(0, 10).replaceAll("-", "/")
  const remaining = Math.max(0, stats.totalGranted - stats.used - stats.pending)
  const usageRate = stats.totalGranted > 0 ? ((stats.used / stats.totalGranted) * 100).toFixed(1) : "0.0"
  const approvedRemaining = Math.max(0, stats.totalGranted - stats.used - stats.pending)

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${employeeName}さんの有給管理</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f2f6f9;
      padding: 32px;
      color: #1e293b;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .stat-title {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .stat-subtitle {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 8px;
    }
    .info-section {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 500;
      color: #475569;
    }
    .info-value {
      color: #0f172a;
    }
    .snapshot-date {
      text-align: right;
      color: #64748b;
      font-size: 12px;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${employeeName}さんの有給管理</h1>
    <div class="subtitle">スナップショット取得日: ${snapshotDateStr}</div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">残り有給日数</div>
        <div class="stat-value">${remaining.toFixed(1)}日</div>
        <div class="stat-subtitle">総付与: ${stats.totalGranted.toFixed(1)}日 - 取得済み: ${stats.used.toFixed(1)}日 - 申請中: ${stats.pending.toFixed(1)}日</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">取得済み</div>
        <div class="stat-value">${stats.used.toFixed(1)}日</div>
        <div class="stat-subtitle">使用率: ${usageRate}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">申請中</div>
        <div class="stat-value">${stats.pending.toFixed(1)}日</div>
        <div class="stat-subtitle">承認後残り: ${approvedRemaining.toFixed(1)}日</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">総付与数</div>
        <div class="stat-value">${stats.totalGranted.toFixed(1)}日</div>
        <div class="stat-subtitle">入社: ${joinDateStr}</div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-row">
        <span class="info-label">入社日</span>
        <span class="info-value">${joinDateStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">総付与数</span>
        <span class="info-value">${stats.totalGranted.toFixed(1)}日</span>
      </div>
      <div class="info-row">
        <span class="info-label">取得済み</span>
        <span class="info-value">${stats.used.toFixed(1)}日</span>
      </div>
      <div class="info-row">
        <span class="info-label">申請中</span>
        <span class="info-value">${stats.pending.toFixed(1)}日</span>
      </div>
      <div class="info-row">
        <span class="info-label">残り有給日数</span>
        <span class="info-value">${remaining.toFixed(1)}日</span>
      </div>
    </div>

    <div class="snapshot-date">
      スナップショット取得日時: ${new Date(snapshotDate).toLocaleString("ja-JP")}
    </div>
  </div>
</body>
</html>
  `
}

/**
 * スナップショットの画像/PDFを生成
 */
export async function generateSnapshotImageAndPDF(
  options: GenerateSnapshotOptions
): Promise<{ imageBuffer: Buffer | null; pdfBuffer: Buffer | null; error?: string }> {
  let browser: Browser | null = null

  try {
    // 社員情報を取得
    const employee = await prisma.employee.findUnique({
      where: { id: options.employeeId },
      select: {
        id: true,
        name: true,
        joinDate: true,
      },
    })

    if (!employee) {
      return { imageBuffer: null, pdfBuffer: null, error: "社員が見つかりません" }
    }

    // 有給統計を取得
    const stats = await getVacationStats(options.employeeId)

    // HTMLを生成
    const html = generateLeavePageHTML(employee.name, stats, options.snapshotDate)

    // Browserless.io（本番）またはローカルChrome（開発）を使用
    browser = await getBrowser()

    const page = await browser.newPage()
    
    // ページサイズを設定
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2,
    })

    // HTMLを設定（ポータル要素を無視する設定）
    await page.setContent(html, { 
      waitUntil: "domcontentloaded",
      timeout: 30000,
    })

    // 少し待機してレンダリングを完了させる
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 画像を生成
    const imageBuffer = await page.screenshot({
      type: "png",
      fullPage: true,
      quality: 100,
    }) as Buffer

    // PDFを生成
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    }) as Buffer

    await browser.close()
    browser = null

    return { imageBuffer, pdfBuffer }
  } catch (error: any) {
    console.error("スナップショット生成エラー:", error)
    console.error("エラー詳細:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error("ブラウザクローズエラー:", closeError)
      }
    }
    
    return {
      imageBuffer: null,
      pdfBuffer: null,
      error: error?.message || "スナップショットの生成に失敗しました",
    }
  }
}

