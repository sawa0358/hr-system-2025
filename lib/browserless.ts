/**
 * Browserless.io 接続ヘルパー
 * 
 * 外部のChrome-as-a-Serviceを使用してPuppeteerを実行します。
 * ローカルにChromeをインストールする必要がなく、Herokuのスラグサイズ制限を回避できます。
 * 
 * 環境変数:
 *   BROWSERLESS_TOKEN: Browserless.ioのAPIトークン
 */

import puppeteer, { Browser } from 'puppeteer-core'

const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN

/**
 * Browserless.ioに接続してブラウザインスタンスを取得
 */
export async function connectToBrowserless(): Promise<Browser> {
  if (!BROWSERLESS_TOKEN) {
    throw new Error('BROWSERLESS_TOKEN is not configured. Please set it in environment variables.')
  }

  console.log('[Browserless] Connecting to Browserless.io...')

  // タイムアウトを5分に延長（複数PDF生成に対応）
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}&timeout=300000`,
  })

  console.log('[Browserless] Connected successfully')
  return browser
}

/**
 * ローカルまたはBrowserless.ioのブラウザを取得
 * 
 * - 本番環境 (NODE_ENV === 'production'): Browserless.ioを使用
 * - 開発環境: ローカルのChromeを使用（puppeteerの自動検出）
 */
export async function getBrowser(): Promise<Browser> {
  // 本番環境ではBrowserless.ioを使用
  if (process.env.NODE_ENV === 'production') {
    return connectToBrowserless()
  }

  // 開発環境ではローカルのChromeを使用
  console.log('[Browserless] Development mode: using local Chrome')
  
  // ローカル環境用のpuppeteerを動的インポート
  // Note: 開発環境では通常のpuppeteerをインストールしておく必要がある
  try {
    // puppeteer-coreでローカルChromeを探す
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // macOSのChromeパス
      executablePath: process.platform === 'darwin' 
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome-stable',
    })
    return browser
  } catch (error) {
    console.error('[Browserless] Failed to launch local Chrome:', error)
    // ローカルで失敗した場合、BROWSERLESS_TOKENがあればそちらを試す
    if (BROWSERLESS_TOKEN) {
      console.log('[Browserless] Falling back to Browserless.io...')
      return connectToBrowserless()
    }
    throw error
  }
}

/**
 * HTMLコンテンツをPDFに変換
 */
export async function htmlToPdf(
  htmlContent: string,
  options?: {
    format?: 'A4' | 'Letter'
    printBackground?: boolean
    margin?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
  }
): Promise<Buffer> {
  const browser = await getBrowser()
  
  try {
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: options?.format || 'A4',
      printBackground: options?.printBackground ?? true,
      margin: options?.margin || {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    })

    await page.close()
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

