"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Mail, Phone, FileText, ArrowUp, ArrowDown, ArrowUpDown, SortAsc, SortDesc, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"

interface EmployeeTableProps {
  onEmployeeClick?: (employee: any) => void
  onEvaluationClick?: (employee: any) => void
  refreshTrigger?: number
  filters?: {
    searchQuery: string
    department: string
    status: string
    employeeType: string
    position: string
  }
}

export function EmployeeTable({ onEmployeeClick, onEvaluationClick, refreshTrigger, filters }: EmployeeTableProps) {
  const { currentUser } = useAuth()
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // 考課表ボタンの表示権限を判定する関数
  const canShowEvaluationButton = (employee: any) => {
    if (!currentUser) return false

    const userRole = currentUser.role
    const employeeId = employee.id

    switch (userRole) {
      case 'viewer':
        return false // 閲覧：表示無し
      
      case 'general':
      case 'sub_manager':
        return employeeId === currentUser.id // 自分だけ
      
      case 'store_manager': // 店長（新規追加）
        return employeeId === currentUser.id || isSubordinate(employee) // 自分と配下
      
      case 'manager':
      case 'hr':
      case 'admin':
        return true // 全員
      
      default:
        return false
    }
  }

  // 組織図での配下判定
  const isSubordinate = (employee: any) => {
    if (!currentUser || currentUser.role !== 'store_manager') return false
    
    // 部署が同じ場合は配下とみなす
    const employeeDepartments = Array.isArray(employee.departments) ? employee.departments : [employee.department]
    const userDepartments = Array.isArray(currentUser.departments) ? currentUser.departments : [currentUser.department]
    
    // 部署の重複をチェック
    const hasCommonDepartment = employeeDepartments.some((dept: string) => userDepartments.includes(dept))
    
    // 自分より下位の役職かどうかもチェック（店長は上位役職）
    const positionHierarchy: Record<string, number> = {
      '代表取締役': 7,
      '取締役': 6,
      '部長': 5,
      '次長': 4,
      '課長': 3,
      '係長': 2,
      '主任': 1,
      '一般社員': 0
    }
    
    const userPositions = Array.isArray(currentUser.positions) ? currentUser.positions : [currentUser.position]
    const employeePositions = Array.isArray(employee.positions) ? employee.positions : [employee.position]
    
    const userMaxLevel = Math.max(...userPositions.map((pos: string) => positionHierarchy[pos] || 0))
    const employeeMaxLevel = Math.max(...employeePositions.map((pos: string) => positionHierarchy[pos] || 0))
    
    return hasCommonDepartment && employeeMaxLevel < userMaxLevel
  }
  const [employees, setEmployees] = useState<any[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [customOrder, setCustomOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('employee-custom-order')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // ソート機能
  const applySorting = (employeeList: any[]) => {
    if (sortField === 'none') return employeeList
    
    const sorted = [...employeeList].sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortField) {
        case 'name':
          // フリガナがある場合はフリガナでソート、ない場合は名前でソート
          aValue = a.furigana || a.name
          bValue = b.furigana || b.name
          break
        case 'furigana':
          // 五十音順ソート（フリガナ優先、なければ名前）
          aValue = a.furigana || a.name
          bValue = b.furigana || b.name
          break
        case 'employeeNumber':
          aValue = a.employeeNumber || a.employeeId || ''
          bValue = b.employeeNumber || b.employeeId || ''
          break
        case 'department':
          aValue = Array.isArray(a.departments) ? a.departments[0] : a.department
          bValue = Array.isArray(b.departments) ? b.departments[0] : b.department
          break
        case 'position':
          aValue = Array.isArray(a.positions) ? a.positions[0] : a.position
          bValue = Array.isArray(b.positions) ? b.positions[0] : b.position
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }
      
      // 見えないTOP社員は常に最下部に配置
      const aIsInvisibleTop = a.isInvisibleTop || a.employeeNumber === '000'
      const bIsInvisibleTop = b.isInvisibleTop || b.employeeNumber === '000'
      
      if (aIsInvisibleTop && !bIsInvisibleTop) return 1
      if (!aIsInvisibleTop && bIsInvisibleTop) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ja')
          : bValue.localeCompare(aValue, 'ja')
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    
    return sorted
  }

  // ソート設定を変更
  const handleSort = (field: string) => {
    console.log('ソートボタンクリック:', { field, currentSortField: sortField, currentDirection: sortDirection })
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // カスタム順序を適用するヘルパー関数
  const applyCustomOrder = (employeeList: any[]) => {
    if (customOrder.length === 0) return employeeList
    
    const orderedEmployees: any[] = []
    const unorderedEmployees: any[] = []
    
    // カスタム順序に従って並べ替え
    customOrder.forEach(employeeId => {
      const employee = employeeList.find(emp => emp.id === employeeId)
      if (employee) {
        orderedEmployees.push(employee)
      }
    })
    
    // カスタム順序にない社員を末尾に追加
    employeeList.forEach(employee => {
      if (!customOrder.includes(employee.id)) {
        unorderedEmployees.push(employee)
      }
    })
    
    return [...orderedEmployees, ...unorderedEmployees]
  }

  // 順序入れ替え関数（localStorageで永続化）
  const moveEmployee = (employeeId: string, direction: 'up' | 'down') => {
    const currentIndex = filteredEmployees.findIndex(emp => emp.id === employeeId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= filteredEmployees.length) return

    // フィルタリングされた社員の順序を入れ替える
    const newFilteredEmployees = [...filteredEmployees]
    const temp = newFilteredEmployees[currentIndex]
    newFilteredEmployees[currentIndex] = newFilteredEmployees[newIndex]
    newFilteredEmployees[newIndex] = temp
    
    // カスタム順序を更新
    const newCustomOrder = [...customOrder]
    const currentEmployeeId = filteredEmployees[currentIndex].id
    const newEmployeeId = filteredEmployees[newIndex].id
    
    // カスタム順序に存在しない場合は追加
    if (!newCustomOrder.includes(currentEmployeeId)) {
      newCustomOrder.push(currentEmployeeId)
    }
    if (!newCustomOrder.includes(newEmployeeId)) {
      newCustomOrder.push(newEmployeeId)
    }
    
    // 順序を入れ替える
    const currentOrderIndex = newCustomOrder.indexOf(currentEmployeeId)
    const newOrderIndex = newCustomOrder.indexOf(newEmployeeId)
    
    if (currentOrderIndex !== -1 && newOrderIndex !== -1) {
      [newCustomOrder[currentOrderIndex], newCustomOrder[newOrderIndex]] = 
      [newCustomOrder[newOrderIndex], newCustomOrder[currentOrderIndex]]
    }
    
    setCustomOrder(newCustomOrder)
    
    // localStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('employee-custom-order', JSON.stringify(newCustomOrder))
    }
    
    // フィルタリングされたリストを更新
    setFilteredEmployees(newFilteredEmployees)
  }

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
  }, [refreshTrigger])

  // フィルター適用
  useEffect(() => {
    if (!filters) {
      // 見えないTOPの社員は管理者のみに表示
      // 休職・退職・停止中の社員はマネージャー・総務・管理者のみに表示
      const isManagerOrHR = currentUser?.role === 'manager' || currentUser?.role === 'hr' || currentUser?.role === 'admin'
      const filteredEmployees = employees.filter(employee => {
        const isInvisibleTop = employee.isInvisibleTop || employee.employeeNumber === '000'
        if (isInvisibleTop) {
          return currentUser?.role === 'admin'
        }
        const isInactive = employee.status === 'leave' || employee.status === 'retired' || employee.status === 'suspended' || employee.isSuspended
        if (isInactive) {
          return isManagerOrHR
        }
        return true
      })
    // ソートを適用
    const sortedEmployees = applySorting(filteredEmployees)
    setFilteredEmployees(sortedEmployees)
    return
    }

    let filtered = employees
    
    // 見えないTOPの社員は管理者のみに表示
    filtered = filtered.filter(employee => {
      const isInvisibleTop = employee.isInvisibleTop || employee.employeeNumber === '000'
      if (isInvisibleTop) {
        return currentUser?.role === 'admin'
      }
      return true
    })

    // 休職・退職・停止中の社員はマネージャー・総務・管理者のみに表示
    const isManagerOrHR = currentUser?.role === 'manager' || currentUser?.role === 'hr' || currentUser?.role === 'admin'
    filtered = filtered.filter(employee => {
      const isInactive = employee.status === 'leave' || employee.status === 'retired' || employee.status === 'suspended' || employee.isSuspended
      if (isInactive) {
        return isManagerOrHR
      }
      return true
    })

    // フリーワード検索（複数の組織名・部署・役職も含む）
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(employee => {
        // 複数の組織名・部署・役職を配列として取得
        const departments = Array.isArray(employee.departments) ? employee.departments : [employee.department]
        const positions = Array.isArray(employee.positions) ? employee.positions : [employee.position]
        const organizations = Array.isArray(employee.organizations) ? employee.organizations : [employee.organization]
        
        const searchableText = [
          employee.name,
          employee.employeeNumber || employee.employeeId,
          ...departments,
          ...positions,
          ...organizations,
          employee.email,
          employee.phone
        ].join(' ').toLowerCase()
        
        return searchableText.includes(query)
      })
    }

    // 雇用形態フィルター
    if (filters.employeeType !== 'all') {
      filtered = filtered.filter(employee => employee.employeeType === filters.employeeType)
    }

    // 部署フィルター（複数の部署も含む）
    if (filters.department !== 'all') {
      filtered = filtered.filter(employee => {
        const departments = Array.isArray(employee.departments) ? employee.departments : [employee.department]
        return departments.includes(filters.department)
      })
    }

    // 役職フィルター（複数の役職も含む）
    if (filters.position !== 'all') {
      filtered = filtered.filter(employee => {
        const positions = Array.isArray(employee.positions) ? employee.positions : [employee.position]
        return positions.includes(filters.position)
      })
    }

    // ステータスフィルター
    if (filters.status !== 'all') {
      filtered = filtered.filter(employee => employee.status === filters.status)
    }

    // システム使用状態のフィルタリング
    // 管理者・総務・マネージャー以外は、システムOFFの社員を非表示にする
    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
    const isManager = currentUser?.role === 'manager'
    
    if (!isAdminOrHR && !isManager) {
      // 一般ユーザーはシステム使用ONの社員のみ表示
      filtered = filtered.filter(employee => employee.role && employee.role !== '')
    }

    // ダミー社員（見えないTOP社員または社員番号000）の表示制限
    // 管理者・総務以外は、見えないTOP社員または社員番号000を非表示にする
    if (!isAdminOrHR) {
      // 見えないTOP社員または社員番号000を除外
      filtered = filtered.filter(employee => !employee.isInvisibleTop && employee.employeeNumber !== '000')
    }

    // カスタム順序を適用
    const orderedFiltered = applyCustomOrder(filtered)
    // ソートを適用
    const sortedEmployees = applySorting(orderedFiltered)
    setFilteredEmployees(sortedEmployees)
  }, [employees, filters, sortField, sortDirection])

  const getStatusBadge = (status: string, isSuspended?: boolean) => {
    if (isSuspended || status === 'suspended') {
      return (
        <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
          外注停止
        </Badge>
      )
    }
    
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
            <TableHead className="font-semibold w-20">順序</TableHead>
            <TableHead className="font-semibold">番号・考課表</TableHead>
            <TableHead className="font-semibold">
              <div className="flex items-center gap-2">
                <span className="font-semibold">氏名</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    console.log('ソートボタンクリック')
                    if (sortField === 'name') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    } else if (sortField === 'furigana') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField('name')
                      setSortDirection('asc')
                    }
                  }}
                >
                  {sortField === 'name' || sortField === 'furigana' ? (
                    sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => handleSort('furigana')}
                >
                  五十音順
                </Button>
              </div>
            </TableHead>
            <TableHead className="font-semibold">部署</TableHead>
            <TableHead className="font-semibold">役職</TableHead>
            <TableHead className="font-semibold">入社日</TableHead>
            <TableHead className="font-semibold">ステータス</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployees.map((employee, index) => (
            <TableRow
              key={employee.id}
              className={`hover:bg-slate-50 ${
                (employee.isInvisibleTop || employee.employeeNumber === '000') 
                  ? 'cursor-not-allowed opacity-60' 
                  : employee.isSuspended || employee.status === 'suspended'
                  ? 'cursor-pointer opacity-50 bg-slate-100'
                  : 'cursor-pointer'
              }`}
              onClick={() => {
                // 見えないTOPまたは社員番号000の場合はクリックを無効化
                if (!employee.isInvisibleTop && employee.employeeNumber !== '000') {
                  onEmployeeClick?.(employee)
                }
              }}
            >
              <TableCell>
                {/* 順序入れ替えボタン（管理者・総務のみ） */}
                {(currentUser?.role === 'admin' || currentUser?.role === 'hr') && (
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveEmployee(employee.id, 'up')
                      }}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        moveEmployee(employee.id, 'down')
                      }}
                      disabled={index === filteredEmployees.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {employee.employeeNumber || employee.employeeId}
                  </div>
                  {canShowEvaluationButton(employee) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={`font-mono text-xs bg-transparent ${
                        (employee.isInvisibleTop || employee.employeeNumber === '000')
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-slate-100'
                      }`}
                      disabled={employee.isInvisibleTop || employee.employeeNumber === '000'}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!employee.isInvisibleTop && employee.employeeNumber !== '000') {
                          onEvaluationClick?.(employee)
                        }
                      }}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      考課表
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {employee.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900">{employee.name}</p>
                    {/* 「見えないTOP」社員または社員番号000のみ制限表示を追加 */}
                    {(employee.isInvisibleTop || employee.employeeNumber === '000') && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
                          削除不可
                        </span>
                        <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
                          変更不可
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {employee.privacyEmail !== false && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {employee.email}
                        </span>
                      )}
                      {employee.privacyWorkPhone !== false && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {employee.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-slate-700">
                  {employee.privacyDepartment !== false ? (
                    (() => {
                      const departments = Array.isArray(employee.departments) ? employee.departments : [employee.department]
                      return departments.slice(0, 2).map((dept: string, index: number) => (
                        <div key={index}>{dept}</div>
                      ))
                    })()
                  ) : (
                    <span className="text-slate-400 italic">非公開</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-slate-700">
                  {employee.privacyPosition !== false ? (
                    (() => {
                      const positions = Array.isArray(employee.positions) ? employee.positions : [employee.position]
                      return positions.slice(0, 2).map((pos: string, index: number) => (
                        <div key={index}>{pos}</div>
                      ))
                    })()
                  ) : (
                    <span className="text-slate-400 italic">非公開</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-600">{employee.joinDate}</span>
              </TableCell>
              <TableCell>{getStatusBadge(employee.status, employee.isSuspended)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 ${
                        (employee.isInvisibleTop || employee.employeeNumber === '000')
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                      disabled={employee.isInvisibleTop || employee.employeeNumber === '000'}
                      onClick={(e) => e.stopPropagation()}
                    >
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
                    {/* 「見えないTOP」社員または社員番号000のみ編集・削除を無効化 */}
                    {(employee.isInvisibleTop || employee.employeeNumber === '000') ? (
                      <>
                        <DropdownMenuItem disabled className="text-slate-400">
                          編集（変更不可）
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="text-slate-400">
                          人事考課表を開く（変更不可）
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="text-slate-400">
                          削除（削除不可）
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onEmployeeClick?.(employee)
                          }}
                        >
                          編集
                        </DropdownMenuItem>
                        {canShowEvaluationButton(employee) && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onEvaluationClick?.(employee)
                            }}
                          >
                            人事考課表を開く
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                          削除
                        </DropdownMenuItem>
                      </>
                    )}
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
