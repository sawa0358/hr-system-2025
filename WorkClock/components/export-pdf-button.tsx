'use client'

import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { Worker, TimeEntry } from '@/lib/types'
import { downloadPDF } from '@/lib/pdf-export'

interface ExportPDFButtonProps {
  worker: Worker
  entries: TimeEntry[]
  month: Date
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ExportPDFButton({
  worker,
  entries,
  month,
  variant = 'default',
  size = 'default',
}: ExportPDFButtonProps) {
  const handleExport = () => {
    downloadPDF(worker, entries, month)
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport}>
      <FileText className="mr-2 h-4 w-4" />
      PDF出力
    </Button>
  )
}
