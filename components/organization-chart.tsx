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
  parentEmployeeId?: string
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
  isSelected?: boolean
}

interface UnassignedDropZoneProps {
  children: React.ReactNode
}

interface TopDropZoneProps {
  canEdit: boolean
  onDrop: (draggedNode: OrgNode) => void
}

interface HorizontalDropZoneProps {
  parentId: string
  targetIndex: number
  canEdit: boolean
  onDrop: (draggedNode: OrgNode, targetIndex: number, parentId: string) => void
}

// 組織図表示コンポーネント（TOP社員を除外）
function DisplayOrgChartWithoutTop({
  node,
  onEmployeeClick,
  onShowSubordinates,
  selectedNodeId,
  canEdit,
  isCompactMode,
  onHorizontalMove,
}: OrgNodeCardProps & { onHorizontalMove?: (draggedNode: OrgNode, targetIndex: number, parentId: string) => void }) {
  // TOP社員（parentEmployeeIdがnull）を除外して、その子ノードのみを表示
  if (node.children && node.children.length > 0) {
    // 複数の子ノードがある場合は横並びで表示
    if (node.children.length > 1) {
      return (
        <div className="flex gap-8 relative">
          {node.children.map((child, index) => (
            <div key={child.id} className="relative">
              {node.children!.length > 1 && <div className="absolute w-0.5 h-8 bg-slate-300 left-1/2 -top-8" />}
              <DraggableOrgNodeCard
                node={child}
                level={0}
                onEmployeeClick={onEmployeeClick}
                onShowSubordinates={onShowSubordinates}
                selectedNodeId={selectedNodeId}
                canEdit={canEdit}
                isCompactMode={isCompactMode}
                onHorizontalMove={onHorizontalMove}
              />
              {/* 各社員の右側に「右へ移動」ドロップゾーンを配置 */}
              {canEdit && (
                <RightMoveDropZone
                  parentId={node.id}
                  targetIndex={index + 1}
                  canEdit={canEdit}
                  onDrop={onHorizontalMove || (() => {})}
                />
              )}
              {/* 各社員間の横ラインにドロップゾーンを配置 */}
              {index < node.children!.length - 1 && canEdit && (
                <HorizontalDropZone
                  parentId={node.id}
                  targetIndex={index + 1}
                  canEdit={canEdit}
                  onDrop={onHorizontalMove || (() => {})}
                />
              )}
            </div>
          ))}
        </div>
      )
    } else {
      // 子ノードが1つの場合は縦に表示
      return (
        <DraggableOrgNodeCard
          node={node.children[0]}
          level={0}
          onEmployeeClick={onEmployeeClick}
          onShowSubordinates={onShowSubordinates}
          selectedNodeId={selectedNodeId}
          canEdit={canEdit}
          isCompactMode={isCompactMode}
        />
      )
    }
  }

  // 子ノードがない場合は空の表示
  return (
    <div className="text-center py-8">
      <div className="text-slate-500">表示する社員がいません</div>
    </div>
  )
}

// TOP位置のドロップゾーンコンポーネント（極細・透明表示）
function TopDropZone({ canEdit, onDrop }: TopDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'top-drop-zone',
    data: { node: null },
    disabled: !canEdit,
  })

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    // ドラッグされたノードのデータを取得
    const draggedData = event.dataTransfer.getData('application/json')
    if (draggedData) {
      const draggedNode = JSON.parse(draggedData) as OrgNode
      onDrop(draggedNode)
    }
  }

  if (!canEdit) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-full transition-colors mb-4 ${
        isOver 
          ? 'border-green-400 bg-green-50 border-2 border-dashed rounded' 
          : 'border-slate-200 border border-dashed rounded bg-transparent'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{ 
        height: '1px',
        minHeight: '1px',
        maxHeight: '1px',
        opacity: isOver ? 1 : 0.3 // 通常時は薄く表示
      }}
      title="TOP位置にドロップ"
    />
  )
}

// 横ライン用のドロップゾーンコンポーネント（並列移動用）
function HorizontalDropZone({ parentId, targetIndex, canEdit, onDrop }: HorizontalDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `horizontal-drop-${parentId}-${targetIndex}`,
    data: { 
      type: 'horizontal-move',
      parentId,
      targetIndex 
    },
    disabled: !canEdit,
  })

  if (!canEdit) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      className={`absolute top-0 left-0 right-0 h-3 transition-all duration-200 ${
        isOver 
          ? 'bg-green-400 opacity-90 border-2 border-green-500' 
          : 'bg-transparent hover:bg-slate-300 hover:opacity-60'
      }`}
      style={{ 
        top: "-12px",
        left: "-4px",
        right: "-4px",
        borderRadius: "4px"
      }}
      title={`並列移動: 位置 ${targetIndex + 1}`}
    />
  )
}

// 右へ移動用のドロップゾーンコンポーネント
function RightMoveDropZone({ parentId, targetIndex, canEdit, onDrop }: HorizontalDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `right-move-${parentId}-${targetIndex}`,
    data: { 
      type: 'right-move',
      parentId,
      targetIndex 
    },
    disabled: !canEdit,
  })

  if (!canEdit) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      className={`absolute top-1/2 right-0 w-8 h-16 -translate-y-1/2 transition-all duration-200 ${
        isOver 
          ? 'bg-blue-400 opacity-90 border-2 border-blue-500' 
          : 'bg-transparent hover:bg-blue-200 hover:opacity-60'
      }`}
      style={{ 
        right: "-16px",
        borderRadius: "8px"
      }}
      title={`右へ移動: 位置 ${targetIndex + 1}`}
    />
  )
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
  onHorizontalMove,
}: OrgNodeCardProps & { onHorizontalMove?: (draggedNode: OrgNode, targetIndex: number, parentId: string) => void }) {
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
    id: node.id,
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
        className={`relative ${isOver ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          className={`${isCompactMode ? 'w-32' : 'w-48'} border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer ${
            selectedNodeId === node.id ? "ring-2 ring-blue-500" : ""
          } ${isDraggingThis ? "opacity-50" : ""}`}
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
                  onHorizontalMove={onHorizontalMove}
                />
                {/* 各社員の右側に「右へ移動」ドロップゾーンを配置 */}
                {canEdit && (
                  <RightMoveDropZone
                    parentId={node.id}
                    targetIndex={index + 1}
                    canEdit={canEdit}
                    onDrop={onHorizontalMove || (() => {})}
                  />
                )}
                {/* 各社員間の横ラインにドロップゾーンを配置 */}
                {index < node.children!.length - 1 && canEdit && (
                  <HorizontalDropZone
                    parentId={node.id}
                    targetIndex={index + 1}
                    canEdit={canEdit}
                    onDrop={onHorizontalMove || (() => {})}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// 未配置エリアのドロップゾーンコンポーネント
function UnassignedDropZone({ children }: UnassignedDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-area',
    data: { node: null }
  })

  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[100px] border-2 border-dashed rounded-lg p-2 transition-colors ${
        isOver 
          ? 'border-green-400 bg-green-50' 
          : 'border-slate-300'
      }`}
    >
      {children}
    </div>
  )
}

// 未配置社員カードコンポーネント
function UnassignedEmployeeCard({
  employee,
  isCompactMode,
  onEmployeeClick,
  canEdit,
  isSelected = false
}: UnassignedEmployeeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingThis,
  } = useDraggable({
    id: `unassigned-${employee.id}`,
    data: { 
      node: {
        id: `unassigned-${employee.id}`,
        name: employee.name,
        position: employee.position,
        department: employee.department,
        employeeNumber: employee.employeeNumber,
        organization: employee.organization,
        team: employee.team,
        employee: employee
      }
    },
    disabled: !canEdit,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isDraggingThis ? "opacity-50 z-50" : ""
      } ${isSelected ? "bg-green-50 border-green-300 ring-2 ring-green-200" : ""}`}
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
      <div className={`${isCompactMode ? 'p-1' : 'p-2'}`}>
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
      </div>
    </div>
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

    // 階層構造を構築
    const buildHierarchy = (employees: Employee[]): OrgNode[] => {
      const employeeMap = new Map<string, Employee>()
      employees.forEach(emp => employeeMap.set(emp.id, emp))

      const nodeMap = new Map<string, OrgNode>()
      
      // 全社員のノードを作成
      employees.forEach(emp => {
        const node: OrgNode = {
          id: emp.id,
          name: emp.name,
          position: emp.position,
          department: emp.department,
          employeeNumber: emp.employeeNumber,
          organization: emp.organization,
          team: emp.team,
          employee: emp,
          children: []
        }
        nodeMap.set(emp.id, node)
      })

      // 親子関係を設定
      const rootNodes: OrgNode[] = []
      
      employees.forEach(emp => {
        const node = nodeMap.get(emp.id)!
        if (emp.parentEmployeeId && nodeMap.has(emp.parentEmployeeId)) {
          // 親がいる場合、親の子として追加
          const parentNode = nodeMap.get(emp.parentEmployeeId)!
          if (!parentNode.children) {
            parentNode.children = []
          }
          parentNode.children.push(node)
        } else {
          // 親がいない場合、ルートノードとして追加
          rootNodes.push(node)
        }
      })

      return rootNodes
    }

    const hierarchy = buildHierarchy(showInChartEmployees)
    
    if (hierarchy.length === 0) {
      return {
        id: 'empty',
        name: '組織図に表示する社員がいません',
        position: '',
        department: '',
        children: []
      }
    }

    // 複数のルートがある場合は、最初のルートをメインとして使用
    const mainRoot = hierarchy[0]
    
    // 他のルートノードをメインルートの子として追加
    if (hierarchy.length > 1) {
      if (!mainRoot.children) {
        mainRoot.children = []
      }
      mainRoot.children.push(...hierarchy.slice(1))
    }

    return mainRoot
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
    // 実際の社員データから組織図を再構築
    const orgTree = buildOrgChartFromEmployees(employees)
    setDisplayedTree(orgTree)
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!canEdit) return
    const node = event.active.data.current?.node as OrgNode
    console.log('Drag started:', {
      nodeId: node.id,
      nodeName: node.name,
      isUnassigned: node.id.startsWith('unassigned-'),
      nodeData: node
    })
    setActiveNode(node)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveNode(null)

    console.log('handleDragEnd called:', {
      canEdit,
      over,
      overId: over?.id,
      activeId: active?.id
    })

    if (!canEdit || !over) {
      console.log('Early return:', { canEdit, over: !!over })
      return
    }

    const draggedNode = active.data.current?.node as OrgNode
    const targetNode = over.data.current?.node as OrgNode

    console.log('Drag End Event:', { 
      draggedNode, 
      targetNode, 
      overId: over.id,
      draggedNodeId: draggedNode?.id,
      draggedNodeName: draggedNode?.name,
      isUnassignedDrag: draggedNode?.id?.startsWith('unassigned-'),
      overData: over.data.current,
      activeData: active.data.current
    })

    if (!draggedNode) {
      console.log('No dragged node found, returning early')
      return
    }

    // 横ラインのドロップゾーンへのドロップの場合（並列移動）
    if (typeof over.id === 'string' && over.id.startsWith('horizontal-drop-')) {
      const [, , parentId, targetIndexStr] = over.id.split('-')
      const targetIndex = parseInt(targetIndexStr)
      await handleHorizontalMove(draggedNode, targetIndex, parentId)
      return
    }

    // 右へ移動のドロップゾーンへのドロップの場合
    if (typeof over.id === 'string' && over.id.startsWith('right-move-')) {
      const [, , parentId, targetIndexStr] = over.id.split('-')
      const targetIndex = parseInt(targetIndexStr)
      await handleHorizontalMove(draggedNode, targetIndex, parentId)
      return
    }

    // TOPドロップゾーンへのドロップの場合
    if (over.id === 'top-drop-zone') {
      await moveEmployeeToTop(draggedNode)
      return
    }

    // 未配置エリアへのドロップの場合
    if (over.id === 'unassigned-area') {
      await moveEmployeeToUnassigned(draggedNode)
      return
    }

    // 未配置社員から組織図へのドロップの場合
    console.log('Checking if dragged node is unassigned:', {
      draggedNodeId: draggedNode.id,
      startsWithUnassigned: draggedNode.id.startsWith('unassigned-')
    })
    
    if (draggedNode.id.startsWith('unassigned-')) {
      console.log('Unassigned employee dragged to org chart:', {
        draggedNode,
        targetNode,
        overId: over.id,
        overData: over.data.current,
        draggedNodeId: draggedNode.id,
        draggedNodeName: draggedNode.name
      })
      
      // targetNodeがnullの場合でも、overのidから対象を特定
      const targetEmployeeId = targetNode?.id || over.id
      console.log('Target employee ID:', targetEmployeeId)
      
      if (targetEmployeeId && targetEmployeeId !== 'unassigned-area') {
        console.log('Attempting to move unassigned employee to org chart:', {
          employeeId: draggedNode.employee?.id,
          employeeName: draggedNode.name,
          targetEmployeeId: String(targetEmployeeId)
        })
        await moveEmployeeToOrgChart(draggedNode, String(targetEmployeeId))
      } else {
        console.error('Invalid target for unassigned employee drop:', targetEmployeeId)
        alert('有効な配置先を選択してください')
      }
      return
    }

    // 組織図内での移動の場合
    if (!targetNode || draggedNode.id === targetNode.id) return

    if (isDescendant(draggedNode, targetNode.id)) {
      alert("循環参照エラー: 配下の社員を上長にすることはできません")
      return
    }

    const isSameParent = areSiblings(displayedTree, draggedNode.id, targetNode.id)

    if (isSameParent) {
      // 同じ親を持つ場合：横移動または縦移動を選択可能
      // ドロップ位置に応じて判断（ここでは常に縦移動として処理）
      const newTree = moveNodeAsChild(displayedTree, draggedNode.id, targetNode.id)
      setDisplayedTree(newTree)
      // データベースに階層情報を保存
      await saveOrgChartHierarchy(draggedNode, targetNode)
      console.log(`[v0] Moved ${draggedNode.name} under ${targetNode.name} (same parent)`)
    } else {
      // 異なる親の場合：縦移動
      const newTree = moveNode(displayedTree, draggedNode.id, targetNode.id)
      setDisplayedTree(newTree)
      // データベースに階層情報を保存
      await saveOrgChartHierarchy(draggedNode, targetNode)
      console.log(`[v0] Moved ${draggedNode.name} under ${targetNode.name}`)
    }
  }

  // 並列移動の処理
  const handleHorizontalMove = async (draggedNode: OrgNode, targetIndex: number, parentId: string) => {
    console.log('Handling horizontal move:', { draggedNode, targetIndex, parentId })
    
    // 同じ親を持つ子要素間での並列移動
    const newTree = reorderSiblingsHorizontal(displayedTree, draggedNode.id, targetIndex, parentId)
    if (newTree) {
      setDisplayedTree(newTree)
      console.log(`社員 ${draggedNode.name} を並列位置 ${targetIndex + 1} に移動しました`)
      // データベースに階層情報を保存
      await saveOrgChartHierarchy(draggedNode, { id: parentId } as OrgNode)
    } else {
      console.error('並列移動に失敗しました')
      alert('並列移動に失敗しました')
    }
  }

  // 社員をTOP位置に移動
  const moveEmployeeToTop = async (node: OrgNode) => {
    if (!node.employee) {
      console.error('Node employee not found:', node)
      return
    }

    try {
      const updateData = {
        ...node.employee,
        parentEmployeeId: null
      }
      
      console.log('Moving employee to top:', {
        employeeId: node.employee.id,
        employeeName: node.employee.name,
        updateData
      })

      const response = await fetch(`/api/employees/${node.employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // 社員データを更新
        await fetchEmployees()
        console.log(`社員 ${node.name} をTOP位置に移動しました`)
        alert(`社員 ${node.name} をTOP位置に移動しました`)
      } else {
        const errorData = await response.text()
        console.error('Failed to move employee to top:', response.status, errorData)
        alert(`社員の移動に失敗しました: ${response.status}`)
      }
    } catch (error) {
      console.error('社員の移動に失敗しました:', error)
      alert(`社員の移動に失敗しました: ${error}`)
    }
  }

  // 社員を未配置エリアに移動
  const moveEmployeeToUnassigned = async (node: OrgNode) => {
    if (!node.employee) {
      console.error('Node employee not found:', node)
      return
    }

    try {
      const updateData = {
        ...node.employee,
        showInOrgChart: false,
        parentEmployeeId: null
      }
      
      console.log('Moving employee to unassigned:', {
        employeeId: node.employee.id,
        employeeName: node.employee.name,
        updateData
      })

      const response = await fetch(`/api/employees/${node.employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // 社員データを更新
        await fetchEmployees()
        console.log(`社員 ${node.name} を未配置エリアに移動しました`)
        alert(`社員 ${node.name} を未配置エリアに移動しました`)
      } else {
        const errorData = await response.text()
        console.error('Failed to move employee to unassigned:', response.status, errorData)
        alert(`社員の移動に失敗しました: ${response.status}`)
      }
    } catch (error) {
      console.error('社員の移動に失敗しました:', error)
      alert(`社員の移動に失敗しました: ${error}`)
    }
  }

  // 未配置社員を組織図に移動
  const moveEmployeeToOrgChart = async (unassignedNode: OrgNode, targetEmployeeId: string) => {
    const employeeId = unassignedNode.employee?.id || unassignedNode.id.replace('unassigned-', '')
    const employee = employees.find(emp => emp.id === employeeId)
    const targetEmployee = employees.find(emp => emp.id === targetEmployeeId)
    
    console.log('Moving employee to org chart:', { 
      employeeId, 
      employee, 
      targetEmployeeId, 
      targetEmployee,
      unassignedNode 
    })
    
    if (!employee) {
      console.error('Employee not found:', employeeId)
      alert(`社員が見つかりません: ${employeeId}`)
      return
    }

    if (!targetEmployee) {
      console.error('Target employee not found:', targetEmployeeId)
      alert(`対象社員が見つかりません: ${targetEmployeeId}`)
      return
    }

    try {
      // 社員のshowInOrgChartをtrueに更新し、parentEmployeeIdを設定
      const updateData = {
        ...employee,
        showInOrgChart: true,
        parentEmployeeId: targetEmployee.id
      }
      
      console.log('Sending update data for unassigned to org chart:', {
        employeeId: employee.id,
        targetEmployeeId: targetEmployee.id,
        updateData
      })
      
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        // 社員データを更新
        await fetchEmployees()
        console.log(`社員 ${employee.name} を組織図に移動しました（親: ${targetEmployee.name}）`)
        alert(`社員 ${employee.name} を ${targetEmployee.name} の配下に移動しました`)
      } else {
        const errorData = await response.text()
        console.error('Failed to update employee from unassigned to org chart:', response.status, errorData)
        alert(`社員の移動に失敗しました: ${response.status} - ${errorData}`)
      }
    } catch (error) {
      console.error('社員の移動に失敗しました:', error)
      alert(`社員の移動に失敗しました: ${error}`)
    }
  }

  // 組織図の階層情報をデータベースに保存
  const saveOrgChartHierarchy = async (draggedNode: OrgNode, targetNode: OrgNode) => {
    if (!draggedNode.employee) {
      console.error('Dragged node employee not found')
      return
    }

    if (!targetNode.employee) {
      console.error('Target node employee not found')
      return
    }

    try {
      const updateData = {
        ...draggedNode.employee,
        parentEmployeeId: targetNode.employee.id
      }
      
      console.log('Saving hierarchy:', {
        draggedEmployee: draggedNode.employee.name,
        targetEmployee: targetNode.employee.name,
        updateData
      })

      const response = await fetch(`/api/employees/${draggedNode.employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        console.log(`社員 ${draggedNode.name} の階層情報を保存しました（親: ${targetNode.name}）`)
        // データを再取得して最新状態に更新
        await fetchEmployees()
      } else {
        const errorData = await response.text()
        console.error('階層情報の保存に失敗しました:', response.status, errorData)
        alert(`階層情報の保存に失敗しました: ${response.status}`)
      }
    } catch (error) {
      console.error('階層情報の保存に失敗しました:', error)
      alert(`階層情報の保存に失敗しました: ${error}`)
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

  // 並列移動用の並び替え関数
  const reorderSiblingsHorizontal = (tree: OrgNode, draggedId: string, targetIndex: number, parentId: string): OrgNode | null => {
    const reorder = (node: OrgNode): OrgNode => {
      if (!node.children) return node

      // 指定された親ノードの場合
      if (node.id === parentId) {
        const draggedIndex = node.children.findIndex((child) => child.id === draggedId)
        
        if (draggedIndex !== -1) {
          const newChildren = [...node.children]
          const [draggedNode] = newChildren.splice(draggedIndex, 1)
          
          // ターゲット位置に挿入
          newChildren.splice(targetIndex, 0, draggedNode)
          
          return { ...node, children: newChildren }
        }
      }

      // Recursively check children
      return {
        ...node,
        children: node.children.map((child) => reorder(child)),
      }
    }

    const result = reorder(tree)
    return result
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

  // 同じ親を持つノードを子として移動（同じ階層での上下関係配置）
  const moveNodeAsChild = (tree: OrgNode, draggedId: string, targetId: string): OrgNode => {
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

    const addNodeAsChild = (node: OrgNode): OrgNode => {
      if (node.id === targetId && draggedNode) {
        const newChildren = node.children ? [...node.children, draggedNode] : [draggedNode]
        return { ...node, children: newChildren }
      }

      if (node.children) {
        return { ...node, children: node.children.map((child) => addNodeAsChild(child)) }
      }

      return node
    }

    let newTree = removeNode(tree)
    if (draggedNode) {
      newTree = addNodeAsChild(newTree)
    }

    return newTree
  }

  const superiorsToDisplay = selectedNodeId ? getSuperiors(selectedNodeId, superiorLevels, employees) : []
  
  console.log('Superiors display info:', {
    selectedNodeId,
    superiorLevels,
    superiorsToDisplay: superiorsToDisplay.length,
    employeesCount: employees.length,
    superiorsToDisplayDetails: superiorsToDisplay.map(s => ({ id: s.id, name: s.name }))
  })

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
                  <UnassignedDropZone>
                    {unassignedEmployees.map((emp) => (
                      <UnassignedEmployeeCard
                        key={emp.id}
                        employee={emp}
                        isCompactMode={isCompactMode}
                        onEmployeeClick={onEmployeeClick}
                        canEdit={canEdit}
                        isSelected={selectedNodeId === emp.id}
                      />
                    ))}
                    {unassignedEmployees.length === 0 && (
                      <div className="text-center text-slate-500 text-sm py-4">
                        未配置社員はありません
                      </div>
                    )}
                  </UnassignedDropZone>
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
              <>
                {/* 配下表示時は自分のカードのみを表示 */}
                {selectedNodeId ? (
                  <div className="mb-4">
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-slate-600 mb-2 font-medium">現在選択中の社員</div>
                      <DraggableOrgNodeCard
                        node={displayedTree}
                        onEmployeeClick={onEmployeeClick}
                        onShowSubordinates={handleShowSubordinates}
                        selectedNodeId={selectedNodeId}
                        canEdit={canEdit}
                        isCompactMode={isCompactMode}
                        onHorizontalMove={handleHorizontalMove}
                      />
                      <div className="w-0.5 h-8 bg-slate-300 my-2" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* TOPドロップゾーン（管理者・総務のみ表示） */}
                    {(permissions.editAllProfiles || permissions.editOrgChart) && (
                      <TopDropZone 
                        canEdit={canEdit}
                        onDrop={moveEmployeeToTop}
                      />
                    )}
                    
                    {/* 組織図の表示（「見えないTOP」を除外して表示） */}
                    <DisplayOrgChartWithoutTop
                      node={displayedTree}
                      onEmployeeClick={onEmployeeClick}
                      onShowSubordinates={handleShowSubordinates}
                      selectedNodeId={selectedNodeId}
                      canEdit={canEdit}
                      isCompactMode={isCompactMode}
                      onHorizontalMove={handleHorizontalMove}
                    />
                  </>
                )}
              </>
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

function getSuperiors(nodeId: string, levels: number, employees: Employee[]): OrgNode[] {
  if (levels === 0) return []

  console.log('Getting superiors for:', { nodeId, levels, employeesCount: employees.length })

  const findSuperiorChain = (employeeId: string, remainingLevels: number): OrgNode[] => {
    if (remainingLevels <= 0) return []
    
    const employee = employees.find(emp => emp.id === employeeId)
    console.log('Finding superior for employee:', { employeeId, employee, remainingLevels })
    
    if (!employee) {
      console.log('Employee not found:', employeeId)
      return []
    }
    
    if (!employee.parentEmployeeId) {
      console.log('No parent employee ID for:', employee.name)
      return []
    }
    
    const parentEmployee = employees.find(emp => emp.id === employee.parentEmployeeId)
    console.log('Parent employee found:', { parentEmployee })
    
    if (!parentEmployee) {
      console.log('Parent employee not found:', employee.parentEmployeeId)
      return []
    }
    
    const parentNode: OrgNode = {
      id: parentEmployee.id,
      name: parentEmployee.name,
      position: parentEmployee.position,
      department: parentEmployee.department,
      employeeNumber: parentEmployee.employeeNumber,
      organization: parentEmployee.organization,
      team: parentEmployee.team,
      employee: parentEmployee,
      children: undefined
    }
    
    const superiors = [parentNode, ...findSuperiorChain(parentEmployee.id, remainingLevels - 1)]
    console.log('Superiors found:', superiors)
    return superiors
  }

  const result = findSuperiorChain(nodeId, levels)
  console.log('Final superiors result:', result)
  // 上長表示の順序を反転（直属の上長から上位へ）
  return result.reverse()
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
