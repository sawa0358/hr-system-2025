export interface ActivityLog {
  id: string
  timestamp: Date
  userId: string
  userName: string
  action: string
  module: string
  details: string
  metadata?: Record<string, any>
  // 追加フィールド
  ipAddress?: string
  userAgent?: string
  severity?: 'info' | 'warning' | 'error' | 'security'
}

class ActivityLogger {
  private logs: ActivityLog[] = []

  // 現在のユーザー情報を取得する関数
  private getCurrentUser() {
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("currentUser")
        if (savedUser) {
          const user = JSON.parse(savedUser)
          return {
            id: user.id || "unknown",
            name: user.name || "不明なユーザー"
          }
        }
      } catch (error) {
        console.error("Failed to parse current user:", error)
      }
    }
    return {
      id: "system",
      name: "システム"
    }
  }

  // ブラウザ情報を取得する関数
  private getBrowserInfo() {
    if (typeof window !== "undefined") {
      return {
        userAgent: navigator.userAgent,
        // IPアドレスはサーバーサイドで取得する必要があります
        ipAddress: undefined
      }
    }
    return {
      userAgent: undefined,
      ipAddress: undefined
    }
  }

  log(action: string, module: string, details: string, metadata?: Record<string, any>, severity: 'info' | 'warning' | 'error' | 'security' = 'info') {
    const currentUser = this.getCurrentUser()
    const browserInfo = this.getBrowserInfo()
    
    const log: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      module,
      details,
      metadata,
      ipAddress: browserInfo.ipAddress,
      userAgent: browserInfo.userAgent,
      severity,
    }

    this.logs.push(log)
    console.log("[v0] Activity logged:", log)

    // TODO: Persist to database
    if (typeof window !== "undefined") {
      const existingLogs = localStorage.getItem("activity_logs")
      const allLogs = existingLogs ? JSON.parse(existingLogs) : []
      allLogs.push(log)
      localStorage.setItem("activity_logs", JSON.stringify(allLogs))
    }
  }

  getLogs(): ActivityLog[] {
    if (typeof window !== "undefined") {
      const existingLogs = localStorage.getItem("activity_logs")
      return existingLogs ? JSON.parse(existingLogs) : []
    }
    return this.logs
  }

  clearLogs() {
    this.logs = []
    if (typeof window !== "undefined") {
      localStorage.removeItem("activity_logs")
    }
  }
}

export const activityLogger = new ActivityLogger()

// Helper functions for common actions
export const logEmployeeAction = (action: string, employeeName: string, details: string, severity: 'info' | 'warning' | 'error' | 'security' = 'info') => {
  activityLogger.log(action, "社員情報", `${employeeName}: ${details}`, undefined, severity)
}

export const logOrganizationAction = (action: string, details: string, severity: 'info' | 'warning' | 'error' | 'security' = 'info') => {
  activityLogger.log(action, "組織図", details, undefined, severity)
}

export const logTaskAction = (action: string, taskTitle: string, details: string, severity: 'info' | 'warning' | 'error' | 'security' = 'info') => {
  activityLogger.log(action, "タスク管理", `${taskTitle}: ${details}`, undefined, severity)
}

export const logPayrollAction = (action: string, employeeName: string, details: string, severity: 'info' | 'warning' | 'error' | 'security' = 'info') => {
  activityLogger.log(action, "給与管理", `${employeeName}: ${details}`, undefined, severity)
}

// セキュリティ関連のログ
export const logSecurityAction = (action: string, details: string, metadata?: Record<string, any>) => {
  activityLogger.log(action, "セキュリティ", details, metadata, 'security')
}

// ログイン/ログアウトのログ
export const logAuthAction = (action: 'login' | 'logout', userName: string, success: boolean = true) => {
  const details = success 
    ? `${userName}が${action === 'login' ? 'ログイン' : 'ログアウト'}しました`
    : `${userName}の${action === 'login' ? 'ログイン' : 'ログアウト'}に失敗しました`
  
  activityLogger.log(
    action === 'login' ? 'ログイン' : 'ログアウト', 
    "認証", 
    details, 
    { success }, 
    success ? 'info' : 'warning'
  )
}
