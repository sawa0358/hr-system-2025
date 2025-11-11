// Permission types and utilities
export type UserRole = "viewer" | "general" | "sub_manager" | "store_manager" | "manager" | "hr" | "admin"

export interface Permission {
  // Dashboard
  viewDashboard: boolean
  viewDashboardStats: boolean
  manageAnnouncements: boolean
  viewConvenience: boolean
  manageConvenience: boolean

  // Employee Info
  viewOwnProfile: boolean
  editOwnProfile: boolean
  viewSubordinateProfiles: boolean
  editSubordinateProfiles: boolean
  viewAllProfiles: boolean
  editAllProfiles: boolean
  viewMyNumber: boolean
  suspendUsers: boolean

  // Organization
  viewOrgChart: boolean
  editOrgChart: boolean
  moveEmployeeCards: boolean

  // Tasks
  viewOwnTasks: boolean
  editOwnTasks: boolean
  createTaskBoards: boolean
  manageSubordinateTasks: boolean

  // Attendance
  viewOwnAttendance: boolean
  viewSubordinateAttendance: boolean
  editAttendance: boolean

  // Leave
  viewLeaveManagement: boolean
  editLeaveManagement: boolean

  // Payroll
  viewOwnPayroll: boolean
  viewAllPayroll: boolean
  editPayroll: boolean
  uploadPayroll: boolean
  deletePayroll: boolean

  // Files
  uploadFiles: boolean
  deleteOwnFiles: boolean
  deleteAllFiles: boolean

  // Logs
  viewLogs: boolean

  // Evaluations
  viewOwnEvaluations: boolean
  viewSubordinateEvaluations: boolean
  editEvaluations: boolean

  // Workspace & Tasks (Trello-style)
  createWorkspace: boolean
  editWorkspace: boolean
  deleteWorkspace: boolean
  addWorkspaceMembers: boolean
  viewAllWorkspaces: boolean
  createBoards: boolean
  editBoards: boolean
  deleteBoards: boolean
  createLists: boolean // リストの追加
  editLists: boolean // リストの編集
  deleteLists: boolean // リストの削除
  addCardMembers: boolean // 他人のカードにメンバー追加できるか
  editOthersCards: boolean // 他人のカードを編集できるか
  canManageTasks: boolean // タスク管理権限
  canManageWorkspaces: boolean // ワークスペース管理権限
}

export const rolePermissions: Record<UserRole, Permission> = {
  viewer: {
    viewDashboard: true,
    viewDashboardStats: false,
    manageAnnouncements: false,
    viewConvenience: true,
    manageConvenience: false,
    viewOwnProfile: true,
    editOwnProfile: false,
    viewSubordinateProfiles: true, // 全権限者が配下のプロフィール閲覧可能
    editSubordinateProfiles: false,
    viewAllProfiles: true, // 全権限者が全プロフィール閲覧可能
    editAllProfiles: false,
    viewMyNumber: false,
    suspendUsers: false,
    viewOrgChart: true,
    editOrgChart: false,
    moveEmployeeCards: false,
    viewOwnTasks: true,
    editOwnTasks: false,
    createTaskBoards: false,
    manageSubordinateTasks: false,
    viewOwnAttendance: true,
    viewSubordinateAttendance: false,
    editAttendance: false,
    viewLeaveManagement: true,
    editLeaveManagement: false,
    viewOwnPayroll: true,
    viewAllPayroll: false,
    editPayroll: false,
    uploadPayroll: false,
    deletePayroll: false,
    uploadFiles: false,
    deleteOwnFiles: false,
    deleteAllFiles: false,
    viewLogs: false,
    viewOwnEvaluations: true,
    viewSubordinateEvaluations: false,
    editEvaluations: false,
    createWorkspace: false,
    editWorkspace: false,
    deleteWorkspace: false,
    addWorkspaceMembers: false,
    viewAllWorkspaces: false,
    createBoards: false,
    editBoards: false,
    deleteBoards: false,
    createLists: true, // 一般権限でもリスト作成可能
    editLists: false,
    deleteLists: false,
    addCardMembers: false,
    editOthersCards: false,
    canManageTasks: false,
    canManageWorkspaces: false,
  },
  general: {
    viewDashboard: true,
    viewDashboardStats: false,
    manageAnnouncements: false,
    viewConvenience: true,
    manageConvenience: false,
    viewOwnProfile: true,
    editOwnProfile: false, // 総務・管理者以外は自分のプロフィール編集不可
    viewSubordinateProfiles: true, // 全権限者が配下のプロフィール閲覧可能
    editSubordinateProfiles: false,
    viewAllProfiles: true, // 全権限者が全プロフィール閲覧可能
    editAllProfiles: false,
    viewMyNumber: false,
    suspendUsers: false,
    viewOrgChart: true,
    editOrgChart: false,
    moveEmployeeCards: false,
    viewOwnTasks: true,
    editOwnTasks: true,
    createTaskBoards: false, // ボードの追加・編集ボタンは表示しない
    manageSubordinateTasks: false,
    viewOwnAttendance: true,
    viewSubordinateAttendance: false,
    editAttendance: false,
    viewLeaveManagement: true,
    editLeaveManagement: false,
    viewOwnPayroll: true,
    viewAllPayroll: false,
    editPayroll: false,
    uploadPayroll: true,
    deletePayroll: false,
    uploadFiles: true,
    deleteOwnFiles: false,
    deleteAllFiles: false,
    viewLogs: false,
    viewOwnEvaluations: true,
    viewSubordinateEvaluations: false,
    editEvaluations: false,
    createWorkspace: false, // ワークスペース新規作成は総務・管理者のみ
    editWorkspace: false, // ワークスペース編集は総務・管理者のみ
    deleteWorkspace: false,
    addWorkspaceMembers: false,
    viewAllWorkspaces: false,
    createBoards: false, // マイワークスペース内のみ可能（別途チェック）
    editBoards: false, // マイワークスペース内のみ可能（別途チェック）
    deleteBoards: false,
    createLists: true, // 一般権限でもリスト作成可能
    editLists: false,
    deleteLists: false,
    addCardMembers: false, // カード新規作成時のみメンバー追加可
    editOthersCards: false,
    canManageTasks: false,
    canManageWorkspaces: false,
  },
  "sub_manager": {
    viewDashboard: true,
    viewDashboardStats: false,
    manageAnnouncements: true,
    viewConvenience: true,
    manageConvenience: true,
    viewOwnProfile: true,
    editOwnProfile: false, // 総務・管理者以外は自分のプロフィール編集不可
    viewSubordinateProfiles: true, // 全権限者が配下のプロフィール閲覧可能
    editSubordinateProfiles: false,
    viewAllProfiles: true, // 全権限者が全プロフィール閲覧可能
    editAllProfiles: false,
    viewMyNumber: false,
    suspendUsers: false,
    viewOrgChart: true,
    editOrgChart: false,
    moveEmployeeCards: false,
    viewOwnTasks: true,
    editOwnTasks: true,
    createTaskBoards: true,
    manageSubordinateTasks: false,
    viewOwnAttendance: true,
    viewSubordinateAttendance: false,
    editAttendance: false,
    viewLeaveManagement: true,
    editLeaveManagement: false,
    viewOwnPayroll: true,
    viewAllPayroll: false,
    editPayroll: false,
    uploadPayroll: true,
    deletePayroll: false,
    uploadFiles: true,
    deleteOwnFiles: false,
    deleteAllFiles: false,
    viewLogs: false,
    viewOwnEvaluations: true,
    viewSubordinateEvaluations: true,
    editEvaluations: false,
    createWorkspace: false, // 総務・管理者のみ
    editWorkspace: false,
    deleteWorkspace: false,
    addWorkspaceMembers: false,
    viewAllWorkspaces: false,
    createBoards: true,
    editBoards: false,
    deleteBoards: false,
    createLists: true, // サブマネージャーでもリスト作成可能
    editLists: false,
    deleteLists: false,
    addCardMembers: false, // サブマネは他人のカードにメンバー追加不可
    editOthersCards: false,
    canManageTasks: false,
    canManageWorkspaces: false,
  },
  "store_manager": {
    viewDashboard: true,
    viewDashboardStats: true,
    manageAnnouncements: true,
    viewConvenience: true,
    manageConvenience: true,
    viewOwnProfile: true,
    editOwnProfile: false, // 総務・管理者以外は自分のプロフィール編集不可
    viewSubordinateProfiles: true, // 全権限者が配下のプロフィール閲覧可能
    editSubordinateProfiles: false, // 店長は配下のプロフィール編集不可
    viewAllProfiles: true, // 全権限者が全プロフィール閲覧可能
    editAllProfiles: false, // 全員のプロフィール編集は不可
    viewMyNumber: false,
    suspendUsers: false,
    viewOrgChart: true,
    editOrgChart: false,
    moveEmployeeCards: false,
    viewOwnTasks: true,
    editOwnTasks: true,
    createTaskBoards: true,
    manageSubordinateTasks: true,
    viewOwnAttendance: true,
    viewSubordinateAttendance: true,
    editAttendance: false,
    viewLeaveManagement: true,
    editLeaveManagement: false,
    viewOwnPayroll: true,
    viewAllPayroll: false,
    editPayroll: false,
    uploadPayroll: true,
    deletePayroll: false,
    uploadFiles: true,
    deleteOwnFiles: false,
    deleteAllFiles: false,
    viewLogs: false,
    viewOwnEvaluations: true,
    viewSubordinateEvaluations: true,
    editEvaluations: true,
    createWorkspace: false, // 総務・管理者のみ
    editWorkspace: true,
    deleteWorkspace: false,
    addWorkspaceMembers: true,
    viewAllWorkspaces: false,
    createBoards: true,
    editBoards: true,
    deleteBoards: false,
    createLists: true, // 店長以上はリストの追加可能
    editLists: true,
    deleteLists: true,
    addCardMembers: true, // 店長は他人のカードにメンバー追加可能
    editOthersCards: false,
    canManageTasks: false,
    canManageWorkspaces: false,
  },
  manager: {
    viewDashboard: true,
    viewDashboardStats: true,
    manageAnnouncements: true,
    viewConvenience: true,
    manageConvenience: true,
    viewOwnProfile: true,
    editOwnProfile: false, // 総務・管理者以外は自分のプロフィール編集不可
    viewSubordinateProfiles: true, // 全権限者が配下のプロフィール閲覧可能
    editSubordinateProfiles: false,
    viewAllProfiles: true, // 全権限者が全プロフィール閲覧可能
    editAllProfiles: false,
    viewMyNumber: false,
    suspendUsers: false,
    viewOrgChart: true,
    editOrgChart: true,
    moveEmployeeCards: true,
    viewOwnTasks: true,
    editOwnTasks: true,
    createTaskBoards: true,
    manageSubordinateTasks: true,
    viewOwnAttendance: true,
    viewSubordinateAttendance: true,
    editAttendance: false,
    viewLeaveManagement: true,
    editLeaveManagement: false,
    viewOwnPayroll: true,
    viewAllPayroll: false,
    editPayroll: false,
    uploadPayroll: true,
    deletePayroll: false,
    uploadFiles: true,
    deleteOwnFiles: false,
    deleteAllFiles: false,
    viewLogs: false,
    viewOwnEvaluations: true,
    viewSubordinateEvaluations: true,
    editEvaluations: true,
    createWorkspace: false, // 総務・管理者のみ
    editWorkspace: true,
    deleteWorkspace: true,
    addWorkspaceMembers: true,
    viewAllWorkspaces: false,
    createBoards: true,
    editBoards: true,
    deleteBoards: true,
    createLists: true, // マネージャーはリストの追加可能
    editLists: true,
    deleteLists: true,
    addCardMembers: true, // マネージャーは他人のカードにメンバー追加可能
    editOthersCards: false,
    canManageTasks: false,
    canManageWorkspaces: false,
  },
  hr: {
    viewDashboard: true,
    viewDashboardStats: true,
    manageAnnouncements: true,
    viewConvenience: true,
    manageConvenience: true,
    viewOwnProfile: true,
    editOwnProfile: true,
    viewSubordinateProfiles: true,
    editSubordinateProfiles: true,
    viewAllProfiles: true,
    editAllProfiles: true,
    viewMyNumber: true,
    suspendUsers: true,
    viewOrgChart: true,
    editOrgChart: true,
    moveEmployeeCards: true,
    viewOwnTasks: true,
    editOwnTasks: true,
    createTaskBoards: true,
    manageSubordinateTasks: true,
    viewOwnAttendance: true,
    viewSubordinateAttendance: true,
    editAttendance: true,
    viewLeaveManagement: true,
    editLeaveManagement: true,
    viewOwnPayroll: true,
    viewAllPayroll: true,
    editPayroll: true,
    uploadPayroll: true,
    deletePayroll: true,
    uploadFiles: true,
    deleteOwnFiles: true,
    deleteAllFiles: true,
    viewLogs: true,
    viewOwnEvaluations: true,
    viewSubordinateEvaluations: true,
    editEvaluations: true,
    createWorkspace: true,
    editWorkspace: true,
    deleteWorkspace: true,
    addWorkspaceMembers: true,
    viewAllWorkspaces: true, // 総務は全ワークスペースを閲覧・編集可能
    createBoards: true,
    editBoards: true,
    deleteBoards: true,
    createLists: true, // 総務はリストの追加可能
    editLists: true,
    deleteLists: true,
    addCardMembers: true, // 総務は他人のカードにメンバー追加可能
    editOthersCards: true, // 総務は他人のカードも編集可能
    canManageTasks: true, // 総務はタスク管理権限あり
    canManageWorkspaces: true, // 総務はワークスペース管理権限あり
  },
  admin: {
    viewDashboard: true,
    viewDashboardStats: true,
    manageAnnouncements: true,
    viewConvenience: true,
    manageConvenience: true,
    viewOwnProfile: true,
    editOwnProfile: true,
    viewSubordinateProfiles: true,
    editSubordinateProfiles: true,
    viewAllProfiles: true,
    editAllProfiles: true,
    viewMyNumber: true,
    suspendUsers: true,
    viewOrgChart: true,
    editOrgChart: true,
    moveEmployeeCards: true,
    viewOwnTasks: true,
    editOwnTasks: true,
    createTaskBoards: true,
    manageSubordinateTasks: true,
    viewOwnAttendance: true,
    viewSubordinateAttendance: true,
    editAttendance: true,
    viewLeaveManagement: true,
    editLeaveManagement: true,
    viewOwnPayroll: true,
    viewAllPayroll: true,
    editPayroll: true,
    uploadPayroll: true,
    deletePayroll: true,
    uploadFiles: true,
    deleteOwnFiles: true,
    deleteAllFiles: true,
    viewLogs: true,
    viewOwnEvaluations: true,
    viewSubordinateEvaluations: true,
    editEvaluations: true,
    createWorkspace: true,
    editWorkspace: true,
    deleteWorkspace: true,
    addWorkspaceMembers: true,
    viewAllWorkspaces: true, // 管理者は全ワークスペース閲覧可能
    createBoards: true,
    editBoards: true,
    deleteBoards: true,
    createLists: true, // 管理者はリストの追加可能
    editLists: true,
    deleteLists: true,
    addCardMembers: true, // 管理者は他人のカードにメンバー追加可能
    editOthersCards: true, // 管理者は他人のカードも編集可能
    canManageTasks: true, // 管理者はタスク管理権限あり
    canManageWorkspaces: true, // 管理者はワークスペース管理権限あり
  },
}

export function getPermissions(role: UserRole | null | undefined): Permission {
  if (!role || !rolePermissions[role]) {
    // デフォルトはviewer権限
    return rolePermissions["viewer"]
  }
  return rolePermissions[role]
}

export function hasPermission(role: UserRole | null | undefined, permission: keyof Permission): boolean {
  if (!role || !rolePermissions[role]) {
    // デフォルトはviewer権限
    return rolePermissions["viewer"][permission]
  }
  return rolePermissions[role][permission]
}

// カード権限チェックヘルパー関数
export interface CardPermissionCheck {
  canEdit: boolean
  canAddMembers: boolean
  canDelete: boolean
  reason?: string
}

/**
 * カードの閲覧・編集権限をチェックする
 * @param userRole ユーザーの権限ロール
 * @param userId ユーザーID
 * @param cardCreatorId カード作成者ID
 * @param cardMemberIds カードメンバーのID配列
 * @param workspaceMemberIds ワークスペースメンバーのID配列
 * @returns 権限チェック結果
 */
export function checkCardPermissions(
  userRole: UserRole,
  userId: string,
  cardCreatorId: string,
  cardMemberIds: string[],
  workspaceMemberIds?: string[],
): CardPermissionCheck & { canOpen: boolean; canCreate: boolean } {
  const permissions = getPermissions(userRole)
  const isCardMember = cardMemberIds.includes(userId)
  const isCreator = userId === cardCreatorId
  const isWorkspaceMember = workspaceMemberIds?.includes(userId) || false

  // 管理者・総務は全ワークスペース・ボード・カードが見える＆編集可能
  if (userRole === "admin" || userRole === "hr") {
    return {
      canOpen: true,
      canEdit: true,
      canAddMembers: true,
      canDelete: true,
      canCreate: true,
    }
  }

  // 店長・マネージャーはワークスペースのメンバーになっている場合、全てのボード・カードが見える
  const canViewAllInWorkspace = (userRole === "store_manager" || userRole === "manager") && isWorkspaceMember

  if (canViewAllInWorkspace) {
    return {
      canOpen: true,
      canEdit: false, // 店長・マネージャーは閲覧のみ
      canAddMembers: permissions.addCardMembers,
      canDelete: isCreator,
      canCreate: true,
    }
  }

  // 閲覧者権限は新規カード追加不可
  const canCreateCard = userRole !== "viewer"

  // カードメンバーでない場合は開けない（見るだけ）
  if (!isCardMember) {
    return {
      canOpen: false, // 自分がメンバーではないカードは開けない
      canEdit: false,
      canAddMembers: false,
      canDelete: false,
      canCreate: canCreateCard,
      reason: "カードメンバーではありません",
    }
  }

  // カードメンバーの場合
  return {
    canOpen: true, // 自分がメンバーのカードは開ける
    canEdit: true,
    canAddMembers: permissions.addCardMembers,
    canDelete: isCreator,
    canCreate: canCreateCard,
  }
}

/**
 * ワークスペースの権限をチェックする
 * @param userRole ユーザーの権限ロール
 * @param userId ユーザーID
 * @param workspaceCreatorId ワークスペース作成者ID
 * @param workspaceMemberIds ワークスペースメンバーのID配列
 * @param workspaceName ワークスペース名（マイワークスペース判定用）
 * @returns 権限チェック結果
 */
export function checkWorkspacePermissions(
  userRole: UserRole,
  userId: string,
  workspaceCreatorId: string,
  workspaceMemberIds: string[],
  workspaceName?: string,
): {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canAddMembers: boolean
  canCreate: boolean
} {
  const permissions = getPermissions(userRole)
  const isCreator = userId === workspaceCreatorId
  const isMember = workspaceMemberIds.includes(userId)

  // マイワークスペースの場合は編集・削除不可（マイワークスペースは削除できない）
  const isMyWS = workspaceName && isMyWorkspace(workspaceName, workspaceCreatorId, userId)

  // 管理者・総務は全ワークスペースに全権限
  if (permissions.viewAllWorkspaces) {
    return {
      canView: true,
      canEdit: true, // 管理者・総務はマイワークスペースも編集可能
      canDelete: !isMyWS, // マイワークスペースは削除不可
      canAddMembers: true, // 管理者・総務はマイワークスペースにもメンバー追加可能
      canCreate: permissions.createWorkspace, // 総務・管理者のみ
    }
  }

  // ワークスペースメンバーでない場合
  if (!isMember) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canAddMembers: false,
      canCreate: false,
    }
  }

  // ワークスペースメンバーの場合
  return {
    canView: true,
    canEdit: false, // マイワークスペース以外は総務・管理者のみ編集可能
    canDelete: false,
    canAddMembers: false,
    canCreate: false, // 総務・管理者のみ
  }
}

/**
 * マイワークスペースかどうかを判定する
 * @param workspaceName ワークスペース名
 * @param workspaceCreatorId ワークスペース作成者ID
 * @param userId ユーザーID
 * @returns マイワークスペースかどうか
 */
export function isMyWorkspace(
  workspaceName: string,
  workspaceCreatorId: string,
  userId: string,
): boolean {
  // ワークスペース名に「マイワークスペース」が含まれ、作成者が自分の場合
  return workspaceName.includes("マイワークスペース") && workspaceCreatorId === userId
}

/**
 * ボードの権限をチェックする
 * @param userRole ユーザーの権限ロール
 * @param userId ユーザーID
 * @param boardCreatorId ボード作成者ID
 * @param workspaceName ワークスペース名（マイワークスペース判定用）
 * @param workspaceCreatorId ワークスペース作成者ID（マイワークスペース判定用）
 * @returns 権限チェック結果
 */
export function checkBoardPermissions(
  userRole: UserRole,
  userId: string,
  boardCreatorId: string,
  workspaceName?: string,
  workspaceCreatorId?: string,
): {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  reason?: string
} {
  const permissions = getPermissions(userRole)
  const isCreator = userId === boardCreatorId

  // マイワークスペース内の場合は全員がボードの追加・編集・削除可能
  if (workspaceName && workspaceCreatorId && isMyWorkspace(workspaceName, workspaceCreatorId, userId)) {
    return {
      canCreate: true,
      canEdit: true,
      canDelete: true,
    }
  }

  // マネージャー・総務・管理者のみボードの追加・編集ボタンを表示
  const canManageBoards = userRole === "manager" || userRole === "hr" || userRole === "admin"
  
  if (!canManageBoards) {
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      reason: "この操作はマネージャー・総務・管理者のみ可能です",
    }
  }

  // 削除権限はマネージャー・総務・管理者のみ
  if (!permissions.deleteBoards) {
    return {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      reason: "この操作はマネージャー権限以上が必要です",
    }
  }

  return {
    canCreate: true,
    canEdit: true,
    canDelete: true,
  }
}

/**
 * リストの権限をチェックする
 * @param userRole ユーザーの権限ロール
 * @returns 権限チェック結果
 */
export function checkListPermissions(userRole: UserRole): {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  reason?: string
} {
  const permissions = getPermissions(userRole)

  // リスト操作は店長・マネージャー・総務・管理者のみ
  if (!permissions.createLists) {
    return {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      reason: "この操作は店長権限以上が必要です",
    }
  }

  return {
    canCreate: permissions.createLists,
    canEdit: permissions.editLists,
    canDelete: permissions.deleteLists,
  }
}

/**
 * 権限エラーメッセージを生成する
 * @param userRole ユーザーの権限ロール
 * @param requiredRole 必要な権限ロール
 * @returns エラーメッセージ
 */
export function getPermissionErrorMessage(requiredRole: string): string {
  return `この操作は${requiredRole}権限以上が必要です`
}
