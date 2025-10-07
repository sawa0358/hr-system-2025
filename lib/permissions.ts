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
  },
}

export function getPermissions(role: UserRole): Permission {
  return rolePermissions[role]
}

export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  return rolePermissions[role][permission]
}
