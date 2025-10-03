import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, CheckCircle, Clock } from "lucide-react"

const stats = [
  {
    icon: Users,
    label: "評価対象者",
    value: "248",
    subtext: "全社員",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: CheckCircle,
    label: "完了済み",
    value: "186",
    subtext: "75%",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    icon: Clock,
    label: "進行中",
    value: "42",
    subtext: "17%",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    icon: TrendingUp,
    label: "平均スコア",
    value: "4.2",
    subtext: "前期: 4.0",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
]

export function EvaluationStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.subtext}</p>
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
  )
}
