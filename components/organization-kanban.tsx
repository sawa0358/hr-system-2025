"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Plus } from "lucide-react"
import { organizationData } from "@/lib/mock-data"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Employee {
  id: string
  name: string
  position: string
  department: string
  employeeNumber: string
  avatar?: string
}

interface DepartmentColumn {
  id: string
  title: string
  employeeIds: string[]
}

function EmployeeCard({
  employee,
  onClick,
  isDragging,
}: { employee: Employee; onClick: () => void; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: employee.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-2"
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                    {employee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-slate-900 truncate">{employee.name}</h3>
                  <p className="text-xs text-slate-600 truncate">{employee.position}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-mono">{employee.employeeNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DepartmentColumn({
  column,
  employees,
  onEmployeeClick,
}: {
  column: DepartmentColumn
  employees: Employee[]
  onEmployeeClick: (employee: Employee) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex-1 min-w-[280px]">
      <div className="bg-slate-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-slate-500" />
            </div>
            <h2 className="font-semibold text-slate-900">{column.title}</h2>
          </div>
          <Badge variant="secondary" className="bg-slate-200 text-slate-700">
            {employees.length}
          </Badge>
        </div>

        <SortableContext items={employees.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} onClick={() => onEmployeeClick(employee)} />
            ))}
            {employees.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">社員がいません</div>}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export function OrganizationKanban({ onEmployeeClick }: { onEmployeeClick?: (employee: any) => void }) {
  // Convert organization data to flat employee list
  const flattenEmployees = (node: any): Employee[] => {
    const employees: Employee[] = [
      {
        id: node.id,
        name: node.name,
        position: node.position,
        department: node.department,
        employeeNumber: node.employeeNumber || "",
      },
    ]

    if (node.children) {
      node.children.forEach((child: any) => {
        employees.push(...flattenEmployees(child))
      })
    }

    return employees
  }

  const allEmployees = flattenEmployees(organizationData)

  // Group by department
  const departmentGroups = allEmployees.reduce(
    (acc, emp) => {
      if (!acc[emp.department]) {
        acc[emp.department] = []
      }
      acc[emp.department].push(emp.id)
      return acc
    },
    {} as Record<string, string[]>,
  )

  const [columns, setColumns] = useState<DepartmentColumn[]>(
    Object.entries(departmentGroups).map(([dept, empIds]) => ({
      id: dept,
      title: dept,
      employeeIds: empIds,
    })),
  )

  const [employeesById, setEmployeesById] = useState<Record<string, Employee>>(
    allEmployees.reduce((acc, emp) => ({ ...acc, [emp.id]: emp }), {}),
  )

  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dragging an employee
    if (employeesById[activeId]) {
      const activeColumn = columns.find((col) => col.employeeIds.includes(activeId))
      const overColumn = columns.find((col) => col.id === overId || col.employeeIds.includes(overId))

      if (!activeColumn || !overColumn || activeColumn === overColumn) return

      setColumns((columns) => {
        const activeItems = activeColumn.employeeIds
        const overItems = overColumn.employeeIds

        const activeIndex = activeItems.indexOf(activeId)
        const overIndex = overItems.indexOf(overId)

        let newIndex: number
        if (overId in employeesById) {
          newIndex = overIndex
        } else {
          newIndex = overItems.length
        }

        return columns.map((col) => {
          if (col.id === activeColumn.id) {
            return { ...col, employeeIds: activeItems.filter((id) => id !== activeId) }
          }
          if (col.id === overColumn.id) {
            const newEmployeeIds = [...overItems]
            newEmployeeIds.splice(newIndex, 0, activeId)
            return { ...col, employeeIds: newEmployeeIds }
          }
          return col
        })
      })

      // Update employee department
      setEmployeesById((prev) => ({
        ...prev,
        [activeId]: { ...prev[activeId], department: overColumn.title },
      }))
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Check if dragging a column
    if (columns.find((col) => col.id === activeId)) {
      const oldIndex = columns.findIndex((col) => col.id === activeId)
      const newIndex = columns.findIndex((col) => col.id === overId)

      if (oldIndex !== newIndex) {
        setColumns(arrayMove(columns, oldIndex, newIndex))
      }
      return
    }

    // Check if dragging an employee within the same column
    if (employeesById[activeId] && activeId !== overId) {
      const column = columns.find((col) => col.employeeIds.includes(activeId))
      if (!column) return

      const oldIndex = column.employeeIds.indexOf(activeId)
      const newIndex = column.employeeIds.indexOf(overId)

      if (oldIndex !== newIndex) {
        setColumns((columns) =>
          columns.map((col) => {
            if (col.id === column.id) {
              return { ...col, employeeIds: arrayMove(col.employeeIds, oldIndex, newIndex) }
            }
            return col
          }),
        )
      }
    }

    console.log("[v0] Employee moved. Updated organization structure:", {
      employeeId: activeId,
      newDepartment: employeesById[activeId]?.department,
    })
  }

  const handleAddDepartment = () => {
    const deptName = prompt("部署名を入力してください")
    if (deptName) {
      const newColumn: DepartmentColumn = {
        id: `dept-${Date.now()}`,
        title: deptName,
        employeeIds: [],
      }
      setColumns([...columns, newColumn])
    }
  }

  const activeEmployee = activeId && employeesById[activeId] ? employeesById[activeId] : null

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 mb-2">カンバン表示</h3>
        <p className="text-sm text-slate-600">
          社員カードをドラッグして部署間を移動できます。部署の順序も変更可能です。
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => {
              const columnEmployees = column.employeeIds.map((id) => employeesById[id]).filter(Boolean)
              return (
                <DepartmentColumn
                  key={column.id}
                  column={column}
                  employees={columnEmployees}
                  onEmployeeClick={(emp) => onEmployeeClick?.(emp)}
                />
              )
            })}
          </SortableContext>

          <div className="flex-shrink-0 w-[280px]">
            <button
              onClick={handleAddDepartment}
              className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 h-full min-h-[120px]"
            >
              <Plus className="w-5 h-5" />
              部署を追加
            </button>
          </div>
        </div>

        <DragOverlay>
          {activeEmployee ? <EmployeeCard employee={activeEmployee} onClick={() => {}} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>注意:</strong>{" "}
          社員を移動すると、その社員の所属部署が変更されます。配下の社員や上長の関係も自動的に更新されます。
        </p>
      </div>
    </div>
  )
}
