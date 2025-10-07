"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X } from "lucide-react"
import { type UserRole, rolePermissions } from "@/lib/permissions"

interface PermissionMatrixProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleLabels: Record<UserRole, string> = {
  viewer: "閲覧",
  general: "一般",
  "sub_manager": "サブマネ",
  "store_manager": "店長",
  manager: "マネージャー",
  hr: "総務",
  admin: "管理者",
}

const permissionLabels: Record<string, string> = {
  viewDashboard: "ダッシュボード閲覧",
  viewDashboardStats: "統計情報閲覧",
  manageAnnouncements: "お知らせ管理",
  viewOwnProfile: "自分のプロフィール閲覧",
  editOwnProfile: "自分のプロフィール編集",
  viewSubordinateProfiles: "配下のプロフィール閲覧",
  editSubordinateProfiles: "配下のプロフィール編集",
  viewAllProfiles: "全プロフィール閲覧",
  editAllProfiles: "全プロフィール編集",
  viewMyNumber: "マイナンバー閲覧",
  suspendUsers: "ユーザー停止",
  viewOrgChart: "組織図閲覧",
  editOrgChart: "組織図編集",
  moveEmployeeCards: "社員カード移動",
  viewOwnTasks: "自分のタスク閲覧",
  editOwnTasks: "自分のタスク編集",
  createTaskBoards: "タスクボード作成",
  manageSubordinateTasks: "配下のタスク管理",
  viewOwnAttendance: "自分の勤怠閲覧",
  viewSubordinateAttendance: "配下の勤怠閲覧",
  editAttendance: "勤怠編集",
  viewLeaveManagement: "有給管理閲覧",
  editLeaveManagement: "有給管理編集",
  viewOwnPayroll: "自分の給与閲覧",
  viewAllPayroll: "全給与閲覧",
  editPayroll: "給与編集",
  uploadPayroll: "給与アップロード",
  deletePayroll: "給与削除",
  uploadFiles: "ファイルアップロード",
  deleteOwnFiles: "自分のファイル削除",
  deleteAllFiles: "全ファイル削除",
  viewLogs: "ログ閲覧",
  viewOwnEvaluations: "自分の評価閲覧",
  viewSubordinateEvaluations: "配下の評価閲覧",
  editEvaluations: "評価編集",
}

export function PermissionMatrix({ open, onOpenChange }: PermissionMatrixProps) {
  const roles: UserRole[] = ["viewer", "general", "sub_manager", "store_manager", "manager", "hr", "admin"]
  const permissions = Object.keys(permissionLabels)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>権限一覧表</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] sticky left-0 bg-white z-10">機能</TableHead>
                {roles.map((role) => (
                  <TableHead key={role} className="text-center min-w-[100px]">
                    {roleLabels[role]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission}>
                  <TableCell className="font-medium sticky left-0 bg-white z-10">
                    {permissionLabels[permission]}
                  </TableCell>
                  {roles.map((role) => {
                    const hasPermission = rolePermissions[role][permission as keyof typeof rolePermissions.admin]
                    return (
                      <TableCell key={`${role}-${permission}`} className="text-center">
                        {hasPermission ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-slate-300 mx-auto" />
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
