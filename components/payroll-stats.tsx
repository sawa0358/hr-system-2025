import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react"

const stats = [
  {
    icon: DollarSign,
    label: "今月の総支給額",
    value: "¥82,450,000",
    change: "+2.3%",
    changeLabel: "前月比",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Users,
    label: "支給対象者",
    value: "248",
    change: "+12",
    changeLabel: "前月比",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    icon: TrendingUp,
    label: "平均支給額",
    value: "¥332,460",
    change: "+1.8%",
    changeLabel: "前月比",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    icon: Calendar,
    label: "支給予定日",
    value: "1月25日",
    change: "あと15日",
    changeLabel: "",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
]

export function PayrollStats() {
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
                  <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span
                      className={
                        stat.change.startsWith("+") ? "text-emerald-600 font-medium" : "text-slate-600 font-medium"
                      }
                    >
                      {stat.change}
                    </span>
                    {stat.changeLabel && <span className="text-slate-500">{stat.changeLabel}</span>}
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
  )
}
