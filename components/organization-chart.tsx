"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { organizationData } from "@/lib/mock-data"
import { Users, ZoomIn, ZoomOut, Maximize2, Edit2, ChevronUp, ChevronDown, GripVertical, Eye, List } from "lucide-react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core"
import { usePermissions } from "@/hooks/use-permissions"

interface Employee {
  id: string
  employeeId: string
  employeeNumber: string
  employeeType: string
  name: string
  email: string
  phone?: string
  phoneInternal?: string
  phoneMobile?: string
  department: string
  position: string
  organization: string
  team?: string
  joinDate: string
  status: string
  password: string
  role?: string
  myNumber?: string
  userId?: string
  url?: string
  address?: string
  selfIntroduction?: string
  birthDate?: string
  showInOrgChart: boolean
  createdAt: string
  updatedAt: string
}

interface OrgNode {
  id: string
  name: string
  position: string
  department: string
  employeeNumber?: string
  organization?: string
  team?: string
  employeeCount?: number
  children?: OrgNode[]
  employee?: Employee
}

interface OrgNodeCardProps {
  node: OrgNode
  level?: number
  onEmployeeClick?: (employee: OrgNode) => void
  onShowSubordinates?: (node: OrgNode) => void
  selectedNodeId?: string | null
  isDragging?: boolean
  canEdit?: boolean
  isCompactMode?: boolean
}

interface UnassignedEmployeeCardProps {
  employee: Employee
  isCompactMode: boolean
  onEmployeeClick?: (employee: OrgNode) => void
  canEdit: boolean
}

function DraggableOrgNodeCard({
  node,
  level = 0,
  onEmployeeClick,
  onShowSubordinates,
  selectedNodeId,
  isDragging,
  canEdit = false,
  isCompactMode = false,
}: OrgNodeCardProps) {
  const hasChildren = node.children && node.children.length > 0
  const [departmentLabel, setDepartmentLabel] = useState(node.department)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging: isDraggingThis,
  } = useDraggable({
    id: node.id,
    data: { node },
    disabled: !canEdit,
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { node },
    disabled: !canEdit,
  })

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex items-center gap-2">
        {isEditingLabel && canEdit ? (
          <Input
            value={departmentLabel}
            onChange={(e) => setDepartmentLabel(e.target.value)}
            onBlur={() => setIsEditingLabel(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditingLabel(false)
            }}
            className="h-7 text-sm w-48"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-md">
            <span className="text-sm font-medium text-slate-700">{departmentLabel}</span>
            {canEdit && (
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setIsEditingLabel(true)}>
                <Edit2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div
        ref={(node) => {
          setDragRef(node)
          setDropRef(node)
        }}
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          className={`${isCompactMode ? 'w-32' : 'w-48'} border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer ${
            selectedNodeId === node.id ? "ring-2 ring-blue-500" : ""
          } ${isDraggingThis ? "opacity-50" : ""} ${isOver ? "ring-2 ring-green-500 bg-green-50" : ""}`}
          onClick={() => onEmployeeClick?.(node)}
        >
          <CardContent className={`${isCompactMode ? 'p-1' : 'p-2'}`}>
            <div className="flex flex-col gap-1 text-center">
              <div className="flex items-center gap-2">
                {canEdit ? (
                  <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing flex-shrink-0">
                    <GripVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </div>
                ) : (
                  <div className="w-4 flex-shrink-0" />
                )}
                <Avatar className={`${isCompactMode ? 'w-6 h-6' : 'w-8 h-8'} flex-shrink-0`}>
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                    {node.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {!isCompactMode && (
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{node.name}</h3>
                  </div>
                )}
              </div>
              {isCompactMode ? (
                <div className="text-left pl-8">
                  <h3 className="font-semibold text-xs text-slate-900 truncate">{node.name}</h3>
                </div>
              ) : (
                <>
                  {node.employeeNumber && (
                    <p className="text-xs text-slate-500 font-mono text-left pl-10">{node.employeeNumber}</p>
                  )}
                  {node.organization && (
                    <p className="text-xs text-slate-600 truncate text-left pl-10">{node.organization}</p>
                  )}
                  <p className="text-xs text-slate-600 truncate text-left pl-10">{node.position}</p>
                </>
              )}
            </div>
          </CardContent>

          {isHovered && !isDraggingThis && (
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-b-lg shadow-lg z-10 flex gap-1 p-1">
              {hasChildren && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowSubordinates?.(node)
                  }}
                >
                  <Users className="w-3 h-3 mr-1" />
                  配下の表示
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="text-xs flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onEmployeeClick?.(node)
                }}
              >
                社員情報表示
              </Button>
            </div>
          )}
        </Card>
      </div>

      {hasChildren && (
        <>
          <div className="w-0.5 h-8 bg-slate-300 my-2" />
          <div className="flex gap-8 relative">
            {node.children!.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-300" style={{ top: "-8px" }} />
            )}
            {node.children!.map((child, index) => (
              <div key={child.id} className="relative">
                {node.children!.length > 1 && <div className="absolute w-0.5 h-8 bg-slate-300 left-1/2 -top-8" />}
                <DraggableOrgNodeCard
                  node={child}
                  level={level + 1}
                  onEmployeeClick={onEmployeeClick}
                  onShowSubordinates={onShowSubordinates}
                  selectedNodeId={selectedNodeId}
                  canEdit={canEdit}
                  isCompactMode={isCompactMode}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// 未配置社員カードコンポーネント
function UnassignedEmployeeCard({
  employee,
  isCompactMode,
  onEmployeeClick,
  canEdit
}: UnassignedEmployeeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging: isDraggingThis,
  } = useDraggable({
    id: `unassigned-${employee.id}`,
    data: { node: { ...employee, id: `unassigned-${employee.id}` } },
    disabled: !canEdit,
  })

  return (
    <Card
      ref={setNodeRef}
      className={`${isCompactMode ? 'w-full' : 'w-full'} border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isDraggingThis ? "opacity-50" : ""
      }`}
      onClick={() => onEmployeeClick?.({
        id: employee.id,
        name: employee.name,
        position: employee.position,
        department: employee.department,
        employeeNumber: employee.employeeNumber,
        organization: employee.organization,
        team: employee.team,
        employee: employee
      })}
    >
      <CardContent className={`${isCompactMode ? 'p-1' : 'p-2'}`}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {canEdit ? (
              <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing flex-shrink-0">
                <GripVertical className="w-3 h-3 text-slate-400 hover:text-slate-600" />
              </div>
            ) : (
              <div className="w-3 flex-shrink-0" />
            )}
            <Avatar className={`${isCompactMode ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`}>
              <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold text-xs">
                {employee.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <h3 className={`${isCompactMode ? 'text-xs' : 'text-sm'} font-semibold text-slate-900 truncate`}>
                {employee.name}
              </h3>
              {!isCompactMode && (
                <p className="text-xs text-slate-600 truncate">{employee.position}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface OrganizationChartProps {
  onEmployeeClick?: (employee: OrgNode) => void
}

export const OrganizationChart = forwardRef<{ refresh: () => void }, OrganizationChartProps>(
  ({ onEmployeeClick }, ref) => {
  const { permissions } = usePermissions()
  const canEdit = permissions.editOrgChart

  const [zoom, setZoom] = useState(90)
  const [viewMode, setViewMode] = useState<"all" | "department">("all")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [displayedTree, setDisplayedTree] = useState<OrgNode>(organizationData)
  const [subordinateLevels, setSubordinateLevels] = useState(20)
  const [superiorLevels, setSuperiorLevels] = useState(0)
  const [showLevelControls, setShowLevelControls] = useState(false)
  const [activeNode, setActiveNode] = useState<OrgNode | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [unassignedEmployees, setUnassignedEmployees] = useState<Employee[]>([])
  const [isCompactMode, setIsCompactMode] = useState(true)
  const [showUnassignedArea, setShowUnassignedArea] = useState(false)
  const [showUnassignedList, setShowUnassignedList] = useState(false)
  const [loading, setLoading] = useState(true)

  // 社員データを取得
  useEffect(() => {
    fetchEmployees()
  }, [])

  // 外部から呼び出せるメソッドを定義
  useImperativeHandle(ref, () => ({
    refresh: fetchEmployees
  }))

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data)
      
      // showInOrgChartがfalseの社員を未配置社員として設定
      const unassigned = data.filter((emp: Employee) => !emp.showInOrgChart)
      setUnassignedEmployees(unassigned)
      
      // 組織図を構築
      const orgTree = buildOrgChartFromEmployees(data)
      setDisplayedTree(orgTree)
      
      setLoading(false)
    } catch (error) {
      console.error('社員データの取得に失敗しました:', error)
      setLoading(false)
    }
  }

  // 社員データから組織図を構築
  const buildOrgChartFromEmployees = (employees: Employee[]): OrgNode => {
    const showInChartEmployees = employees.filter(emp => emp.showInOrgChart)
    
    if (showInChartEmployees.length === 0) {
      return {
        id: 'empty',
        name: '組織図に表示する社員がいません',
        position: '',
        department: '',
        children: []
      }
    }

    // 部門ごとにグループ化
    const departmentGroups = showInChartEmployees.reduce((acc, emp) => {
      const dept = emp.department || '未設定部門'
      if (!acc[dept]) {
        acc[dept] = []
      }
      acc[dept].push(emp)
      return acc
    }, {} as Record<string, Employee[]>)

    // 最初の部門をルートノードとして設定
    const firstDept = Object.keys(departmentGroups)[0]
    const firstDeptEmployees = departmentGroups[firstDept]
    
    if (firstDeptEmployees.length === 0) {
      return {
        id: 'empty',
        name: '組織図に表示する社員がいません',
        position: '',
        department: '',
        children: []
      }
    }

    // 最初の社員をルートとして設定
    const rootEmployee = firstDeptEmployees[0]
    const rootNode: OrgNode = {
      id: rootEmployee.id,
      name: rootEmployee.name,
      position: rootEmployee.position,
      department: rootEmployee.department,
      employeeNumber: rootEmployee.employeeNumber,
      organization: rootEmployee.organization,
      team: rootEmployee.team,
      employee: rootEmployee,
      children: []
    }

    // 残りの社員を子ノードとして追加
    const otherEmployees = [
      ...firstDeptEmployees.slice(1),
      ...Object.entries(departmentGroups)
        .filter(([dept]) => dept !== firstDept)
        .flatMap(([, emps]) => emps)
    ]

    otherEmployees.forEach(emp => {
      const childNode: OrgNode = {
        id: emp.id,
        name: emp.name,
        position: emp.position,
        department: emp.department,
        employeeNumber: emp.employeeNumber,
        organization: emp.organization,
        team: emp.team,
        employee: emp
      }
      rootNode.children!.push(childNode)
    })

    return rootNode
  }

  const handleZoomIn = () => setZoom(Math.min(zoom + 10, 200))
  const handleZoomOut = () => setZoom(Math.max(zoom - 10, 50))
  const handleResetZoom = () => setZoom(100)

  const handleShowSubordinates = (node: OrgNode) => {
    setSelectedNodeId(node.id)
    setDisplayedTree(node)
  }

  const handleResetView = () => {
    setSelectedNodeId(null)
    setDisplayedTree(organizationData)
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!canEdit) return
    const node = event.active.data.current?.node as OrgNode
    setActiveNode(node)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveNode(null)

    if (!canEdit || !over) return

    const draggedNode = active.data.current?.node as OrgNode
    const targetNode = over.data.current?.node as OrgNode

    if (!draggedNode || !targetNode || draggedNode.id === targetNode.id) return

    // 未配置エリアへのドロップの場合
    if (over.id === 'unassigned-area') {
      await moveEmployeeToUnassigned(draggedNode)
      return
    }

    // 未配置社員から組織図へのドロップの場合
    if (draggedNode.id.startsWith('unassigned-')) {
      await moveEmployeeToOrgChart(draggedNode, targetNode)
      return
    }

    if (isDescendant(draggedNode, targetNode.id)) {
      alert("循環参照エラー: 配下の社員を上長にすることはできません")
      return
    }

    const isSameParent = areSiblings(displayedTree, draggedNode.id, targetNode.id)

    if (isSameParent) {
      // Horizontal reordering within same parent
      const newTree = reorderSiblings(displayedTree, draggedNode.id, targetNode.id)
      setDisplayedTree(newTree)
      console.log(`[v0] Reordered ${draggedNode.name} next to ${targetNode.name}`)
    } else {
      // Vertical move to different parent
      const newTree = moveNode(displayedTree, draggedNode.id, targetNode.id)
      setDisplayedTree(newTree)
      console.log(`[v0] Moved ${draggedNode.name} under ${targetNode.name}`)
    }
  }

  // 社員を未配置エリアに移動
  const moveEmployeeToUnassigned = async (node: OrgNode) => {
    if (!node.employee) return

    try {
      const response = await fetch(`/api/employees/${node.employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...node.employee,
          showInOrgChart: false
        }),
      })

      if (response.ok) {
        // 社員データを更新
        await fetchEmployees()
        console.log(`社員 ${node.name} を未配置エリアに移動しました`)
      }
    } catch (error) {
      console.error('社員の移動に失敗しました:', error)
    }
  }

  // 未配置社員を組織図に移動
  const moveEmployeeToOrgChart = async (unassignedNode: OrgNode, targetNode: OrgNode) => {
    const employeeId = unassignedNode.id.replace('unassigned-', '')
    const employee = employees.find(emp => emp.id === employeeId)
    
    if (!employee) return

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...employee,
          showInOrgChart: true
        }),
      })

      if (response.ok) {
        // 社員データを更新
        await fetchEmployees()
        console.log(`社員 ${employee.name} を組織図に移動しました`)
      }
    } catch (error) {
      console.error('社員の移動に失敗しました:', error)
    }
  }

  const isDescendant = (parent: OrgNode, childId: string): boolean => {
    if (parent.id === childId) return true
    if (!parent.children) return false
    return parent.children.some((child) => isDescendant(child, childId))
  }

  const areSiblings = (tree: OrgNode, nodeId1: string, nodeId2: string): boolean => {
    const findParent = (node: OrgNode, targetId: string): OrgNode | null => {
      if (!node.children) return null
      if (node.children.some((child) => child.id === targetId)) return node
      for (const child of node.children) {
        const parent = findParent(child, targetId)
        if (parent) return parent
      }
      return null
    }

    const parent1 = findParent(tree, nodeId1)
    const parent2 = findParent(tree, nodeId2)

    return parent1 !== null && parent1 === parent2
  }

  const reorderSiblings = (tree: OrgNode, draggedId: string, targetId: string): OrgNode => {
    const reorder = (node: OrgNode): OrgNode => {
      if (!node.children) return node

      // Check if both nodes are children of this node
      const draggedIndex = node.children.findIndex((child) => child.id === draggedId)
      const targetIndex = node.children.findIndex((child) => child.id === targetId)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Both are children of this node, reorder them
        const newChildren = [...node.children]
        const [draggedNode] = newChildren.splice(draggedIndex, 1)
        const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex
        newChildren.splice(newTargetIndex + 1, 0, draggedNode)

        return { ...node, children: newChildren }
      }

      // Recursively check children
      return {
        ...node,
        children: node.children.map((child) => reorder(child)),
      }
    }

    return reorder(tree)
  }

  const moveNode = (tree: OrgNode, draggedId: string, targetId: string): OrgNode => {
    let draggedNode: OrgNode | null = null

    const removeNode = (node: OrgNode): OrgNode => {
      if (!node.children) return node

      const draggedChild = node.children.find((child) => child.id === draggedId)
      if (draggedChild) {
        draggedNode = { ...draggedChild }
        return {
          ...node,
          children: node.children.filter((child) => child.id !== draggedId),
        }
      }

      return {
        ...node,
        children: node.children.map((child) => removeNode(child)),
      }
    }

    const addNode = (node: OrgNode): OrgNode => {
      if (node.id === targetId && draggedNode) {
        const newChildren = node.children ? [...node.children, draggedNode] : [draggedNode]
        return { ...node, children: newChildren }
      }

      if (node.children) {
        return { ...node, children: node.children.map((child) => addNode(child)) }
      }

      return node
    }

    let newTree = removeNode(tree)
    if (draggedNode) {
      newTree = addNode(newTree)
    }

    return newTree
  }

  const superiorsToDisplay = selectedNodeId ? getSuperiors(selectedNodeId, superiorLevels, displayedTree) : []

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-900">組織図</h3>
            {!canEdit && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" />
                閲覧のみ
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              表示: {zoom}%
            </Badge>
            {selectedNodeId && (
              <Button variant="outline" size="sm" onClick={handleResetView}>
                全体表示に戻る
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowLevelControls(!showLevelControls)}>
              <Users className="w-4 h-4 mr-2" />
              表示階層設定
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowUnassignedArea(!showUnassignedArea)}
            >
              <List className="w-4 h-4 mr-2" />
              未配置社員({unassignedEmployees.length})
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsCompactMode(!isCompactMode)}
            >
              {isCompactMode ? '詳細表示' : 'コンパクト表示'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              <Maximize2 className="w-4 h-4 mr-2" />
              100%
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showLevelControls && (
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">
                  <ChevronUp className="w-4 h-4 inline mr-1" />
                  上長表示
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={superiorLevels}
                  onChange={(e) => setSuperiorLevels(Math.max(0, Number.parseInt(e.target.value) || 0))}
                  className="w-20"
                />
                <span className="text-sm text-slate-600">段階</span>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">
                  <ChevronDown className="w-4 h-4 inline mr-1" />
                  配下表示
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={subordinateLevels}
                  onChange={(e) => setSubordinateLevels(Math.max(0, Number.parseInt(e.target.value) || 0))}
                  className="w-20"
                />
                <span className="text-sm text-slate-600">段階</span>
              </div>
              <p className="text-xs text-slate-500">※ 上長は直系のみ表示されます（横の組織は表示されません）</p>
            </div>
          </div>
        )}

        <div className="p-8 overflow-x-auto">
          <div className="flex gap-4">
            {/* 未配置社員エリア */}
            {showUnassignedArea && (
              <div className="flex-shrink-0">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-w-[200px]">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">未配置社員</h4>
                  <div
                    id="unassigned-area"
                    className="space-y-2 min-h-[100px] border-2 border-dashed border-slate-300 rounded-lg p-2"
                  >
                    {unassignedEmployees.map((emp) => (
                      <UnassignedEmployeeCard
                        key={emp.id}
                        employee={emp}
                        isCompactMode={isCompactMode}
                        onEmployeeClick={onEmployeeClick}
                        canEdit={canEdit}
                      />
                    ))}
                    {unassignedEmployees.length === 0 && (
                      <div className="text-center text-slate-500 text-sm py-4">
                        未配置社員はありません
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* メインの組織図エリア */}
            <div
              className="min-w-max flex flex-col items-center justify-center transition-transform flex-1"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
            {superiorsToDisplay.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-col items-center gap-2">
                  {superiorsToDisplay.map((superior, index) => (
                    <div key={superior.id}>
                      <DraggableOrgNodeCard
                        node={superior}
                        onEmployeeClick={onEmployeeClick}
                        onShowSubordinates={handleShowSubordinates}
                        selectedNodeId={null}
                        canEdit={canEdit}
                        isCompactMode={isCompactMode}
                      />
                      {index < superiorsToDisplay.length - 1 && <div className="w-0.5 h-8 bg-slate-300 mx-auto my-2" />}
                    </div>
                  ))}
                  <div className="w-0.5 h-8 bg-slate-300 my-2" />
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="text-slate-500">読み込み中...</div>
              </div>
            ) : (
              <DraggableOrgNodeCard
                node={displayedTree}
                onEmployeeClick={onEmployeeClick}
                onShowSubordinates={handleShowSubordinates}
                selectedNodeId={selectedNodeId}
                canEdit={canEdit}
                isCompactMode={isCompactMode}
              />
            )}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          {canEdit ? (
            <p className="text-xs text-slate-500 text-center">
              ※ 部署名をクリックして編集 /
              カードの左側をドラッグして組織を変更（同じ階層内で横移動、または別の上長の配下に移動） /
              カードにカーソルを乗せて操作メニューを表示
            </p>
          ) : (
            <p className="text-xs text-slate-500 text-center">
              ※ 閲覧モード：組織図の編集にはマネージャー権限以上が必要です
            </p>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeNode ? (
          <Card className={`${isCompactMode ? 'w-32' : 'w-48'} border-slate-200 shadow-lg opacity-90`}>
            <CardContent className={`${isCompactMode ? 'p-1' : 'p-2'}`}>
              <div className="flex flex-col gap-1 text-center">
                <div className="flex items-center gap-2">
                  <Avatar className={`${isCompactMode ? 'w-6 h-6' : 'w-8 h-8'} flex-shrink-0`}>
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                      {activeNode.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {!isCompactMode && (
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 truncate">{activeNode.name}</h3>
                    </div>
                  )}
                </div>
                {isCompactMode ? (
                  <div className="text-left pl-8">
                    <h3 className="font-semibold text-xs text-slate-900 truncate">{activeNode.name}</h3>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 truncate text-left pl-10">{activeNode.position}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
})

OrganizationChart.displayName = 'OrganizationChart'

function getSuperiors(nodeId: string, levels: number, tree: OrgNode): OrgNode[] {
  if (levels === 0) return []

  const findSuperior = (node: OrgNode, targetId: string, path: OrgNode[] = []): OrgNode[] | null => {
    if (node.id === targetId) {
      return path.slice(-levels)
    }

    if (node.children) {
      for (const child of node.children) {
        const result = findSuperior(child, targetId, [...path, node])
        if (result) return result
      }
    }

    return null
  }

  const superiors = findSuperior(tree, nodeId) || []

  return superiors.map((superior) => ({
    ...superior,
    children: undefined,
  }))
}

function limitSubordinateLevels(node: OrgNode, levels: number): OrgNode {
  if (levels === 0 || !node.children) {
    return { ...node, children: undefined }
  }

  return {
    ...node,
    children: node.children.map((child) => limitSubordinateLevels(child, levels - 1)),
  }
}

function getFilteredTree(tree: OrgNode, viewMode: string, subordinateLevels: number): OrgNode {
  if (viewMode === "all") {
    return limitSubordinateLevels(tree, subordinateLevels)
  }
  return limitSubordinateLevels(tree, subordinateLevels)
}
