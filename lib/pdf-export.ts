/**
 * PDF生成ユーティリティ
 * jsPDFとhtml2canvasを使用してPDFを生成します
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  /** エクスポートする要素のセレクタまたはHTMLElement */
  element: string | HTMLElement
  /** PDFファイル名（デフォルト: 'export.pdf'） */
  filename?: string
  /** PDFの向き（デフォルト: 'portrait'） */
  orientation?: 'portrait' | 'landscape'
  /** PDFの単位（デフォルト: 'mm'） */
  unit?: 'mm' | 'pt' | 'px' | 'in'
  /** PDFのフォーマット（デフォルト: 'a4'） */
  format?: 'a4' | 'a3' | 'letter' | [number, number]
  /** マージン（デフォルト: 10） */
  margin?: number
  /** 品質（デフォルト: 1.0） */
  quality?: number
  /** スケール（デフォルト: 2） */
  scale?: number
  /** 背景色を含めるか（デフォルト: true） */
  backgroundColor?: string | null
  /** ローディングコールバック */
  onProgress?: (progress: number) => void
}

/**
 * HTML要素をPDFとしてエクスポート
 */
export async function exportToPDF(options: PDFExportOptions): Promise<void> {
  const {
    element,
    filename = 'export.pdf',
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
    margin = 10,
    quality = 1.0,
    scale = 2,
    backgroundColor = '#ffffff',
    onProgress,
  } = options

  try {
    // 要素を取得
    const targetElement =
      typeof element === 'string'
        ? document.querySelector(element)
        : element

    if (!targetElement) {
      throw new Error(`要素が見つかりません: ${element}`)
    }

    if (!(targetElement instanceof HTMLElement)) {
      throw new Error('有効なHTMLElementではありません')
    }

    onProgress?.(0.1)

    // html2canvasでキャンバスに変換
    const canvas = await html2canvas(targetElement, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: backgroundColor || undefined,
      onclone: (clonedDoc) => {
        // クローンされたドキュメントでスタイルを調整
        const clonedElement =
          typeof element === 'string'
            ? clonedDoc.querySelector(element)
            : element.cloneNode(true)

        if (clonedElement instanceof HTMLElement) {
          // 印刷用のスタイルを適用
          clonedElement.style.width = `${targetElement.offsetWidth}px`
          clonedElement.style.height = 'auto'
        }
      },
    })

    onProgress?.(0.5)

    // キャンバスのサイズを取得
    const imgWidth = canvas.width
    const imgHeight = canvas.height

    // PDFのサイズを計算
    const pdf = new jsPDF({
      orientation,
      unit,
      format,
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // 画像のアスペクト比を維持しながらPDFサイズに合わせる
    const imgAspectRatio = imgWidth / imgHeight
    const pdfAspectRatio = (pdfWidth - margin * 2) / (pdfHeight - margin * 2)

    let finalWidth = pdfWidth - margin * 2
    let finalHeight = (pdfWidth - margin * 2) / imgAspectRatio

    // 高さがPDFの高さを超える場合は、高さを基準に調整
    if (finalHeight > pdfHeight - margin * 2) {
      finalHeight = pdfHeight - margin * 2
      finalWidth = finalHeight * imgAspectRatio
    }

    // 画像をPDFに追加
    const imgData = canvas.toDataURL('image/png', quality)
    pdf.addImage(imgData, 'PNG', margin, margin, finalWidth, finalHeight)

    onProgress?.(0.9)

    // PDFをダウンロード
    pdf.save(filename)

    onProgress?.(1.0)
  } catch (error) {
    console.error('PDFエクスポートエラー:', error)
    throw error
  }
}

/**
 * ページ全体をPDFとしてエクスポート
 */
export async function exportPageToPDF(
  filename?: string,
  options?: Omit<PDFExportOptions, 'element' | 'filename'>
): Promise<void> {
  return exportToPDF({
    element: 'body',
    filename: filename || `page-${new Date().toISOString().split('T')[0]}.pdf`,
    ...options,
  })
}

/**
 * 複数の要素を1つのPDFに結合してエクスポート
 */
export async function exportMultipleToPDF(
  elements: (string | HTMLElement)[],
  filename?: string,
  options?: Omit<PDFExportOptions, 'element' | 'filename'>
): Promise<void> {
  const {
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
    margin = 10,
    quality = 1.0,
    scale = 2,
    backgroundColor = '#ffffff',
    onProgress,
  } = options || {}

  try {
    const pdf = new jsPDF({
      orientation,
      unit,
      format,
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    let currentY = margin

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const targetElement =
        typeof element === 'string'
          ? document.querySelector(element)
          : element

      if (!targetElement || !(targetElement instanceof HTMLElement)) {
        continue
      }

      onProgress?.((i / elements.length) * 0.8)

      // html2canvasでキャンバスに変換
      const canvas = await html2canvas(targetElement, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: backgroundColor || undefined,
      })

      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const imgAspectRatio = imgWidth / imgHeight

      let finalWidth = pdfWidth - margin * 2
      let finalHeight = finalWidth / imgAspectRatio

      // ページを超える場合は新しいページを追加
      if (currentY + finalHeight > pdfHeight - margin) {
        pdf.addPage()
        currentY = margin
      }

      const imgData = canvas.toDataURL('image/png', quality)
      pdf.addImage(imgData, 'PNG', margin, currentY, finalWidth, finalHeight)

      currentY += finalHeight + margin
    }

    onProgress?.(0.95)

    pdf.save(filename || `export-${new Date().toISOString().split('T')[0]}.pdf`)

    onProgress?.(1.0)
  } catch (error) {
    console.error('PDFエクスポートエラー:', error)
    throw error
  }
}






