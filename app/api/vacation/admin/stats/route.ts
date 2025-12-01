// 管理者用統計API
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateUsedDays, getNextGrantDateForEmployee } from "@/lib/vacation-stats"
import { getPreviousGrantDate } from "@/lib/vacation-grant-lot"
import { loadAppConfig } from "@/lib/vacation-config"

export const dynamic = 'force-dynamic'

/**
 * 管理者用統計情報を取得するAPI
 * GET /api/vacation/admin/stats
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    
    let pendingRequests = 0
    let approvedThisMonth = 0
    let rejectedRequests = 0
    
    // 新システムのテーブルから取得を試す
    try {
      // ステータスが「active」の社員のみを対象にする
      // 有給管理の対象社員: 正社員・契約社員・パートタイム・派遣社員のみ、管理者権限は除外
      const activeEmployeeIds = await prisma.employee.findMany({
        where: { 
          status: "active",
          role: { not: 'admin' }, // 管理者権限は除外
          employeeType: {
            in: ['正社員', '契約社員', 'パートタイム', '派遣社員'], // 有給管理対象の雇用形態のみ
          },
        },
        select: { id: true },
      })
      const activeEmployeeIdList = activeEmployeeIds.map(e => e.id)
      
      pendingRequests = await prisma.timeOffRequest.count({
        where: { 
          status: "PENDING",
          employeeId: { in: activeEmployeeIdList },
        },
      })

      // 今期承認済み: 各社員の今期の期間内の承認済み申請を集計
      // 各社員ごとに今期の期間を計算して、その期間内の申請のみをカウント
      let approvedThisPeriod = 0
      let rejectedThisPeriod = 0
      
      for (const employeeId of activeEmployeeIdList) {
        try {
          const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            select: { id: true, joinDate: true, configVersion: true },
          })
          
          if (!employee) continue
          
          const cfg = await loadAppConfig(employee.configVersion || undefined)
          const today = new Date()
          
          // 現在の付与日（今期の開始日）を取得
          const currentGrantDate = getPreviousGrantDate(new Date(employee.joinDate), cfg, today)
          if (!currentGrantDate) continue
          
          // 次回付与日（今期の終了日）を取得
          const nextGrantDate = await getNextGrantDateForEmployee(employeeId)
          if (!nextGrantDate) continue
          
          // 今期の期間内の承認済み申請をカウント
          const approvedRequests = await prisma.timeOffRequest.findMany({
            where: {
              employeeId,
              status: "APPROVED",
            },
          })
          
          const approvedInPeriod = approvedRequests.filter((req) => {
            const reqStartDate = new Date(req.startDate)
            const reqEndDate = new Date(req.endDate)
            // 申請の開始日または終了日が今期の期間内にあるかチェック
            return (reqStartDate >= currentGrantDate && reqStartDate < nextGrantDate) ||
                   (reqEndDate >= currentGrantDate && reqEndDate < nextGrantDate) ||
                   (reqStartDate <= currentGrantDate && reqEndDate >= nextGrantDate) // 期間をまたぐ申請も含む
          })
          
          approvedThisPeriod += approvedInPeriod.length
          
          // 今期の期間内の却下申請をカウント
          const rejectedRequests = await prisma.timeOffRequest.findMany({
            where: {
              employeeId,
              status: "REJECTED",
            },
          })
          
          const rejectedInPeriod = rejectedRequests.filter((req) => {
            const reqStartDate = new Date(req.startDate)
            const reqEndDate = new Date(req.endDate)
            // 申請の開始日または終了日が今期の期間内にあるかチェック
            return (reqStartDate >= currentGrantDate && reqStartDate < nextGrantDate) ||
                   (reqEndDate >= currentGrantDate && reqEndDate < nextGrantDate) ||
                   (reqStartDate <= currentGrantDate && reqEndDate >= nextGrantDate) // 期間をまたぐ申請も含む
          })
          
          rejectedThisPeriod += rejectedInPeriod.length
        } catch (error: any) {
          // エラーが発生した社員はスキップ
          console.warn(`今期統計計算エラー (employeeId: ${employeeId}):`, error?.message)
          continue
        }
      }
      
      approvedThisMonth = approvedThisPeriod
      rejectedRequests = rejectedThisPeriod
    } catch (newSystemError: any) {
      // テーブルが存在しない場合は旧システムを使用
      if (newSystemError?.code === 'P2021' || newSystemError?.message?.includes('does not exist')) {
        try {
          // ステータスが「active」の社員のみを対象にする
          const activeEmployeeIds = await prisma.employee.findMany({
            where: { status: "active" },
            select: { id: true },
          })
          const activeEmployeeIdList = activeEmployeeIds.map(e => e.id)
          
          pendingRequests = await prisma.vacationRequest.count({
            where: { 
              status: "PENDING",
              employeeId: { in: activeEmployeeIdList },
            },
          })

          // 今期承認済み: 各社員の今期の期間内の承認済み申請を集計（旧システム）
          // 旧システムでも同様のロジックを適用
          let approvedThisPeriod = 0
          let rejectedThisPeriod = 0
          
          for (const employeeId of activeEmployeeIdList) {
            try {
              const employee = await prisma.employee.findUnique({
                where: { id: employeeId },
                select: { id: true, joinDate: true, configVersion: true },
              })
              
              if (!employee) continue
              
              const cfg = await loadAppConfig(employee.configVersion || undefined)
              const today = new Date()
              
              // 現在の付与日（今期の開始日）を取得
              const currentGrantDate = getPreviousGrantDate(new Date(employee.joinDate), cfg, today)
              if (!currentGrantDate) continue
              
              // 次回付与日（今期の終了日）を取得
              const nextGrantDate = await getNextGrantDateForEmployee(employeeId)
              if (!nextGrantDate) continue
              
              // 今期の期間内の承認済み申請をカウント
              const approvedRequests = await prisma.vacationRequest.findMany({
                where: {
                  employeeId,
                  status: "APPROVED",
                },
              })
              
              const approvedInPeriod = approvedRequests.filter((req) => {
                const reqStartDate = new Date(req.startDate)
                const reqEndDate = new Date(req.endDate)
                return (reqStartDate >= currentGrantDate && reqStartDate < nextGrantDate) ||
                       (reqEndDate >= currentGrantDate && reqEndDate < nextGrantDate) ||
                       (reqStartDate <= currentGrantDate && reqEndDate >= nextGrantDate)
              })
              
              approvedThisPeriod += approvedInPeriod.length
              
              // 今期の期間内の却下申請をカウント
              const rejectedRequests = await prisma.vacationRequest.findMany({
                where: {
                  employeeId,
                  status: "REJECTED",
                },
              })
              
              const rejectedInPeriod = rejectedRequests.filter((req) => {
                const reqStartDate = new Date(req.startDate)
                const reqEndDate = new Date(req.endDate)
                return (reqStartDate >= currentGrantDate && reqStartDate < nextGrantDate) ||
                       (reqEndDate >= currentGrantDate && reqEndDate < nextGrantDate) ||
                       (reqStartDate <= currentGrantDate && reqEndDate >= nextGrantDate)
              })
              
              rejectedThisPeriod += rejectedInPeriod.length
            } catch (error: any) {
              console.warn(`今期統計計算エラー (employeeId: ${employeeId}):`, error?.message)
              continue
            }
          }
          
          approvedThisMonth = approvedThisPeriod
          rejectedRequests = rejectedThisPeriod
        } catch (oldSystemError: any) {
          console.warn('旧システムからの統計取得も失敗:', oldSystemError?.message)
        }
      } else {
        console.warn('新システムからの統計取得エラー:', newSystemError?.message)
      }
    }

    // アラート数（5日消化義務アラート）
    // 次回付与日まで3ヶ月をきっていて、かつ5日消化義務未達成の社員数
    // 対象社員: 正社員・契約社員・パートタイム・派遣社員のみ、管理者権限は除外
    let alerts = 0
    let alertEmployees: Array<{
      id: string
      name: string
      department: string | null
      employeeNumber: string | null
      latestGrantDays: number
      used: number
      nextGrantDate: string | null
    }> = []
    try {
      let activeEmployees: any[] = []
      try {
        activeEmployees = await prisma.employee.findMany({
          where: { 
            status: "active",
            isInvisibleTop: false, // applicants APIと同じ条件
            role: { not: 'admin' }, // 管理者権限は除外
            employeeType: {
              in: ['正社員', '契約社員', 'パートタイム', '派遣社員'], // 有給管理対象の雇用形態のみ
            },
          },
          select: { id: true, name: true, department: true, employeeNumber: true },
        })
      } catch (employeeQueryError: any) {
        // isInvisibleTopカラムがない場合は、条件なしで取得
        console.warn('[stats API] isInvisibleTopカラムエラー、条件なしで再取得:', employeeQueryError?.message)
        activeEmployees = await prisma.employee.findMany({
          where: { 
            status: "active",
            role: { not: 'admin' },
            employeeType: {
              in: ['正社員', '契約社員', 'パートタイム', '派遣社員'],
            },
          },
          select: { id: true, name: true, department: true, employeeNumber: true },
        })
      }
      
      if (activeEmployees.length > 0) {
        const today = new Date()
        // 設定ファイルからアラート閾値を読み込む（デフォルトは10日）
        const defaultConfig = await loadAppConfig()
        const minGrantDaysForAlert = defaultConfig.alert?.minGrantDaysForAlert ?? 10
        const minLegalUseDays = defaultConfig.minLegalUseDaysPerYear ?? 5
        const threeMonthsInMs = 3 * 30 * 24 * 60 * 60 * 1000 // 3ヶ月（簡易計算）
        
        // 各社員のアラート状況をチェック
        const alertResults = await Promise.all(
          activeEmployees.map(async (employee) => {
            try {
              // 最新の付与ロットを取得
              const latestLot = await prisma.grantLot.findFirst({
                where: {
                  employeeId: employee.id,
                  expiryDate: { gte: today },
                },
                orderBy: { grantDate: 'desc' },
              })
              
              if (!latestLot) return null
              
              const latestGrantDays = Number(latestLot.daysGranted)
              const used = await calculateUsedDays(employee.id, today)
              
              // 次回付与日を取得
              const { getNextGrantDateForEmployee } = await import('@/lib/vacation-stats')
              let nextGrantDate: Date | null = null
              try {
                nextGrantDate = await getNextGrantDateForEmployee(employee.id)
              } catch {
                // 次回付与日が取得できない場合はスキップ
                return null
              }
              
              if (!nextGrantDate) return null
              
              // 次回付与日まで3ヶ月をきっているかチェック
              const diffMs = nextGrantDate.getTime() - today.getTime()
              const isWithinThreeMonths = diffMs < threeMonthsInMs
              
              // 1回の付与日数がminGrantDaysForAlert以上の社員のみがアラート対象
              // 次回付与日まで3ヶ月をきっていて、かつ法定最低取得日数（minLegalUseDaysPerYear）未達成
              const isAlert = isWithinThreeMonths && latestGrantDays >= minGrantDaysForAlert && used < minLegalUseDays
              
              if (isAlert) {
                return {
                  id: employee.id,
                  name: employee.name,
                  department: employee.department,
                  employeeNumber: employee.employeeNumber,
                  latestGrantDays,
                  used,
                  nextGrantDate: nextGrantDate.toISOString().slice(0, 10),
                }
              }
              return null
            } catch {
              return null
            }
          })
        )
        
        alertEmployees = alertResults.filter((e): e is NonNullable<typeof e> => e !== null)
        alerts = alertEmployees.length
      }
    } catch (alertError: any) {
      console.warn('アラート数計算エラー:', alertError?.message)
      alerts = 0
      alertEmployees = []
    }

    return NextResponse.json({
      pending: pendingRequests,
      approvedThisMonth,
      rejected: rejectedRequests,
      alerts,
      alertEmployees, // アラート対象社員リストも返す
    })
  } catch (error: any) {
    console.error("GET /api/vacation/admin/stats error", error)
    // エラーが発生しても空の統計を返す（画面が崩れないように）
    return NextResponse.json({
      pending: 0,
      approvedThisMonth: 0,
      rejected: 0,
      alerts: 0,
    })
  }
}

