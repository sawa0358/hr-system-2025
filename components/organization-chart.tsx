"use client"

import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { organizationData } from "@/lib/mock-data"
import { Users, ZoomIn, ZoomOut, Maximize2, Edit2, ChevronUp, ChevronDown, GripVertical, Eye, List, Save, Download, Upload, ToggleLeft, ToggleRight } from "lucide-react"
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
import { useAuth } from "@/lib/auth-context"

import { useToast } from "@/hooks/use-toast"

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
  description?: string
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
  isInvisibleTop?: boolean
  isSuspended?: boolean
  retirementDate?: string
  orgChartLabel?: string
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
  description?: string
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

// 組織図表示コンポーネント（見えないTOPを除外）
function DisplayOrgChartWithoutTop({
  node,
  onEmployeeClick,
  onShowSubordinates,
  selectedNodeId,
  canEdit,
  isCompactMode,
  onHorizontalMove,
}: OrgNodeCardProps & { onHorizontalMove?: (draggedNode: OrgNode, targetIndex: number, parentId: string) => void }) {
  // 見えないTOPの社員を除外する判定
  const isInvisibleTop = node.employee?.isInvisibleTop || node.employee?.employeeNumber === '000'
  
  // デバッグログを追加
  console.log('DisplayOrgChartWithoutTop - ノード情報:', {
    nodeId: node.id,
    nodeName: node.name,
    isInvisibleTop,
    employeeNumber: node.employee?.employeeNumber,
    hasChildren: node.children && node.children.length > 0,
    childrenCount: node.children?.length || 0
  })
  
  // 見えないTOPの場合は何も表示しない
  if (isInvisibleTop) {
    console.log('見えないTOPのため非表示:', node.name)
    return null
  }
  
  // 仮想ルートノードの場合は、子ノードを横並びで表示
  if (node.id === 'virtual-root' && node.children && node.children.length > 0) {
    const visibleChildren = node.children.filter(child => {
      const isChildInvisibleTop = child.employee?.isInvisibleTop || child.employee?.employeeNumber === '000'
      return !isChildInvisibleTop
    })
    
    if (visibleChildren.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-slate-500">表示する社員がいません</div>
        </div>
      )
    }
    
    return (
      <div key="virtual-root-container" className="flex gap-8 relative">
        {visibleChildren.map((child, index) => (
          <div key={`virtual-child-${child.id}-${index}`} className="relative">
            {visibleChildren.length > 1 && <div className="absolute w-0.5 h-8 left-1/2 -top-8" style={{ backgroundColor: '#bbbfc1' }} />}
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
            {/* 各社員の左側に「左へ移動」ドロップゾーンを配置（最初の要素以外） */}
            {canEdit && index > 0 && (
              <LeftMoveDropZone
                parentId={node.id}
                targetIndex={index}
                canEdit={canEdit}
                onDrop={onHorizontalMove || (() => {})}
              />
            )}
            {/* 各社員の右側に「右へ移動」ドロップゾーンを配置（最後の要素以外） */}
            {canEdit && index < visibleChildren.length - 1 && (
              <RightMoveDropZone
                parentId={node.id}
                targetIndex={index + 1}
                canEdit={canEdit}
                onDrop={onHorizontalMove || (() => {})}
              />
            )}
            {/* 各社員間の横ラインにドロップゾーンを配置 */}
            {index < visibleChildren.length - 1 && canEdit && (
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
  }
  
  // 通常のノードの場合（1階層目の社員など）
  // このノード自体を表示
  return (
    <DraggableOrgNodeCard
      node={node}
      level={0}
      onEmployeeClick={onEmployeeClick}
      onShowSubordinates={onShowSubordinates}
      selectedNodeId={selectedNodeId}
      canEdit={canEdit}
      isCompactMode={isCompactMode}
      onHorizontalMove={onHorizontalMove}
    />
  )
}

// TOP位置のドロップゾーンコンポーネント（極細・透明表示）
function TopDropZone({ canEdit, onDrop }: TopDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'top-drop-zone',
    data: { 
      node: {
        id: 'top-drop-zone',
        name: 'TOP',
        isTopDropZone: true
      }
    },
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
      className={`w-full transition-all duration-200 mb-4 ${
        isOver 
          ? 'border-green-400 bg-green-50 border-2 border-dashed rounded' 
          : 'border-transparent border-2 border-dashed rounded'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{ 
        height: '20px',
        minHeight: '20px',
        maxHeight: '20px',
        opacity: isOver ? 1 : 0 // 通常時は完全に透明
      }}
      title="TOP位置にドロップ（1階層目に並列表示）"
    >
      {isOver && (
        <div className="flex items-center justify-center h-full text-sm text-green-600 font-medium">
          ここにドロップ（1階層目に並列表示）
        </div>
      )}
    </div>
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
      className={`absolute top-1/2 right-0 w-10 h-20 -translate-y-1/2 transition-all duration-200 ${
        isOver 
          ? 'bg-blue-400 opacity-90 border-2 border-blue-500' 
          : 'bg-transparent hover:bg-blue-300 hover:opacity-70'
      }`}
      style={{ 
        right: "-20px",
        borderRadius: "8px"
      }}
      title={`右へ移動: 位置 ${targetIndex + 1}`}
    >
      {isOver && (
        <div className="flex items-center justify-center h-full text-white text-xs font-bold">
          →
        </div>
      )}
    </div>
  )
}

// 左へ移動用のドロップゾーンコンポーネント
function LeftMoveDropZone({ parentId, targetIndex, canEdit, onDrop }: HorizontalDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `left-move-${parentId}-${targetIndex}`,
    data: { 
      type: 'left-move',
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
      className={`absolute top-1/2 left-0 w-10 h-20 -translate-y-1/2 transition-all duration-200 ${
        isOver 
          ? 'bg-purple-400 opacity-90 border-2 border-purple-500' 
          : 'bg-transparent hover:bg-purple-300 hover:opacity-70'
      }`}
      style={{ 
        left: "-20px",
        borderRadius: "8px"
      }}
      title={`左へ移動: 位置 ${targetIndex}`}
    >
      {isOver && (
        <div className="flex items-center justify-center h-full text-white text-xs font-bold">
          ←
        </div>
      )}
    </div>
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
  const { currentUser } = useAuth()
  const hasChildren = node.children && node.children.length > 0
  
  // データベースまたはデフォルト値からラベルを取得
  const getInitialLabel = () => {
    // データベースに保存されたラベルがあればそれを使用、なければ役職を使用
    if (node.employee?.orgChartLabel) {
      return node.employee.orgChartLabel
    }
    // デフォルトは役職から引用（[]と""を削除）
    return node.position?.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '') || ''
  }
  
  const [departmentLabel, setDepartmentLabel] = useState(getInitialLabel())
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // 部門ラベル編集権限のチェック（総務・管理者のみ）
  const canEditDepartmentLabel = canEdit && (
    currentUser?.role === 'hr' || 
    currentUser?.role === 'admin'
  )
  
  // ラベル編集終了時にデータベースに保存
  const handleLabelBlur = async () => {
    setIsEditingLabel(false)
    if (node.employee?.id) {
      try {
        const response = await fetch(`/api/employees/${node.employee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...node.employee,
            orgChartLabel: departmentLabel
          }),
        })

        if (response.ok) {
          console.log(`ラベルを保存: ${node.id} -> ${departmentLabel}`)
        } else {
          const errorData = await response.text()
          console.error('ラベルの保存に失敗:', response.status, errorData)
          alert(`ラベルの保存に失敗しました: ${response.status}`)
        }
      } catch (error) {
        console.error('ラベルの保存に失敗:', error)
        alert(`ラベルの保存に失敗しました: ${error}`)
      }
    }
  }

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging: isDraggingThis,
  } = useDraggable({
    id: node.id,
    data: { node },
    disabled: !canEdit || isMenuOpen, // メニューが開いている時のみドラッグを無効化
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: { node },
    disabled: !canEdit,
  })

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex items-center gap-2">
        {isEditingLabel && canEditDepartmentLabel ? (
          <Input
            value={departmentLabel}
            onChange={(e) => setDepartmentLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLabelBlur()
              }
            }}
            className="h-7 text-sm w-48"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-md">
            <span className="text-sm font-medium text-slate-700">{departmentLabel}</span>
            {canEditDepartmentLabel && (
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
        onMouseLeave={() => {
          setIsHovered(false)
          setIsMenuOpen(false)
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const relativeY = e.clientY - rect.top
          const cardHeight = rect.height
          
          // カードの下半分（50%以下）でホバーメニューを表示
          if (relativeY > cardHeight * 0.5) {
            setIsMenuOpen(true)
          } else {
            setIsMenuOpen(false)
          }
        }}
      >
        <Card
          className={`relative z-0 ${isCompactMode ? 'w-32' : 'w-48'} border-slate-200 shadow-sm hover:shadow-md transition-all ${
            node.employee?.status === 'copy'
              ? (currentUser?.role === 'admin' || currentUser?.role === 'hr')
                ? "cursor-pointer opacity-50 bg-slate-50 border-slate-300"
                : "cursor-not-allowed opacity-50 bg-slate-50 border-slate-300"
              : canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
          } ${
            selectedNodeId === node.id ? "ring-2 ring-blue-500" : ""
          } ${
            isDraggingThis ? "opacity-50 bg-blue-50 border-blue-300" : ""
          }`}
          onClick={(e) => {
            // メニュー表示時はカードクリックを無効化
            if (isMenuOpen) {
              e.stopPropagation()
              e.preventDefault()
              return
            }
            // コピー社員の場合は総務・管理者のみクリック可能
            if (node.employee?.status === 'copy') {
              const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
              if (!isAdminOrHR) {
                e.stopPropagation()
                e.preventDefault()
                return
              }
            }
            // ドラッグ中でない場合のみクリックイベントを実行
            if (!isDraggingThis) {
              console.log('カードがクリックされました')
              if (onEmployeeClick && node) {
                onEmployeeClick(node)
              }
            }
          }}
          {...(canEdit && !isMenuOpen ? { ...listeners, ...attributes } : {})} // メニュー表示時はドラッグ属性を無効化
        >
          <CardContent className={`${isCompactMode ? 'p-1' : 'p-2'}`}>
            <div className="flex items-center gap-2">
              {canEdit && (
                <div className="flex-shrink-0">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <Avatar className={`${isCompactMode ? 'w-6 h-6' : 'w-8 h-8'} flex-shrink-0`}>
                <AvatarFallback 
                  employeeType={node.employee?.employeeType}
                  className={`text-blue-700 font-semibold whitespace-nowrap overflow-hidden ${
                    /^[a-zA-Z\s]+$/.test(node.name.slice(0, 3)) ? 'text-xs' : 'text-[10px]'
                  }`}
                >
                  {node.name.slice(0, 3)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <h3 className={`${isCompactMode ? 'text-xs' : 'text-sm'} font-semibold text-slate-900 truncate`}>
                  {node.name}
                </h3>
                {!isCompactMode && (
                  <>
                    {node.employeeNumber && (
                      <p className="text-xs text-slate-500 font-mono">{node.employeeNumber}</p>
                    )}
                    {node.employee?.employeeType && (
                      <p className="text-xs text-blue-600 font-medium">{node.employee.employeeType}</p>
                    )}
                    {node.organization && (
                      <p className="text-xs text-slate-600 truncate">{node.organization.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '')}</p>
                    )}
                    <p className="text-xs text-slate-600 truncate">{node.position.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '')}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>

          {isMenuOpen && !isDraggingThis && (
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-b-lg shadow-lg z-50 flex gap-1 p-1"
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
              onDragStart={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              {hasChildren && (
                <button
                  className="text-xs flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-1 flex items-center justify-center gap-1 transition-colors relative z-[60]"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    console.log('配下の表示ボタンがクリックされました')
                    if (onShowSubordinates && node) {
                      onShowSubordinates(node)
                    }
                  }}
                >
                  <Users className="w-3 h-3" />
                  配下の表示
                </button>
              )}
              <button
                className={`text-xs flex-1 border rounded px-2 py-1 flex items-center justify-center gap-1 transition-colors relative z-[60] ${
                  node.employee?.status === 'copy'
                    ? (currentUser?.role === 'admin' || currentUser?.role === 'hr')
                      ? 'bg-slate-200 text-slate-600 border-slate-300 cursor-pointer hover:bg-slate-300'
                      : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300'
                }`}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  // コピー社員の場合は総務・管理者のみ社員情報表示可能
                  if (node.employee?.status === 'copy') {
                    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr'
                    if (!isAdminOrHR) {
                      return
                    }
                  }
                  console.log('社員情報表示ボタンがクリックされました')
                  if (onEmployeeClick && node) {
                    onEmployeeClick(node)
                  }
                }}
                disabled={node.employee?.status === 'copy' && (currentUser?.role !== 'admin' && currentUser?.role !== 'hr')}
              >
                社員情報表示
              </button>
            </div>
          )}
        </Card>
      </div>

      {hasChildren && (
        <>
          <div className="w-0.5 h-8 my-2" style={{ backgroundColor: '#bbbfc1' }} />
          <div className="flex gap-8 relative">
            {node.children!.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ top: "-8px", backgroundColor: '#bbbfc1' }} />
            )}
            {node.children!.map((child, index) => (
              <div key={`child-${child.id}-${index}`} className="relative">
                {node.children!.length > 1 && <div className="absolute w-0.5 h-8 left-1/2 -top-8" style={{ backgroundColor: '#bbbfc1' }} />}
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
                {/* 各社員の左側に「左へ移動」ドロップゾーンを配置（最初の要素以外） */}
                {canEdit && index > 0 && (
                  <LeftMoveDropZone
                    parentId={node.id}
                    targetIndex={index}
                    canEdit={canEdit}
                    onDrop={onHorizontalMove || (() => {})}
                  />
                )}
                {/* 各社員の右側に「右へ移動」ドロップゾーンを配置（最後の要素以外） */}
                {canEdit && index < node.children!.length - 1 && (
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
      className={`w-full bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all ${
        canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${
        isDraggingThis ? "opacity-50 z-50 bg-blue-50 border-blue-300" : ""
      } ${isSelected ? "bg-green-50 border-green-300 ring-2 ring-green-200" : ""}`}
      onClick={(e) => {
        // ドラッグ中でない場合のみクリックイベントを実行
        if (!isDraggingThis && onEmployeeClick) {
          onEmployeeClick({
            id: employee.id,
            name: employee.name,
            position: employee.position,
            department: employee.department,
            employeeNumber: employee.employeeNumber,
            organization: employee.organization,
            team: employee.team,
            employee: employee
          })
        }
      }}
      {...(canEdit ? { ...listeners, ...attributes } : {})}
    >
      <div className={`${isCompactMode ? 'p-1' : 'p-2'}`}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {canEdit && (
              <div className="flex-shrink-0">
                <GripVertical className="w-3 h-3 text-slate-400" />
              </div>
            )}
            <Avatar className={`${isCompactMode ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`}>
              <AvatarFallback className={`bg-slate-100 text-slate-700 font-semibold whitespace-nowrap overflow-hidden ${
                /^[a-zA-Z\s]+$/.test(employee.name.slice(0, 3)) ? 'text-xs' : 'text-[10px]'
              }`}>
                {employee.name.slice(0, 3)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <h3 className={`${isCompactMode ? 'text-xs' : 'text-sm'} font-semibold text-slate-900 truncate`}>
                {employee.name}
              </h3>
              {!isCompactMode && (
                <>
                  {employee.employeeType && (
                    <p className="text-xs text-blue-600 font-medium">{employee.employeeType}</p>
                  )}
                  <p className="text-xs text-slate-600 truncate">{employee.position}</p>
                </>
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
  const { currentUser } = useAuth()
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
  const [isMounted, setIsMounted] = useState(false)
  
  // 旧API削除のため、S3保存・復元機能を無効化
  
  const { toast } = useToast()

  // クライアントサイドでのマウント状態を設定
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 社員データを取得
  useEffect(() => {
    fetchEmployees()
  }, [currentUser]) // currentUserが変更された時も再実行

  // 外部から呼び出せるメソッドを定義
  useImperativeHandle(ref, () => ({
    refresh: () => {
      console.log('組織図: 外部からrefreshが呼び出されました')
      fetchEmployees()
    }
  }))

  const fetchEmployees = useCallback(async () => {
    try {
      console.log('組織図: 社員データを取得中...')
      console.log('組織図: 現在のユーザー情報:', currentUser)
      console.log('組織図: 現在のユーザーロール:', currentUser?.role)
      console.log('組織図: 管理者権限チェック:', currentUser?.role === 'admin')
      console.log('組織図: 現在のユーザーID:', currentUser?.id)
      console.log('組織図: 現在のユーザー名:', currentUser?.name)
      const response = await fetch('/api/employees')
      const data = await response.json()
      console.log('組織図: 取得した社員データ:', data.length, '件')
      
      // 社員データの詳細を確認
      const adminEmployees = data.filter((emp: Employee) => emp.role === 'admin')
      console.log('組織図: 管理者権限の社員:', adminEmployees.map((emp: Employee) => ({ id: emp.id, name: emp.name, role: emp.role })))
      
      const copyEmployeesData = data.filter((emp: Employee) => emp.status === 'copy')
      console.log('組織図: コピー社員:', copyEmployeesData.map((emp: Employee) => ({ id: emp.id, name: emp.name, status: emp.status, parentEmployeeId: emp.parentEmployeeId })))
      
      // コピー社員のparentEmployeeIdの詳細を確認
      copyEmployeesData.forEach((emp: Employee) => {
        console.log(`コピー社員 ${emp.name} の詳細:`, {
          id: emp.id,
          parentEmployeeId: emp.parentEmployeeId,
          showInOrgChart: emp.showInOrgChart,
          isInvisibleTop: emp.isInvisibleTop,
          isSuspended: emp.isSuspended
        })
        
        // コピー社員の親社員を確認
        if (emp.parentEmployeeId) {
          const parentEmployee = data.find((p: Employee) => p.id === emp.parentEmployeeId)
          console.log(`コピー社員 ${emp.name} の親社員:`, {
            parentId: emp.parentEmployeeId,
            parentName: parentEmployee?.name || '見つからない',
            parentRole: parentEmployee?.role || '不明',
            parentStatus: parentEmployee?.status || '不明',
            parentShowInOrgChart: parentEmployee?.showInOrgChart || false
          })
          
          // 親社員が見つからない場合の詳細ログ
          if (!parentEmployee) {
            console.log(`⚠️ コピー社員 ${emp.name} の親社員が見つかりません:`, {
              parentId: emp.parentEmployeeId,
              allEmployeeIds: data.map((e: Employee) => e.id),
              parentExists: data.some((e: Employee) => e.id === emp.parentEmployeeId)
            })
          }
        } else {
          console.log(`コピー社員 ${emp.name} の親社員: なし (parentEmployeeId: null)`)
        }
      })
      
      setEmployees(data)
      
      // showInOrgChartがfalseの社員を未配置社員として設定（見えないTOP社員は除外）
      // ステータスが「在籍中・休職中・コピー」のみを表示（それ以外は完全に非表示）
      // ※ コピー社員は「未配置 = showInOrgChart が false」の場合のみ表示する（配置後は未配置に重複表示しない）
      const unassigned = data.filter((emp: Employee) => 
        !emp.showInOrgChart &&
        !emp.isInvisibleTop && 
        emp.employeeNumber !== '000' &&
        (emp.status === 'active' || emp.status === 'leave' || emp.status === 'copy')
      )
      console.log('未配置社員フィルタリング結果:', unassigned.length, '件')
      console.log('コピー社員の未配置:', unassigned.filter((emp: Employee) => emp.status === 'copy'))
      
      // コピー社員の未配置条件を詳しくチェック
      const copyEmployeesUnassigned = data.filter((emp: Employee) => emp.status === 'copy')
      console.log('組織図: 全コピー社員数:', copyEmployeesUnassigned.length)
      copyEmployeesUnassigned.forEach((emp: Employee) => {
        console.log(`コピー社員 ${emp.name} の未配置条件:`, {
          showInOrgChart: emp.showInOrgChart,
          isInvisibleTop: emp.isInvisibleTop,
          employeeNumber: emp.employeeNumber,
          isAdmin: currentUser?.role === 'admin',
          parentEmployeeId: emp.parentEmployeeId,
          shouldBeUnassigned: (!emp.showInOrgChart || emp.status === 'copy') && 
                             !emp.isInvisibleTop && 
                             emp.employeeNumber !== '000' &&
                             (emp.status === 'active' || emp.status === 'leave' || emp.status === 'copy') // 在籍中・休職中・コピー社員のみ
        })
      })
      
      // 現在のユーザーと一致する社員データを確認
      const currentUserEmployee = data.find((emp: Employee) => emp.id === currentUser?.id)
      if (currentUserEmployee) {
        console.log('組織図: 現在のユーザーと一致する社員データ:', {
          id: currentUserEmployee.id,
          name: currentUserEmployee.name,
          role: currentUserEmployee.role,
          status: currentUserEmployee.status,
          showInOrgChart: currentUserEmployee.showInOrgChart
        })
      } else {
        console.log('組織図: 現在のユーザーと一致する社員データが見つかりません')
      }
      setUnassignedEmployees(unassigned)
      
      // 組織図を構築
      const orgTree = buildOrgChartFromEmployees(data)
      console.log('構築された組織図:', orgTree)
      console.log('組織図のルートノード数:', orgTree.children?.length || 0)
      console.log('組織図のルートノード:', orgTree.children?.map(child => ({ name: child.name, status: child.employee?.status })) || [])
      setDisplayedTree(orgTree)
      
      setLoading(false)
    } catch (error) {
      console.error('社員データの取得に失敗しました:', error)
      setLoading(false)
    }
  }, [currentUser])


  // 旧API削除のため、S3自動保存機能を無効化

  // 社員データから組織図を構築
  const buildOrgChartFromEmployees = (employees: Employee[]): OrgNode => {
  // 見えないTOP社員は除外するが、その子ノードは表示する
  // ステータスが「在籍中・休職中・コピー」のみを組織図に表示（それ以外は完全に非表示）
  const showInChartEmployees = employees.filter(emp =>
    emp.showInOrgChart &&
    (emp.status === 'active' || emp.status === 'leave' || emp.status === 'copy') && // 在籍中・休職中・コピー社員のみ
    !emp.isSuspended &&
    !emp.isInvisibleTop &&
    emp.employeeNumber !== '000'
  )
    
    // デバッグログを追加
    console.log('組織図構築 - 全社員数:', employees.length)
    console.log('組織図構築 - 表示対象社員数:', showInChartEmployees.length)
    console.log('店長の社員:', employees.filter(emp => emp.role === 'store_manager'))
    console.log('コピー社員:', employees.filter(emp => emp.status === 'copy'))
    console.log('現在のユーザーロール:', currentUser?.role)
    console.log('表示対象のコピー社員:', showInChartEmployees.filter(emp => emp.status === 'copy'))
    
    // showInChartEmployeesの詳細を確認
    console.log('🔍 showInChartEmployeesの詳細:', showInChartEmployees.map(emp => ({
      id: emp.id,
      name: emp.name,
      status: emp.status,
      parentEmployeeId: emp.parentEmployeeId,
      showInOrgChart: emp.showInOrgChart,
      isSuspended: emp.isSuspended,
      isInvisibleTop: emp.isInvisibleTop,
      employeeNumber: emp.employeeNumber
    })))
    
    // コピー社員の詳細な表示条件をチェック
    const copyEmployees = employees.filter(emp => emp.status === 'copy')
    console.log('組織図構築: 全コピー社員数:', copyEmployees.length)
    copyEmployees.forEach(emp => {
      console.log(`コピー社員 ${emp.name} の表示条件:`, {
        showInOrgChart: emp.showInOrgChart,
        status: emp.status,
        isAdmin: currentUser?.role === 'admin',
        isSuspended: emp.isSuspended,
        isInvisibleTop: emp.isInvisibleTop,
        employeeNumber: emp.employeeNumber,
        parentEmployeeId: emp.parentEmployeeId,
        shouldShow: emp.showInOrgChart && 
                   (emp.status === 'active' || emp.status === 'leave' || emp.status === 'copy') && // 在籍中・休職中・コピー社員のみ
                   !emp.isSuspended &&
                   !emp.isInvisibleTop &&
                   emp.employeeNumber !== '000'
      })
      
      // コピー社員のparentEmployeeIdの詳細を確認
      if (emp.parentEmployeeId) {
        const parentEmployee = employees.find(p => p.id === emp.parentEmployeeId)
        console.log(`コピー社員 ${emp.name} の親社員:`, {
          parentId: emp.parentEmployeeId,
          parentName: parentEmployee?.name || '見つからない',
          parentRole: parentEmployee?.role || '不明',
          parentStatus: parentEmployee?.status || '不明'
        })
      } else {
        console.log(`コピー社員 ${emp.name} の親社員: なし (parentEmployeeId: null)`)
      }
    })
    
    // 現在のユーザーと一致する社員データを確認
    const currentUserEmployee = employees.find(emp => emp.id === currentUser?.id)
    if (currentUserEmployee) {
      console.log('組織図構築: 現在のユーザーと一致する社員データ:', {
        id: currentUserEmployee.id,
        name: currentUserEmployee.name,
        role: currentUserEmployee.role,
        status: currentUserEmployee.status,
        showInOrgChart: currentUserEmployee.showInOrgChart,
        shouldShow: currentUserEmployee.showInOrgChart && 
                   (currentUserEmployee.status === 'active' || currentUserEmployee.status === 'leave' || currentUserEmployee.status === 'copy') && // 在籍中・休職中・コピー社員のみ
                   !currentUserEmployee.isSuspended &&
                   !currentUserEmployee.isInvisibleTop &&
                   currentUserEmployee.employeeNumber !== '000'
      })
    } else {
      console.log('組織図構築: 現在のユーザーと一致する社員データが見つかりません')
    }
    
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
    const buildHierarchy = (displayEmployees: Employee[], allEmployees: Employee[]): OrgNode[] => {
      console.log('🔍 buildHierarchy関数開始:', {
        displayEmployeesCount: displayEmployees.length,
        allEmployeesCount: allEmployees.length,
        copyEmployeesInDisplay: displayEmployees.filter(emp => emp.status === 'copy').map(emp => ({ id: emp.id, name: emp.name, parentEmployeeId: emp.parentEmployeeId }))
      })
      
      // 全社員のマップを作成（見えないTOP社員も含む）
      const allEmployeeMap = new Map<string, Employee>()
      allEmployees.forEach(emp => allEmployeeMap.set(emp.id, emp))
      
      const nodeMap = new Map<string, OrgNode>()
      
      // 表示対象社員のノードを作成
      displayEmployees.forEach(emp => {
        // コピー社員の場合は、parentEmployeeIdを明示的に保持
        const employeeData = emp.status === 'copy' 
          ? { ...emp, parentEmployeeId: emp.parentEmployeeId }
          : emp
        
        const node: OrgNode = {
          id: emp.id,
          name: emp.name,
          position: emp.position,
          department: emp.department,
          employeeNumber: emp.employeeNumber,
          organization: emp.organization,
          team: emp.team,
          description: emp.description,
          employee: employeeData,
          children: []
        }
        nodeMap.set(emp.id, node)
        
        // コピー社員の場合は特別なログを追加
        if (emp.status === 'copy') {
          console.log(`🔍 ノード作成: コピー社員 ${emp.name}`, {
            id: emp.id,
            parentEmployeeId: emp.parentEmployeeId,
            nodeEmployeeParentId: node.employee?.parentEmployeeId
          })
        }
      })

      // 親子関係を設定
      const rootNodes: OrgNode[] = []
      
      displayEmployees.forEach(emp => {
        const node = nodeMap.get(emp.id)!
        console.log(`社員処理: ${emp.name} (${emp.role}), status: ${emp.status}, parentEmployeeId: ${emp.parentEmployeeId}`)
        
        // コピー社員の場合は特別なログを追加
        console.log(`🔍 社員ステータス詳細チェック: ${emp.name}`, {
          status: emp.status,
          statusType: typeof emp.status,
          isCopy: emp.status === 'copy',
          strictComparison: emp.status === 'copy',
          statusLength: emp.status?.length,
          statusCharCodes: emp.status?.split('').map(c => c.charCodeAt(0))
        })
        
        if (emp.status === 'copy') {
          console.log(`🔍 コピー社員処理開始: ${emp.name}, parentEmployeeId: ${emp.parentEmployeeId}`)
          console.log(`🔍 ノード作成時のemployeeデータ:`, node.employee?.parentEmployeeId)
        }
        
        // 親をチェック（見えないTOP社員も含む）
        let parentNode: OrgNode | null = null
        if (emp.parentEmployeeId) {
          // 親が表示対象社員の場合は親の子として追加
          if (nodeMap.has(emp.parentEmployeeId)) {
            parentNode = nodeMap.get(emp.parentEmployeeId)!
            console.log(`  → 親が見つかりました: ${emp.name} → ${parentNode.name}`)
            if (emp.status === 'copy') {
              console.log(`🔍 コピー社員: 親が表示対象社員として見つかりました`)
            }
          } else {
            // 親が見えないTOP社員または表示対象外の場合は、全社員から親を探す
            const parentEmployee = allEmployeeMap.get(emp.parentEmployeeId)
            if (parentEmployee) {
              console.log(`  → 親が見つかりましたが表示対象外: ${emp.name} → ${parentEmployee.name} (${parentEmployee.role})`)
              // 親が見つかったが表示対象外の場合、この社員をルートノードとして追加
              // ただし、コピー社員の場合は親の情報を保持
              if (emp.status === 'copy') {
                console.log(`🔍 コピー社員: 親が見つかりましたが表示対象外 - ルートノードとして追加`)
                console.log(`🔍 コピー社員: 更新前のnode.employee.parentEmployeeId:`, node.employee?.parentEmployeeId)
                // コピー社員の場合は、親の情報を保持したままルートノードとして追加
                node.employee = { ...emp, parentEmployeeId: emp.parentEmployeeId }
                console.log(`🔍 コピー社員: 更新後のnode.employee.parentEmployeeId:`, node.employee.parentEmployeeId)
              }
              rootNodes.push(node)
              return
            } else {
              console.log(`  → 親が見つかりません: ${emp.name}, parentEmployeeId: ${emp.parentEmployeeId}`)
              // 親が見つからない場合、この社員をルートノードとして追加
              // コピー社員の場合は親の情報を保持
              if (emp.status === 'copy') {
                console.log(`🔍 コピー社員: 親が見つかりません - ルートノードとして追加`)
                console.log(`🔍 コピー社員: 更新前のnode.employee.parentEmployeeId:`, node.employee?.parentEmployeeId)
                node.employee = { ...emp, parentEmployeeId: emp.parentEmployeeId }
                console.log(`🔍 コピー社員: 更新後のnode.employee.parentEmployeeId:`, node.employee.parentEmployeeId)
              }
              rootNodes.push(node)
              return
            }
          }
        }
        
        if (parentNode) {
          // 親がいる場合、親の子として追加
          if (!parentNode.children) {
            parentNode.children = []
          }
          parentNode.children.push(node)
          console.log(`  → 親の子として追加: ${emp.name} → ${parentNode.name}`)
          
          // コピー社員の場合は親の情報を保持
          if (emp.status === 'copy') {
            console.log(`🔍 コピー社員: 親の子として追加完了 - parentEmployeeId保持`)
            node.employee = { ...emp, parentEmployeeId: emp.parentEmployeeId }
            console.log(`🔍 コピー社員: 最終的なnode.employee.parentEmployeeId:`, node.employee.parentEmployeeId)
          }
        } else {
          // 親がいない場合、ルートノードとして追加
          // コピー社員の場合は親の情報を保持
          if (emp.status === 'copy') {
            console.log(`🔍 コピー社員: 親がいない場合 - ルートノードとして追加`)
            console.log(`🔍 コピー社員: 更新前のnode.employee.parentEmployeeId:`, node.employee?.parentEmployeeId)
            node.employee = { ...emp, parentEmployeeId: emp.parentEmployeeId }
            console.log(`🔍 コピー社員: 更新後のnode.employee.parentEmployeeId:`, node.employee.parentEmployeeId)
          }
          rootNodes.push(node)
          console.log(`  → ルートノードとして追加: ${emp.name}`)
        }
      })
      
      console.log('ルートノード数:', rootNodes.length)
      console.log('ルートノード:', rootNodes.map(n => n.name))

      return rootNodes
    }

    console.log('🔍 buildHierarchy関数呼び出し前:', {
      showInChartEmployeesCount: showInChartEmployees.length,
      employeesCount: employees.length,
      copyEmployeesInShowInChart: showInChartEmployees.filter(emp => emp.status === 'copy').map(emp => ({ id: emp.id, name: emp.name, status: emp.status, parentEmployeeId: emp.parentEmployeeId }))
    })
    
    const hierarchy = buildHierarchy(showInChartEmployees, employees)
    
    console.log('🔍 buildHierarchy関数呼び出し後:', {
      hierarchyCount: hierarchy.length,
      hierarchyNames: hierarchy.map(h => ({ name: h.name, status: h.employee?.status, parentEmployeeId: h.employee?.parentEmployeeId }))
    })
    
    console.log('階層構築結果:', hierarchy.length, '個のルートノード')
    console.log('階層詳細:', hierarchy.map(h => ({ name: h.name, role: h.employee?.role, status: h.employee?.status })))
    
    // コピー社員の階層構築結果を詳しくチェック
    const copyNodes = hierarchy.filter(h => h.employee?.status === 'copy')
    console.log('階層構築後のコピー社員ノード数:', copyNodes.length)
    copyNodes.forEach(node => {
      console.log(`🔍 最終確認 - コピー社員ノード ${node.name}:`, {
        id: node.id,
        parentEmployeeId: node.employee?.parentEmployeeId,
        hasChildren: !!node.children,
        childrenCount: node.children?.length || 0,
        employeeStatus: node.employee?.status,
        employeeParentId: node.employee?.parentEmployeeId
      })
      console.log(`🔍 最終確認 - node.employee全体:`, node.employee)
    })
    
    // 現在のユーザーと一致するノードを確認
    const currentUserNode = hierarchy.find(h => h.employee?.id === currentUser?.id)
    if (currentUserNode) {
      console.log('階層構築後の現在のユーザーノード:', {
        id: currentUserNode.id,
        name: currentUserNode.name,
        role: currentUserNode.employee?.role,
        status: currentUserNode.employee?.status,
        hasChildren: !!currentUserNode.children,
        childrenCount: currentUserNode.children?.length || 0
      })
    } else {
      console.log('階層構築後の現在のユーザーノードが見つかりません')
    }
    
    if (hierarchy.length === 0) {
      console.log('組織図に表示する社員がいません')
      return {
        id: 'empty',
        name: '組織図に表示する社員がいません',
        position: '',
        department: '',
        children: []
      }
    }

    // 複数のルートがある場合は、横並びで表示するための仮想ルートを作成
    if (hierarchy.length > 1) {
      console.log('複数のルートノードを横並びで表示:', hierarchy.map(h => h.name))
      
      // 仮想ルートノードを作成（表示されない）
      const virtualRoot: OrgNode = {
        id: 'virtual-root',
        name: '組織図',
        position: '',
        department: '',
        children: hierarchy
      }
      
      return virtualRoot
    }

    // 単一のルートノードの場合はそのまま返す
    return hierarchy[0]
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

    // 左へ移動のドロップゾーンへのドロップの場合
    if (typeof over.id === 'string' && over.id.startsWith('left-move-')) {
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

  // 社員をTOP位置に移動（見えないTOPの子として）
  const moveEmployeeToTop = async (node: OrgNode) => {
    if (!node.employee) {
      console.error('Node employee not found:', node)
      return
    }

    try {
      // 見えないTOPのIDを動的に取得
      const response = await fetch('/api/employees')
      const employees = await response.json()
      const invisibleTopEmployee = employees.find((emp: any) => 
        emp.isInvisibleTop || emp.employeeNumber === '000' || emp.name === '見えないTOP'
      )
      
      if (!invisibleTopEmployee) {
        console.error('見えないTOP社員が見つかりません')
        alert('見えないTOP社員が見つかりません')
        return
      }
      
      const invisibleTopId = invisibleTopEmployee.id
      
      const updateData = {
        ...node.employee,
        parentEmployeeId: invisibleTopId
      }
      
      console.log('Moving employee to top:', {
        employeeId: node.employee.id,
        employeeName: node.employee.name,
        updateData
      })

      const updateResponse = await fetch(`/api/employees/${node.employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (updateResponse.ok) {
        // 社員データを更新（遅延実行で重複を避ける）
        setTimeout(() => fetchEmployees(), 100)
        console.log(`社員 ${node.name} をTOP位置に移動しました`)
        alert(`社員 ${node.name} をTOP位置に移動しました`)
      } else {
        const errorData = await updateResponse.text()
        console.error('Failed to move employee to top:', updateResponse.status, errorData)
        alert(`社員の移動に失敗しました: ${updateResponse.status}`)
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
        // 社員データを更新（遅延実行で重複を避ける）
        setTimeout(() => fetchEmployees(), 100)
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
      
      // コピー社員の場合は、親の情報を正しく設定
      if (employee.status === 'copy') {
        console.log(`コピー社員 ${employee.name} を ${targetEmployee.name} の配下に移動`)
        console.log(`更新前のparentEmployeeId: ${employee.parentEmployeeId}`)
        console.log(`更新後のparentEmployeeId: ${targetEmployee.id}`)
        console.log(`コピー社員の親社員情報:`, {
          targetId: targetEmployee.id,
          targetName: targetEmployee.name,
          targetRole: targetEmployee.role,
          targetStatus: targetEmployee.status
        })
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
        // 社員データを更新（遅延実行で重複を避ける）
        setTimeout(() => fetchEmployees(), 100)
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
        // データを再取得して最新状態に更新（遅延実行で重複を避ける）
        setTimeout(() => fetchEmployees(), 100)
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
  
  // displayedTreeの状態を監視（デバッグログを削除）

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="rounded-xl border border-slate-200 shadow-sm" style={{ backgroundColor: '#b4d5e7' }}>
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
            
            {/* 旧API削除のため、S3復元機能UIを非表示 */}
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

        <div className="p-8 overflow-auto max-h-[calc(100vh-300px)]">
          {!isMounted ? (
            <div className="text-center py-8">
              <div className="text-slate-500">読み込み中...</div>
            </div>
          ) : (
            <div key="org-chart-content" className="flex gap-4">
              {/* 未配置社員エリア */}
              {showUnassignedArea && (
                <div className="flex-shrink-0">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-w-[200px]">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">未配置社員</h4>
                    <UnassignedDropZone>
                      {unassignedEmployees.map((emp, index) => (
                        <UnassignedEmployeeCard
                          key={`unassigned-${emp.id}-${index}`}
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
                key="main-org-chart-area"
                className="min-w-max flex flex-col items-center justify-center transition-transform flex-1"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
              >
              {superiorsToDisplay.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-col items-center gap-2">
                    {superiorsToDisplay.map((superior, index) => (
                      <div key={`superior-${superior.id}-${index}`}>
                        <DraggableOrgNodeCard
                          node={superior}
                          onEmployeeClick={onEmployeeClick}
                          onShowSubordinates={handleShowSubordinates}
                          selectedNodeId={null}
                          canEdit={canEdit}
                          isCompactMode={isCompactMode}
                        />
                        {index < superiorsToDisplay.length - 1 && <div className="w-0.5 h-8 mx-auto my-2" style={{ backgroundColor: '#bbbfc1' }} />}
                      </div>
                    ))}
                    <div className="w-0.5 h-8 my-2" style={{ backgroundColor: '#bbbfc1' }} />
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
                        <div className="w-0.5 h-8 my-2" style={{ backgroundColor: '#bbbfc1' }} />
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
          )}
        </div>

        <div className="px-4 pb-4">
          {canEdit ? (
            <p className="text-xs text-slate-500 text-center">
              ※ 部署名をクリックして編集 /
              カードをドラッグして組織を変更 /
              <span className="text-purple-600 font-medium">左側の紫色エリア</span>で左へ移動、
              <span className="text-blue-600 font-medium">右側の青色エリア</span>で右へ移動 /
              カードにカーソルを乗せて操作メニューを表示
            </p>
          ) : (
            <p className="text-xs text-slate-500 text-center">
              ※ 閲覧モード：組織図の編集にはマネージャー権限以上が必要です
            </p>
          )}
        </div>
      </div>

      {isMounted && (
        <DragOverlay>
          {activeNode ? (
            <Card className={`${isCompactMode ? 'w-32' : 'w-48'} border-slate-200 shadow-lg opacity-90`}>
              <CardContent className={`${isCompactMode ? 'p-1' : 'p-2'}`}>
                <div className="flex items-center gap-2">
                  <Avatar className={`${isCompactMode ? 'w-6 h-6' : 'w-8 h-8'} flex-shrink-0`}>
                    <AvatarFallback 
                      employeeType={activeNode.employee?.employeeType}
                      className="text-blue-700 font-semibold text-xs"
                    >
                      {activeNode.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className={`${isCompactMode ? 'text-xs' : 'text-sm'} font-semibold text-slate-900 truncate`}>
                      {activeNode.name}
                    </h3>
                    {!isCompactMode && (
                      <p className="text-xs text-slate-600 truncate">{activeNode.position}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      )}
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
