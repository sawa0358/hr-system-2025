import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface VacationStatsProps {
  userRole: "employee" | "admin"
}

export function VacationStats({ userRole }: VacationStatsProps) {
  const employeeStats = [
    {
      title: "残り有給日数",
      value: "12日",
      icon: Calendar,
      color: "text-chart-1",
    },
    {
      title: "取得済み",
      value: "8日",
      icon: CheckCircle,
      color: "text-chart-2",
    },
    {
      title: "申請中",
      value: "2日",
      icon: Clock,
      color: "text-chart-3",
    },
    {
      title: "総付与数",
      value: "20日",
      icon: Calendar,
      color: "text-chart-4",
    },
  ]

  const adminStats = [
    {
      title: "承認待ち",
      value: "5件",
      icon: Clock,
      color: "text-chart-3",
    },
    {
      title: "今月承認済み",
      value: "23件",
      icon: CheckCircle,
      color: "text-chart-2",
    },
    {
      title: "却下",
      value: "2件",
      icon: XCircle,
      color: "text-destructive",
    },
    {
      title: "アラート数",
      value: "3名",
      icon: AlertTriangle,
      color: "text-orange-500",
    },
  ]

  const stats = userRole === "employee" ? employeeStats : adminStats

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
