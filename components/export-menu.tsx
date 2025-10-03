"use client"

import { Download, FileText, FileSpreadsheet, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ExportMenuProps {
  onExport?: (format: "pdf" | "word" | "csv" | "png") => void
}

export function ExportMenu({ onExport }: ExportMenuProps) {
  const handleExport = (format: "pdf" | "word" | "csv" | "png") => {
    console.log("[v0] Exporting as:", format)
    onExport?.(format)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-slate-300 bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          エクスポート
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
