"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { payrollData } from "@/lib/mock-data"
import { useState } from "react"

export function PayrollList() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            支給済み
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
            処理中
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
            下書き
          </Badge>
        )
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  return (
    <div className="space-y-4">
      {payrollData.map((payroll) => (
        <Card key={payroll.id} className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                    {payroll.employeeName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{payroll.employeeName}</h3>
                    <span className="text-sm text-slate-500">{payroll.employeeId}</span>
                    {getStatusBadge(payroll.status)}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <span>{payroll.department}</span>
                    <span>•</span>
                    <span>{payroll.position}</span>
                    <span>•</span>
                    <span>{payroll.period}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">基本給</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(payroll.baseSalary)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">手当</p>
                      <p className="text-sm font-semibold text-emerald-600">{formatCurrency(payroll.allowances)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">控除</p>
                      <p className="text-sm font-semibold text-red-600">-{formatCurrency(payroll.deductions)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">残業代</p>
                      <p className="text-sm font-semibold text-blue-600">{formatCurrency(payroll.overtime)}</p>
                    </div>
                  </div>

                  {expandedId === payroll.id && (
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-2">手当内訳</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">通勤手当</span>
                              <span className="text-slate-900">
                                {formatCurrency(payroll.allowanceBreakdown.commute)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">住宅手当</span>
                              <span className="text-slate-900">
                                {formatCurrency(payroll.allowanceBreakdown.housing)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">役職手当</span>
                              <span className="text-slate-900">
                                {formatCurrency(payroll.allowanceBreakdown.position)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-2">控除内訳</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">健康保険</span>
                              <span className="text-slate-900">
                                {formatCurrency(payroll.deductionBreakdown.healthInsurance)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">厚生年金</span>
                              <span className="text-slate-900">
                                {formatCurrency(payroll.deductionBreakdown.pension)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">所得税</span>
                              <span className="text-slate-900">
                                {formatCurrency(payroll.deductionBreakdown.incomeTax)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">住民税</span>
                              <span className="text-slate-900">
                                {formatCurrency(payroll.deductionBreakdown.residentTax)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">残業時間</span>
                          <span className="text-slate-900">{payroll.overtimeHours}時間</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">差引支給額</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(payroll.netPay)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === payroll.id ? null : payroll.id)}
                  className="text-slate-600"
                >
                  {expandedId === payroll.id ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      閉じる
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      詳細
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
