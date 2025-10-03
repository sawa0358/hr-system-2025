export interface ActivityLog {
  id: string
  timestamp: Date
  userId: string
  userName: string
  action: string
  module: string
  details: string
  metadata?: Record<string, any>
}

class ActivityLogger {
  private logs: ActivityLog[] = []

  log(action: string, module: string, details: string, metadata?: Record<string, any>) {
    const log: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      userId: "admin", // TODO: Get from auth context
      userName: "管理者", // TODO: Get from auth context
      action,
      module,
      details,
      metadata,
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
export const logEmployeeAction = (action: string, employeeName: string, details: string) => {
  activityLogger.log(action, "社員情報", `${employeeName}: ${details}`)
}

export const logOrganizationAction = (action: string, details: string) => {
  activityLogger.log(action, "組織図", details)
}

export const logTaskAction = (action: string, taskTitle: string, details: string) => {
  activityLogger.log(action, "タスク管理", `${taskTitle}: ${details}`)
}

export const logPayrollAction = (action: string, employeeName: string, details: string) => {
  activityLogger.log(action, "給与管理", `${employeeName}: ${details}`)
}
