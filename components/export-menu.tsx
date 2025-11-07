"use client"

import { Download, FileText, FileSpreadsheet, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportToPDF } from "@/lib/pdf-export"
import { useState } from "react"
import { toast } from "sonner"

interface ExportMenuProps {
  /** カスタムエクスポートハンドラー */
  onExport?: (format: "pdf" | "word" | "csv" | "png") => void
  /** PDFエクスポート対象の要素セレクタ（デフォルト: 'main'） */
  pdfElement?: string | HTMLElement
  /** PDFファイル名 */
  pdfFilename?: string
  /** エクスポート対象の要素ID（複数指定可能） */
  elementId?: string | string[]
}

export function ExportMenu({ 
  onExport, 
  pdfElement = 'main',
  pdfFilename,
  elementId 
}: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "pdf" | "word" | "csv" | "png") => {
    // カスタムハンドラーが指定されている場合はそれを使用
    if (onExport) {
      onExport(format)
      return
    }

    // デフォルトのエクスポート処理
    try {
      setIsExporting(true)

      switch (format) {
        case "pdf":
          await handlePDFExport()
          break
        case "png":
          await handlePNGExport()
          break
        case "csv":
          toast.info("CSVエクスポート機能は準備中です")
          break
        case "word":
          toast.info("Wordエクスポート機能は準備中です")
          break
        default:
          console.warn("未対応のエクスポート形式:", format)
      }
    } catch (error) {
      console.error("エクスポートエラー:", error)
      toast.error("エクスポートに失敗しました")
    } finally {
      setIsExporting(false)
    }
  }

  const handlePDFExport = async () => {
    try {
      const targetElement = elementId
        ? (Array.isArray(elementId) 
            ? elementId.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[]
            : document.getElementById(elementId as string))
        : pdfElement

      if (!targetElement) {
        toast.error("エクスポート対象の要素が見つかりません")
        return
      }

      const filename = pdfFilename || `export-${new Date().toISOString().split('T')[0]}.pdf`

      if (Array.isArray(targetElement)) {
        // 複数要素の場合は結合してエクスポート
        const { exportMultipleToPDF } = await import("@/lib/pdf-export")
        await exportMultipleToPDF(targetElement, filename)
      } else {
        // 単一要素のエクスポート
        await exportToPDF({
          element: targetElement,
          filename,
          onProgress: (progress) => {
            if (progress >= 1.0) {
              toast.success("PDFのエクスポートが完了しました")
            }
          },
        })
      }
    } catch (error) {
      console.error("PDFエクスポートエラー:", error)
      toast.error("PDFのエクスポートに失敗しました")
      throw error
    }
  }

  const handlePNGExport = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas')
      
      const targetElement = elementId
        ? (Array.isArray(elementId)
            ? document.getElementById(elementId[0] as string)
            : document.getElementById(elementId as string))
        : pdfElement

      if (!targetElement || !(targetElement instanceof HTMLElement)) {
        toast.error("エクスポート対象の要素が見つかりません")
        return
      }

      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.download = `export-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      
      // 安全に削除（ブラウザが処理するまで少し待つ）
      setTimeout(() => {
        if (link.parentNode === document.body) {
          document.body.removeChild(link)
        }
      }, 100)

      toast.success("PNG画像のエクスポートが完了しました")
    } catch (error) {
      console.error("PNGエクスポートエラー:", error)
      toast.error("PNG画像のエクスポートに失敗しました")
      throw error
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="border-slate-300 bg-transparent"
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "エクスポート中..." : "エクスポート"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="w-4 h-4 mr-2" />
          PDF形式
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("word")}>
          <FileText className="w-4 h-4 mr-2" />
          Word形式
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          CSV形式
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("png")}>
          <ImageIcon className="w-4 h-4 mr-2" />
          PNG画像
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
