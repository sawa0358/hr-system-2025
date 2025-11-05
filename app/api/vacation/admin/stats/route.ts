// 管理者用統計API
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateUsedDays, getNextGrantDateForEmployee } from "@/lib/vacation-stats"
import { getPreviousGrantDate } from "@/lib/vacation-grant-lot"
import { loadAppConfig } from "@/lib/vacation-config"

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
    try {
      const activeEmployees = await prisma.employee.findMany({
        where: { 
          status: "active",
          role: { not: 'admin' }, // 管理者権限は除外
          employeeType: {
            in: ['正社員', '契約社員', 'パートタイム', '派遣社員'], // 有給管理対象の雇用形態のみ
          },
        },
        select: { id: true },
      })
      const activeEmployeeIdList = activeEmployees.map(e => e.id)
      
      if (activeEmployeeIdList.length > 0) {
        const today = new Date()
        const minGrantDaysForAlert = 5
        const threeMonthsInMs = 3 * 30 * 24 * 60 * 60 * 1000 // 3ヶ月（簡易計算）
        
        // 各社員のアラート状況をチェック
        const alertChecks = await Promise.all(
          activeEmployeeIdList.map(async (employeeId) => {
            try {
              // 最新の付与ロットを取得
              const latestLot = await prisma.grantLot.findFirst({
                where: {
                  employeeId,
                  expiryDate: { gte: today },
                },
                orderBy: { grantDate: 'desc' },
              })
              
              if (!latestLot) return false
              
              const latestGrantDays = Number(latestLot.daysGranted)
              const used = await calculateUsedDays(employeeId, today)
              
              // 次回付与日を取得
              const { getNextGrantDateForEmployee } = await import('@/lib/vacation-stats')
              let nextGrantDate: Date | null = null
              try {
                nextGrantDate = await getNextGrantDateForEmployee(employeeId)
              } catch {
                // 次回付与日が取得できない場合はスキップ
                return false
              }
              
              if (!nextGrantDate) return false
              
              // 次回付与日まで3ヶ月をきっているかチェック
              const diffMs = nextGrantDate.getTime() - today.getTime()
              const isWithinThreeMonths = diffMs < threeMonthsInMs
              
              // 次回付与日まで3ヶ月をきっていて、かつ5日消化義務未達成
              return isWithinThreeMonths && latestGrantDays >= minGrantDaysForAlert && used < minGrantDaysForAlert
            } catch {
              return false
            }
          })
        )
        
        alerts = alertChecks.filter(Boolean).length
      }
    } catch (alertError: any) {
      console.warn('アラート数計算エラー:', alertError?.message)
      alerts = 0
    }

    return NextResponse.json({
      pending: pendingRequests,
      approvedThisMonth,
      rejected: rejectedRequests,
      alerts,
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

