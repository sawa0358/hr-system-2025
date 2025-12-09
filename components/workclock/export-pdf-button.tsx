'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { Worker, TimeEntry } from '@/lib/workclock/types'
import { downloadPDF, WithholdingTaxRates, DEFAULT_WITHHOLDING_RATES } from '@/lib/workclock/pdf-export'
import { api } from '@/lib/workclock/api'

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
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    setIsLoading(true)
    try {
      // 源泉徴収率を取得
      let withholdingRates: WithholdingTaxRates = DEFAULT_WITHHOLDING_RATES
      try {
        const response: any = await api.withholdingTaxSettings.get()
        if (response?.rateUnder1M !== undefined && response?.rateOver1M !== undefined) {
          withholdingRates = {
            rateUnder1M: response.rateUnder1M,
            rateOver1M: response.rateOver1M,
          }
        }
      } catch (e) {
        console.warn('源泉徴収率の取得に失敗しました。デフォルト値を使用します。', e)
      }

      await downloadPDF(worker, entries, month, withholdingRates)
    } catch (error) {
      console.error('PDF出力に失敗しました:', error)
      alert('PDF出力に失敗しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      PDF出力
    </Button>
  )
}
