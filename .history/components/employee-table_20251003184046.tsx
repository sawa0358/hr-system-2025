"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Mail, Phone, FileText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface EmployeeTableProps {
  onEmployeeClick?: (employee: any) => void
  onEvaluationClick?: (employee: any) => void
  refreshTrigger?: number
}

export function EmployeeTable({ onEmployeeClick, onEvaluationClick, refreshTrigger }: EmployeeTableProps) {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees')
        if (response.ok) {
          const data = await response.json()
          setEmployees(data)
        } else {
          console.error('社員データの取得に失敗しました')
        }
      } catch (error) {
        console.error('社員データの取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            在籍中
          </Badge>
        )
      case "leave":
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
            休職中
          </Badge>
        )
      case "retired":
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
            退職
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-600">社員データを読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold">番号・考課表</TableHead>
            <TableHead className="font-semibold">氏名</TableHead>
            <TableHead className="font-semibold">部署</TableHead>
            <TableHead className="font-semibold">役職</TableHead>
            <TableHead className="font-semibold">入社日</TableHead>
            <TableHead className="font-semibold">ステータス</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow
              key={employee.id}
              className="hover:bg-slate-50 cursor-pointer"
              onClick={() => onEmployeeClick?.(employee)}
            >
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {employee.employeeNumber || employee.employeeId}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEvaluationClick?.(employee)
                    }}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    考課表
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {employee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900">{employee.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {employee.phone}
                      </span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-700">{employee.department}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-700">{employee.position}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-600">{employee.joinDate}</span>
              </TableCell>
              <TableCell>{getStatusBadge(employee.status)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onEmployeeClick?.(employee)
                      }}
                    >
                      詳細を見る
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onEmployeeClick?.(employee)
                      }}
                    >
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onEvaluationClick?.(employee)
                      }}
                    >
                      人事考課表を開く
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
