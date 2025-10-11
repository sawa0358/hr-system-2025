// Permission types and utilities
export type UserRole = "viewer" | "general" | "sub_manager" | "store_manager" | "manager" | "hr" | "admin"

export interface Permission {
  // Dashboard
  viewDashboard: boolean
  viewDashboardStats: boolean
  manageAnnouncements: boolean

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
  addCardMembers: boolean // 他人のカードにメンバー追加できるか
  editOthersCards: boolean // 他人のカードを編集できるか
}

export const rolePermissions: Record<UserRole, Permission> = {
  viewer: {
    viewDashboard: true,
    viewDashboardStats: false,
    manageAnnouncements: false,
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
    viewLeaveManagement: false,
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
    addCardMembers: false,
    editOthersCards: false,
  },
  general: {
    viewDashboard: true,
    viewDashboardStats: false,
    manageAnnouncements: false,
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
    createTaskBoards: false,
    manageSubordinateTasks: false,
    viewOwnAttendance: true,
    viewSubordinateAttendance: false,
    editAttendance: false,
    viewLeaveManagement: false,
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
    createWorkspace: true, // ワークスペースは作成可能
    editWorkspace: false, // 自分のワークスペースのみ編集（別途チェック）
    deleteWorkspace: false,
    addWorkspaceMembers: false,
    viewAllWorkspaces: false,
    createBoards: true, // ボードは作成可能
    editBoards: false, // 自分のボードのみ編集（別途チェック）
    deleteBoards: false,
    addCardMembers: false, // カード新規作成時のみメンバー追加可
    editOthersCards: false,
  },
  "sub_manager": {
    viewDashboard: true,
    viewDashboardStats: false,
    manageAnnouncements: true,
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
    viewLeaveManagement: false,
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
    createWorkspace: true,
    editWorkspace: false,
    deleteWorkspace: false,
    addWorkspaceMembers: false,
    viewAllWorkspaces: false,
    createBoards: true,
    editBoards: false,
    deleteBoards: false,
    addCardMembers: false, // サブマネは他人のカードにメンバー追加不可
    editOthersCards: false,
  },
  "store_manager": {
    viewDashboard: true,
    viewDashboardStats: true,
    manageAnnouncements: true,
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
    viewLeaveManagement: false,
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
    createWorkspace: true,
    editWorkspace: true,
    deleteWorkspace: false,
    addWorkspaceMembers: true,
    viewAllWorkspaces: false,
    createBoards: true,
    editBoards: true,
    deleteBoards: false,
    addCardMembers: true, // 店長は他人のカードにメンバー追加可能
    editOthersCards: false,
  },
  manager: {
    viewDashboard: true,
    viewDashboardStats: true,
    manageAnnouncements: true,
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
    viewLeaveManagement: false,
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
    createWorkspace: true,
    editWorkspace: true,
    deleteWorkspace: true,
    addWorkspaceMembers: true,
    viewAllWorkspaces: false,
    createBoards: true,
    editBoards: true,
    deleteBoards: true,
    addCardMembers: true, // マネージャーは他人のカードにメンバー追加可能
    editOthersCards: false,
  },
  hr: {
    viewDashboard: true,
    viewDashboardStats: true,
    manageAnnouncements: true,
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
    viewAllWorkspaces: true, // 総務は全ワークスペース閲覧可能
    createBoards: true,
    editBoards: true,
    deleteBoards: true,
    addCardMembers: true, // 総務は他人のカードにメンバー追加可能
    editOthersCards: true, // 総務は他人のカードも編集可能
  },
  admin: {
    viewDashboard: true,
    viewDashboardStats: true,
    manageAnnouncements: true,
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
    addCardMembers: true, // 管理者は他人のカードにメンバー追加可能
    editOthersCards: true, // 管理者は他人のカードも編集可能
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
 * カードの編集権限をチェックする
 * @param userRole ユーザーの権限ロール
 * @param userId ユーザーID
 * @param cardCreatorId カード作成者ID
 * @param cardMemberIds カードメンバーのID配列
 * @returns 権限チェック結果
 */
export function checkCardPermissions(
  userRole: UserRole,
  userId: string,
  cardCreatorId: string,
  cardMemberIds: string[],
): CardPermissionCheck {
  const permissions = getPermissions(userRole)
  const isCardMember = cardMemberIds.includes(userId)
  const isCreator = userId === cardCreatorId

  // 管理者・総務は全権限
  if (permissions.editOthersCards) {
    return {
      canEdit: true,
      canAddMembers: true,
      canDelete: true,
    }
  }

  // カードメンバーでない場合
  if (!isCardMember) {
    return {
      canEdit: false,
      canAddMembers: permissions.addCardMembers, // 店長・マネージャーは追加可能
      canDelete: false,
      reason: "カードメンバーではありません",
    }
  }

  // カードメンバーの場合
  return {
    canEdit: true,
    canAddMembers: permissions.addCardMembers, // 店長・マネージャー・総務・管理者のみ
    canDelete: isCreator, // 作成者のみ削除可能
  }
}

/**
 * ワークスペースの権限をチェックする
 * @param userRole ユーザーの権限ロール
 * @param userId ユーザーID
 * @param workspaceCreatorId ワークスペース作成者ID
 * @param workspaceMemberIds ワークスペースメンバーのID配列
 * @returns 権限チェック結果
 */
export function checkWorkspacePermissions(
  userRole: UserRole,
  userId: string,
  workspaceCreatorId: string,
  workspaceMemberIds: string[],
): {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canAddMembers: boolean
} {
  const permissions = getPermissions(userRole)
  const isCreator = userId === workspaceCreatorId
  const isMember = workspaceMemberIds.includes(userId)

  // 管理者・総務は全ワークスペースに全権限
  if (permissions.viewAllWorkspaces) {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canAddMembers: true,
    }
  }

  // ワークスペースメンバーでない場合
  if (!isMember) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canAddMembers: false,
    }
  }

  // ワークスペースメンバーの場合
  return {
    canView: true,
    canEdit: isCreator && permissions.editWorkspace,
    canDelete: isCreator && permissions.deleteWorkspace,
    canAddMembers: permissions.addWorkspaceMembers,
  }
}
