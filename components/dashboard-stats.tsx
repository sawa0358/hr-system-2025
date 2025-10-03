"use client"

import { useState } from "react"
import { Users, Briefcase, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const stats = [
  {
    icon: Users,
    label: "総社員数",
    value: "248",
    change: "+12",
    changeLabel: "先月比",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Briefcase,
    label: "進行中タスク",
    value: "64",
    change: "-8",
    changeLabel: "先週比",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
]

interface DashboardStatsProps {
  isAdmin?: boolean
}

export function DashboardStats({ isAdmin = true }: DashboardStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isAdmin) return null

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">統計情報</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="border-slate-200 shadow-sm bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</p>
                        <div className="flex items-center gap-1 text-xs">
                          <span
                            className={
                              stat.change.startsWith("+")
                                ? "text-emerald-600 font-medium"
                                : "text-slate-600 font-medium"
                            }
                          >
                            {stat.change}
                          </span>
                          <span className="text-slate-500">{stat.changeLabel}</span>
                        </div>
                      </div>
                      <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
