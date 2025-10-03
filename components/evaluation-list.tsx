"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Star } from "lucide-react"
import { evaluations } from "@/lib/mock-data"

export function EvaluationList() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            完了
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
            進行中
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
            未着手
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {evaluations.map((evaluation) => (
        <Card key={evaluation.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                    {evaluation.employeeName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{evaluation.employeeName}</h3>
                    <span className="text-sm text-slate-500">{evaluation.position}</span>
                    {getStatusBadge(evaluation.status)}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{evaluation.period}</span>
                    </div>
                    <span>評価者: {evaluation.evaluator}</span>
                  </div>

                  {evaluation.status === "completed" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {evaluation.scores.map((score) => (
                        <div key={score.category}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-600">{score.category}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="text-xs font-semibold text-slate-900">{score.value}</span>
                            </div>
                          </div>
                          <Progress value={score.value * 20} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  )}

                  {evaluation.status === "in-progress" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">評価期限: {evaluation.deadline}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {evaluation.status === "completed" && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="text-2xl font-bold text-slate-900">{evaluation.overallScore}</span>
                    </div>
                    <p className="text-xs text-slate-500">総合評価</p>
                  </div>
                )}
                <Button variant="outline" size="sm" className="border-slate-300 bg-transparent">
                  詳細を見る
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
