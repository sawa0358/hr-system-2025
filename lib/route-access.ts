import { type Permission, getPermissions } from "@/lib/permissions"

export interface RouteAccessRule {
  /** マッチするパスプレフィックス（startsWithで比較） */
  path: string
  /** 必要なパーミッションキー */
  permission?: keyof Permission
  /** 外部ワーカー（業務委託/外注先）にアクセスを許可するか */
  allowExternalWorkers?: boolean
  /** 許可する雇用形態リスト（指定時のみチェック） */
  allowedEmployeeTypes?: string[]
  /** 複雑なルール用のカスタムチェック関数（pathnameも参照可能） */
  customCheck?: (user: any, permissions: Permission, pathname: string) => boolean
}

// 具体的なパスを先に定義（startsWith マッチのため順序が重要）
export const routeAccessRules: RouteAccessRule[] = [
  // 外部ワーカー許可ルート
  { path: "/tasks", permission: "viewOwnTasks", allowExternalWorkers: true },
  {
    path: "/workclock",
    allowExternalWorkers: true,
    customCheck: (user) => {
      const role = user.role || "viewer"
      const employeeType = user.employeeType?.trim() || ""
      const isExternalWorker =
        employeeType.includes("業務委託") || employeeType.includes("外注先")
      // 業務委託・外注先は自分の勤務時間管理のためアクセス可
      if (isExternalWorker) return true
      // 正社員・契約社員は店長・マネージャー・総務・管理者のみアクセス可
      const managerRoles = ["store_manager", "manager", "hr", "admin"]
      return managerRoles.includes(role)
    },
  },

  // 管理者専用
  { path: "/logs", permission: "viewLogs" },

  // 有給管理 - 管理者サブページ（親ルールより先に定義）
  { path: "/leave/settings", permission: "editLeaveManagement" },
  {
    path: "/leave/admin",
    customCheck: (user) => {
      const role = user.role || "viewer"
      return ["store_manager", "manager", "hr", "admin"].includes(role)
    },
    allowedEmployeeTypes: ["正社員", "契約社員", "パートタイム", "派遣社員"],
  },

  // 有給管理 - 雇用形態制限あり
  {
    path: "/leave",
    permission: "viewLeaveManagement",
    allowedEmployeeTypes: ["正社員", "契約社員", "パートタイム", "派遣社員"],
  },

  // 人事考課 - 管理・設定ページ（親ルールより先に定義）
  { path: "/evaluations/settings", permission: "editEvaluations" },
  { path: "/evaluations/admin", permission: "editEvaluations" },

  // 人事考課 - エントリーページ（ロール別アクセス制御）
  {
    path: "/evaluations/entry",
    customCheck: (user, perms, pathname) => {
      const role = user.role || "viewer"
      // manager/hr/admin は全エントリーにアクセス可
      if (["manager", "hr", "admin"].includes(role)) return true
      // store_manager は自分 + チームメンバー（チーム検証はページレベルで実施）
      if (role === "store_manager") return true
      // 人事考課対象者（general/sub_manager等）は自分のエントリーのみ
      if (user.isPersonnelEvaluationTarget) {
        const segments = pathname.split("/")
        const entryUserId = segments[3] // ["", "evaluations", "entry", userId, date]
        return entryUserId === user.id
      }
      return false
    },
  },

  // 人事考課 - メインページ（store_manager以上）
  {
    path: "/evaluations",
    customCheck: (user) => {
      const role = user.role || "viewer"
      return ["store_manager", "manager", "hr", "admin"].includes(role)
    },
  },

  // 給与 - 設定ページ（親ルールより先に定義）
  { path: "/payroll/settings", permission: "editPayroll" },

  // 標準的な権限ベースルート
  { path: "/employees", permission: "viewOwnProfile" },
  { path: "/attendance", permission: "viewOwnAttendance" },
  { path: "/payroll", permission: "viewOwnPayroll" },
  { path: "/organization", permission: "viewOrgChart" },
  { path: "/convenience", permission: "viewConvenience" },

  // ダッシュボード（ルート）
  { path: "/", permission: "viewDashboard" },
]

/**
 * ユーザーが指定パスにアクセスできるかチェックする
 */
export function checkRouteAccess(
  pathname: string,
  user: any | null,
  permissions: Permission
): { allowed: boolean; redirectTo?: string } {
  // 未認証はLoginModalに任せる
  if (!user) {
    return { allowed: true }
  }

  const employeeType = user.employeeType?.trim() || ""
  const isExternalWorker =
    employeeType.includes("業務委託") || employeeType.includes("外注先")

  // マッチするルールを検索（先頭一致、"/" はパス完全一致）
  const rule = routeAccessRules.find((r) => {
    if (r.path === "/") {
      return pathname === "/"
    }
    return pathname === r.path || pathname.startsWith(r.path + "/")
  })

  // ルールなし（APIルート等）→ 通過
  if (!rule) {
    return { allowed: true }
  }

  const redirectTo = isExternalWorker ? "/tasks" : "/"

  // 外部ワーカーのブロック
  if (isExternalWorker && !rule.allowExternalWorkers) {
    return { allowed: false, redirectTo: "/tasks" }
  }

  // パーミッションチェック
  if (rule.permission && !permissions[rule.permission]) {
    return { allowed: false, redirectTo }
  }

  // 雇用形態チェック
  if (rule.allowedEmployeeTypes) {
    const isAllowed = rule.allowedEmployeeTypes.some(
      (allowed) => allowed.trim().toLowerCase() === employeeType.toLowerCase()
    )
    if (!isAllowed) {
      return { allowed: false, redirectTo }
    }
  }

  // カスタムチェック
  if (rule.customCheck && !rule.customCheck(user, permissions, pathname)) {
    return { allowed: false, redirectTo }
  }

  return { allowed: true }
}
