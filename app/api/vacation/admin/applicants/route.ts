import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNextGrantDate, getPreviousGrantDate } from "@/lib/vacation-grant-lot"
import { loadAppConfig } from "@/lib/vacation-config"
import { chooseGrantDaysForEmployee } from "@/lib/vacation-grant-lot"
import { calculateRemainingDays, calculateUsedDays, calculatePendingDays, calculateTotalGranted, getNextGrantDateForEmployee } from "@/lib/vacation-stats"

// 管理者向け: 全社員の有給カード表示用データ
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get("view") || "all" // "pending" or "all"
    const statusFilter = searchParams.get("status") // "PENDING", "APPROVED", "REJECTED"
    const monthFilter = searchParams.get("month") // "YYYY-MM" format
    const alertsFilter = searchParams.get("alerts") === "true" // boolean
    
    // 社員の基本情報取得（vacationPatternとweeklyPatternはオプショナル）
    // ステータスが「active」の社員のみを対象にする
    // 有給管理の対象社員: 正社員・契約社員・パートタイム・派遣社員のみ、管理者権限は除外
    let employees
    try {
      employees = await prisma.employee.findMany({
        where: { 
          isInvisibleTop: false,
          status: "active", // ステータスが「active」の社員のみ（コピー社員も除外）
          role: { not: 'admin' }, // 管理者権限は除外
          employeeType: {
            in: ['正社員', '契約社員', 'パートタイム', '派遣社員'], // 有給管理対象の雇用形態のみ
          },
        },
        select: {
          id: true,
          name: true,
          employeeNumber: true,
          joinDate: true,
          employeeType: true,
          department: true,
          position: true,
          organization: true,
          status: true,
          showInOrgChart: true,
          vacationPattern: true,
          weeklyPattern: true,
          role: true, // フィルタリング用にroleも取得
          avatar: true, // アバター画像URL
        },
        orderBy: { joinDate: "asc" },
      })
    } catch (schemaError: any) {
      // vacationPatternやweeklyPatternカラムが存在しない場合は、それらを除外して取得
      if (schemaError?.message?.includes('vacationPattern') || schemaError?.message?.includes('weeklyPattern')) {
        employees = await prisma.employee.findMany({
          where: { 
            isInvisibleTop: false,
            status: { not: 'copy' }, // コピー社員を除外
            role: { not: 'admin' }, // 管理者権限は除外
            employeeType: {
              in: ['正社員', '契約社員', 'パートタイム', '派遣社員'], // 有給管理対象の雇用形態のみ
            },
          },
          select: {
            id: true,
            name: true,
            employeeNumber: true,
            joinDate: true,
            employeeType: true,
            department: true,
            position: true,
            organization: true,
            status: true,
            showInOrgChart: true,
            role: true, // フィルタリング用にroleも取得
            avatar: true, // アバター画像URL
          },
          orderBy: { joinDate: "asc" },
        })
        // 後でvacationPatternとweeklyPatternをnullとして追加
        employees = employees.map((e: any) => ({
          ...e,
          vacationPattern: null,
          weeklyPattern: null,
        }))
      } else {
        throw schemaError
      }
    }

    if (employees.length === 0) {
      return NextResponse.json({ employees: [] })
    }

    // 社員ごとの統計を集計
    const today = new Date()
    const resultsArrays = await Promise.all(
      employees.map(async (e) => {
        // 新しいロットベースシステムを使用して統計を計算
        let remaining = 0
        let used = 0
        let pending = 0
        let granted = 0
        
        try {
          // lib/vacation-stats.tsの関数を使用して統一された計算ロジックで取得
          remaining = await calculateRemainingDays(e.id, today)
          used = await calculateUsedDays(e.id, today)
          pending = await calculatePendingDays(e.id)
          granted = await calculateTotalGranted(e.id, today)
        } catch (statsError: any) {
          // テーブルが存在しない場合は無視（フォールバック処理へ）
          if (statsError?.code !== 'P2021' && !statsError?.message?.includes('does not exist')) {
            console.warn(`統計取得エラー (employeeId: ${e.id}):`, statsError?.code, statsError?.message)
          }
        }
        
        // ロットベースシステムでデータがない場合は旧システムを使用
        if (remaining === 0 && granted === 0) {
          try {
            const balances = await prisma.vacationBalance.findMany({
              where: { employeeId: e.id },
              select: { remainingDays: true, grantDays: true },
            })
            remaining = balances.reduce((a, b) => a + Number(b.remainingDays ?? 0), 0)
            granted = balances.reduce((a, b) => a + Number(b.grantDays ?? 0), 0)
          } catch (balanceError: any) {
            // エラーは無視（データなしとして扱う）
          }
        }
        
        // 旧システムのデータも取得を試す
        if (used === 0 && pending === 0) {
          try {
            const [approvedSum, pendingSum] = await Promise.all([
              prisma.vacationRequest.aggregate({ _sum: { usedDays: true }, where: { employeeId: e.id, status: "APPROVED" } }),
              prisma.vacationRequest.aggregate({ _sum: { usedDays: true }, where: { employeeId: e.id, status: "PENDING" } }),
            ])
            used = Number(approvedSum._sum.usedDays ?? 0)
            pending = Number(pendingSum._sum.usedDays ?? 0)
          } catch (oldSystemError: any) {
            // エラーは無視（データなしとして扱う）
          }
        }

        // 次回付与日と付与予定日数を計算
        let nextGrantDate: Date | null = null
        let currentGrantDate: Date | null = null // 現在の付与日（今期の開始日）
        let nextGrantDays: number = 0
        // 最新の付与日での付与日数（5日消化義務アラート判定用）
        let latestGrantDays: number = 0
        // 設定ファイルを読み込む（アラート判定でも使用）
        const cfg = await loadAppConfig(e.configVersion || undefined)
        try {
          const today = new Date()
          
          // 現在の付与日（今期の開始日）を取得
          currentGrantDate = getPreviousGrantDate(new Date(e.joinDate), cfg, today)
          
          // 次回付与日を取得
          nextGrantDate = await getNextGrantDateForEmployee(e.id)
          if (nextGrantDate && e.vacationPattern) {
            // 次回付与日の勤続年数を計算
            const yearsSinceJoin = (nextGrantDate.getTime() - new Date(e.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
            nextGrantDays = chooseGrantDaysForEmployee(e.vacationPattern, yearsSinceJoin, cfg)
          }
          
          // 最新の付与日での付与日数を取得（5日消化義務アラート判定用）
          const latestLot = await prisma.grantLot.findFirst({
            where: {
              employeeId: e.id,
              expiryDate: { gte: today },
            },
            orderBy: { grantDate: 'desc' },
          })
          if (latestLot) {
            latestGrantDays = Number(latestLot.daysGranted)
          }
        } catch (grantError: any) {
          console.warn(`次回付与日計算エラー (employeeId: ${e.id}):`, grantError?.message || grantError)
        }

        // 申請を取得（表示用）
        // フィルタリングに応じて申請を取得
        let requests: any[] = []
        try {
          if (statusFilter === "PENDING") {
            // 承認待ちの申請を取得
            const allPendingRequests = await prisma.timeOffRequest.findMany({
              where: { employeeId: e.id, status: "PENDING" },
              orderBy: { createdAt: "desc" },
            })
            requests = allPendingRequests
          } else if (statusFilter === "APPROVED") {
            // 今期承認済みの申請を取得（代理申請で今期でないものは除外）
            const allApprovedRequests = await prisma.timeOffRequest.findMany({
              where: {
                employeeId: e.id,
                status: "APPROVED",
              },
              orderBy: { approvedAt: "desc" },
            })
            // 今期の期間内の申請のみをフィルタリング
            if (currentGrantDate && nextGrantDate) {
              requests = allApprovedRequests.filter((req) => {
                const reqStartDate = new Date(req.startDate)
                const reqEndDate = new Date(req.endDate)
                // 申請の開始日または終了日が今期の期間内にあるかチェック
                return (reqStartDate >= currentGrantDate! && reqStartDate < nextGrantDate!) ||
                       (reqEndDate >= currentGrantDate! && reqEndDate < nextGrantDate!) ||
                       (reqStartDate <= currentGrantDate! && reqEndDate >= nextGrantDate!) // 期間をまたぐ申請も含む
              })
            } else {
              requests = []
            }
          } else if (statusFilter === "REJECTED") {
            // 今期却下された申請を取得
            const allRejectedRequests = await prisma.timeOffRequest.findMany({
              where: { employeeId: e.id, status: "REJECTED" },
              orderBy: { createdAt: "desc" },
            })
            // 今期の期間内の申請のみをフィルタリング
            if (currentGrantDate && nextGrantDate) {
              requests = allRejectedRequests.filter((req) => {
                const reqStartDate = new Date(req.startDate)
                const reqEndDate = new Date(req.endDate)
                // 申請の開始日または終了日が今期の期間内にあるかチェック
                return (reqStartDate >= currentGrantDate! && reqStartDate < nextGrantDate!) ||
                       (reqEndDate >= currentGrantDate! && reqEndDate < nextGrantDate!) ||
                       (reqStartDate <= currentGrantDate! && reqEndDate >= nextGrantDate!) // 期間をまたぐ申請も含む
              })
            } else {
              requests = []
            }
          } else if (view === "pending") {
            // 承認待ち画面の場合、承認待ちの申請を取得
            const allPendingRequests = await prisma.timeOffRequest.findMany({
              where: { employeeId: e.id, status: "PENDING" },
              orderBy: { createdAt: "desc" },
            })
            requests = allPendingRequests
          } else {
            // 全社員画面の場合、最新の申請のみ
            const allPendingRequests = await prisma.timeOffRequest.findMany({
              where: { employeeId: e.id, status: "PENDING" },
              orderBy: { createdAt: "desc" },
            })
            requests = allPendingRequests.length > 0 ? [allPendingRequests[0]] : []
          }
        } catch {}

        // アラート判定（5日消化義務アラート）
        // 次回付与日まで3ヶ月をきっていて、かつ設定された日数消化義務未達成の社員
        const minGrantDaysForAlert = cfg.alert?.minGrantDaysForAlert ?? 10 // 設定ファイルから読み込み、デフォルトは10日
        const threeMonthsInMs = 3 * 30 * 24 * 60 * 60 * 1000 // 3ヶ月（簡易計算）
        let isAlert = false
        // 1回の付与日数がminGrantDaysForAlert以上の社員のみがアラート対象
        if (latestGrantDays >= minGrantDaysForAlert && used < minGrantDaysForAlert && nextGrantDate) {
          const today = new Date()
          const diffMs = nextGrantDate.getTime() - today.getTime()
          const isWithinThreeMonths = diffMs < threeMonthsInMs
          isAlert = isWithinThreeMonths
        }
        
        // フィルタリング条件に応じて社員をフィルタリング
        let shouldInclude = true
        
        if (statusFilter === "PENDING") {
          // 承認待ち: 承認待ちの申請がある社員のみ
          shouldInclude = requests.length > 0
        } else if (statusFilter === "APPROVED" && monthFilter) {
          // 今月承認済み: 今月承認済みの申請がある社員のみ
          shouldInclude = requests.length > 0
        } else if (statusFilter === "REJECTED") {
          // 却下: 却下された申請がある社員のみ
          shouldInclude = requests.length > 0
        } else if (alertsFilter) {
          // アラート: アラート対象の社員のみ
          shouldInclude = isAlert
        } else if (view === "pending") {
          // 承認待ち画面: 承認待ちの申請がある社員のみ
          shouldInclude = requests.length > 0
        }
        
        // フィルタリング条件に合わない場合は空配列を返す
        if (!shouldInclude) {
          return []
        }
        
        // 計算式: 総付与数 - 取得済み - 申請中 = 残り有給日数
        // 総付与数が0の場合は、残日数 + 取得済み + 申請中で逆算（フォールバック）
        const calculatedRemaining = granted > 0 
          ? Math.max(0, granted - used - pending) 
          : Math.max(0, remaining - pending)
        
        // 「承認待ち」画面では各申請ごとにカードを返す、「全社員」画面では社員ごとに1カードのみ
        if (view === "pending" || statusFilter === "PENDING") {
          // 「承認待ち」画面では申請がある場合のみカードを返す
          if (requests.length > 0) {
            // 各申請ごとにカードを生成
            return requests.map((req) => ({
              id: `${e.id}_${req.id}`, // ユニークID
              employeeId: e.id, // 元の社員IDを保持
              name: e.name,
              employee: e.name, // 表示用
              employeeNumber: e.employeeNumber || null,
              joinDate: e.joinDate?.toISOString(),
              employeeType: e.employeeType || null,
              department: e.department || null,
              position: e.position || null,
              organization: e.organization || null,
              employeeStatus: e.status || null,
              showInOrgChart: e.showInOrgChart || null,
              vacationPattern: e.vacationPattern || null,
              weeklyPattern: e.weeklyPattern || null,
              avatar: e.avatar || null, // アバター画像URL
              remaining: calculatedRemaining,
              used,
              pending,
              granted: granted > 0 ? granted : (used + pending + calculatedRemaining),
              nextGrantDate: nextGrantDate ? nextGrantDate.toISOString().slice(0, 10) : null,
              nextGrantDays: nextGrantDays,
              latestGrantDays: latestGrantDays, // 最新の付与日での付与日数（5日消化義務アラート判定用）
              requestId: req.id,
              status: "pending",
              startDate: req.startDate?.toISOString()?.slice(0, 10),
              endDate: req.endDate?.toISOString()?.slice(0, 10),
              days: Number(req.totalDays || 0),
              reason: req.reason || undefined,
            }))
          } else {
            // 申請がない場合は空配列を返す
            return []
          }
        } else {
          // 「全社員」画面または承認済み/却下画面では社員ごとに1カードのみ（最新の申請情報を表示）
          const latestRequest = requests.length > 0 ? requests[0] : null
          
          // 承認済みや却下の場合、申請情報を追加
          let requestStatus: string | undefined = undefined
          let requestStartDate: string | undefined = undefined
          let requestEndDate: string | undefined = undefined
          let requestDays: number | undefined = undefined
          let requestReason: string | undefined = undefined
          
          if (statusFilter === "APPROVED" && latestRequest) {
            requestStatus = "approved"
            requestStartDate = latestRequest.startDate?.toISOString()?.slice(0, 10)
            requestEndDate = latestRequest.endDate?.toISOString()?.slice(0, 10)
            requestDays = Number(latestRequest.totalDays || 0)
            requestReason = latestRequest.reason || undefined
          } else if (statusFilter === "REJECTED" && latestRequest) {
            requestStatus = "rejected"
            requestStartDate = latestRequest.startDate?.toISOString()?.slice(0, 10)
            requestEndDate = latestRequest.endDate?.toISOString()?.slice(0, 10)
            requestDays = Number(latestRequest.totalDays || 0)
            requestReason = latestRequest.reason || undefined
          } else if (latestRequest) {
            requestStatus = "pending"
            requestStartDate = latestRequest.startDate?.toISOString()?.slice(0, 10)
            requestEndDate = latestRequest.endDate?.toISOString()?.slice(0, 10)
            requestDays = Number(latestRequest.totalDays || 0)
            requestReason = latestRequest.reason || undefined
          }
          
          return {
            id: e.id,
            employeeId: e.id, // 社員IDを明示的に設定（承認済み、却下、アラートの場合）
            name: e.name,
            employee: e.name, // 表示用
            employeeNumber: e.employeeNumber || null,
            joinDate: e.joinDate?.toISOString(),
            employeeType: e.employeeType || null,
            department: e.department || null,
            position: e.position || null,
            organization: e.organization || null,
            employeeStatus: e.status || null,
            showInOrgChart: e.showInOrgChart || null,
            vacationPattern: e.vacationPattern || null,
            weeklyPattern: e.weeklyPattern || null,
            avatar: e.avatar || null, // アバター画像URL
            remaining: calculatedRemaining,
            used,
            pending,
            granted: granted > 0 ? granted : (used + pending + calculatedRemaining),
            nextGrantDate: nextGrantDate ? nextGrantDate.toISOString().slice(0, 10) : null,
            nextGrantDays: nextGrantDays,
            latestGrantDays: latestGrantDays, // 最新の付与日での付与日数（5日消化義務アラート判定用）
            requestId: latestRequest?.id || undefined,
            status: requestStatus,
            startDate: requestStartDate,
            endDate: requestEndDate,
            days: requestDays,
            reason: requestReason,
            pendingDays: statusFilter === "PENDING" ? pending : undefined,
          }
        }
      })
    )

    // 「承認待ち」画面では配列が返されるのでフラット化、「全社員」画面ではそのまま
    const results = resultsArrays.flat()

    return NextResponse.json({ employees: results })
  } catch (error: any) {
    console.error("GET /api/vacation/admin/applicants error", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    
    // 社員情報だけでも返す（統計データは0）
    try {
      let employees
      try {
        employees = await prisma.employee.findMany({
          where: { 
            isInvisibleTop: false,
            status: { not: 'copy' }, // コピー社員を除外
            role: { not: 'admin' }, // 管理者権限は除外
            employeeType: {
              in: ['正社員', '契約社員', 'パートタイム', '派遣社員'], // 有給管理対象の雇用形態のみ
            },
          },
          select: {
            id: true,
            name: true,
            employeeNumber: true,
            joinDate: true,
            employeeType: true,
            department: true,
            position: true,
            organization: true,
            status: true,
            showInOrgChart: true,
            vacationPattern: true,
            weeklyPattern: true,
            role: true, // フィルタリング用にroleも取得
          },
          orderBy: { joinDate: "asc" },
        })
      } catch (schemaError: any) {
        // vacationPatternやweeklyPatternカラムが存在しない場合は、それらを除外して取得
        if (schemaError?.message?.includes('vacationPattern') || schemaError?.message?.includes('weeklyPattern')) {
          employees = await prisma.employee.findMany({
            where: { 
              isInvisibleTop: false,
              status: { not: 'copy' }, // コピー社員を除外
              role: { not: 'admin' }, // 管理者権限は除外
              employeeType: {
                in: ['正社員', '契約社員', 'パートタイム', '派遣社員'], // 有給管理対象の雇用形態のみ
              },
            },
            select: {
              id: true,
              name: true,
              joinDate: true,
              employeeType: true,
            },
            orderBy: { joinDate: "asc" },
          })
          // 後でvacationPatternとweeklyPatternをnullとして追加
          employees = employees.map((e: any) => ({
            ...e,
            vacationPattern: null,
            weeklyPattern: null,
          }))
        } else {
          throw schemaError
        }
      }
      
      const fallbackResults = employees.map(e => ({
        id: e.id,
        name: e.name,
        employeeNumber: e.employeeNumber || null,
        joinDate: e.joinDate?.toISOString(),
        employeeType: e.employeeType || null,
        department: e.department || null,
        position: e.position || null,
        organization: e.organization || null,
        employeeStatus: e.status || null,
        showInOrgChart: e.showInOrgChart || null,
        vacationPattern: e.vacationPattern || null,
        weeklyPattern: e.weeklyPattern || null,
        remaining: 0,
        used: 0,
        pending: 0,
        granted: 0,
      }))
      
      return NextResponse.json({ employees: fallbackResults })
    } catch (fallbackError: any) {
      console.error("フォールバック処理も失敗:", fallbackError)
      return NextResponse.json({ 
        error: "一覧取得に失敗しました",
        details: error?.message || 'Unknown error'
      }, { status: 500 })
    }
  }
}


