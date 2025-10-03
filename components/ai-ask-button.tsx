"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import { AIChatDialog } from "./ai-chat-dialog"

interface AIAskButtonProps {
  context: string
}

export function AIAskButton({ context }: AIAskButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-blue-200 text-blue-600 hover:bg-blue-50"
      >
        <Bot className="w-4 h-4 mr-2" />
        AIに聞く
      </Button>
      <AIChatDialog open={open} onOpenChange={setOpen} title={`AI - ${context}`} context={context} />
    </>
  )
}
