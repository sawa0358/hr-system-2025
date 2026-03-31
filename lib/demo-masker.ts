/**
 * デモモード用DOMマスキングエンジン
 * 個人情報を含むテキストノードの親要素にCSSぼかし（blur）を適用する
 */

const BLUR_CLASS = "demo-blur"

// 正規表現パターン
const PHONE_REGEX = /0\d{1,4}[-ー‐]\d{1,4}[-ー‐]\d{2,4}/
const PHONE_NO_HYPHEN_REGEX = /(?<!\d)0\d{9,10}(?!\d)/
const POSTAL_REGEX = /\d{3}[-ー]\d{4}/
const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/

// マスク対象の名前セット
export interface MaskData {
  names: string[]  // 全名前（長い順にソート済み）
  addresses: string[]  // 住所一覧
}

let currentMaskData: MaskData | null = null
let observer: MutationObserver | null = null

/**
 * マスクデータを構築する
 */
export function buildMaskData(
  employees: Array<{ name: string; furigana?: string; address?: string }>
): MaskData {
  const nameSet = new Set<string>()
  const addressSet = new Set<string>()

  for (const e of employees) {
    if (e.name && e.name.length >= 2) nameSet.add(e.name)
    // スペース除去版も追加（「野田 悦登」→「野田悦登」両方マッチ）
    const noSpace = e.name?.replace(/[\s　]+/g, "")
    if (noSpace && noSpace.length >= 2 && noSpace !== e.name) nameSet.add(noSpace)
    // フリガナも追加
    if (e.furigana && e.furigana.length >= 2) nameSet.add(e.furigana)
    // 住所
    if (e.address && e.address.length >= 4) addressSet.add(e.address)
  }

  // 長い文字列を先にマッチさせるためソート
  const names = Array.from(nameSet).sort((a, b) => b.length - a.length)
  const addresses = Array.from(addressSet).sort((a, b) => b.length - a.length)

  return { names, addresses }
}

/**
 * テキストが個人情報を含むかチェック
 */
function containsSensitiveData(text: string, maskData: MaskData): boolean {
  if (!text || text.trim().length < 2) return false

  const trimmed = text.trim()

  // 正規表現パターンチェック
  if (PHONE_REGEX.test(trimmed)) return true
  if (PHONE_NO_HYPHEN_REGEX.test(trimmed)) return true
  if (POSTAL_REGEX.test(trimmed)) return true
  if (EMAIL_REGEX.test(trimmed)) return true

  // 名前照合
  for (const name of maskData.names) {
    if (trimmed.includes(name)) return true
  }

  // 住所照合
  for (const addr of maskData.addresses) {
    if (trimmed.includes(addr)) return true
  }

  return false
}

/**
 * 要素がぼかし対象外かチェック
 */
function shouldSkipElement(el: Element): boolean {
  // サイドバーのナビゲーションは除外
  if (el.closest("nav")) return true
  // デモモードトグル自体は除外
  if (el.closest("[data-demo-toggle]")) return true
  // 明示的に除外指定された要素
  if (el.closest("[data-no-demo-blur]")) return true
  // script/style要素は除外
  const tag = el.tagName?.toLowerCase()
  if (tag === "script" || tag === "style" || tag === "noscript") return true
  return false
}

/**
 * DOMにぼかしを適用
 */
export function applyDemoMask(root: Element, maskData: MaskData): void {
  currentMaskData = maskData

  // 1. テキストノードを走査
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  let node: Node | null

  while ((node = walker.nextNode())) {
    const text = node.textContent || ""
    if (containsSensitiveData(text, maskData)) {
      const parent = node.parentElement
      if (parent && !shouldSkipElement(parent) && !parent.classList.contains(BLUR_CLASS)) {
        parent.classList.add(BLUR_CLASS)
      }
    }
  }

  // 2. input/textarea のvalueもチェック
  const inputs = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")
  for (const input of inputs) {
    const val = input.value || input.getAttribute("value") || ""
    if (val && containsSensitiveData(val, maskData) && !shouldSkipElement(input)) {
      input.classList.add(BLUR_CLASS)
    }
  }

  // 3. title属性もチェック（ツールチップに個人情報が出る場合）
  const titled = root.querySelectorAll("[title]")
  for (const el of titled) {
    const title = el.getAttribute("title") || ""
    if (title && containsSensitiveData(title, maskData)) {
      el.setAttribute("data-original-title", title)
      el.setAttribute("title", "")
    }
  }
}

/**
 * ぼかしを解除
 */
export function removeDemoMask(): void {
  currentMaskData = null

  // blurクラス除去
  const blurred = document.querySelectorAll(`.${BLUR_CLASS}`)
  for (const el of blurred) {
    el.classList.remove(BLUR_CLASS)
  }

  // title属性復元
  const titledBackup = document.querySelectorAll("[data-original-title]")
  for (const el of titledBackup) {
    const original = el.getAttribute("data-original-title") || ""
    el.setAttribute("title", original)
    el.removeAttribute("data-original-title")
  }
}

/**
 * MutationObserverを作成してReactの再レンダリングに追従
 */
export function startMaskObserver(root: Element, maskData: MaskData): void {
  stopMaskObserver()
  currentMaskData = maskData

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  observer = new MutationObserver(() => {
    if (!currentMaskData) return
    // デバウンス: 連続するDOM変更をまとめて処理
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (currentMaskData) {
        applyDemoMask(document.body, currentMaskData)
      }
    }, 100)
  })

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["value"],
  })
}

/**
 * MutationObserverを停止
 */
export function stopMaskObserver(): void {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}
