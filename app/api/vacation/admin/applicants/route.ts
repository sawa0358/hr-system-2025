import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNextGrantDate } from "@/lib/vacation-grant-lot"
import { loadAppConfig } from "@/lib/vacation-config"
import { chooseGrantDaysForEmployee, diffInYearsHalfStep } from "@/lib/vacation-grant-lot"
import { calculateRemainingDays, calculateUsedDays, calculatePendingDays, calculateTotalGranted, getNextGrantDateForEmployee } from "@/lib/vacation-stats"

// 管理者向け: 全社員の有給カード表示用データ
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get("view") || "all" // "pending" or "all"
    
    // 社員の基本情報取得（vacationPatternとweeklyPatternはオプショナル）
    let employees
    try {
      employees = await prisma.employee.findMany({
        where: { 
          isInvisibleTop: false,
          status: { not: 'copy' }, // コピー社員を除外
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

    // 全社員のUserSettingsを一括取得（avatar-text用）
    const employeeIds = employees.map(e => e.id)
    const userSettings = await prisma.userSettings.findMany({
      where: {
        employeeId: { in: employeeIds },
        key: 'avatar-text'
      },
      select: {
        employeeId: true,
        value: true
      }
    })
    // employeeIdをキーとするマップに変換
    const avatarTextMap = new Map<string, string>()
    userSettings.forEach(setting => {
      avatarTextMap.set(setting.employeeId, setting.value)
    })

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
        let nextGrantDays: number = 0
        // 最新の付与日での付与日数（5日消化義務アラート判定用）
        let latestGrantDays: number = 0
        try {
          nextGrantDate = await getNextGrantDateForEmployee(e.id)
          if (nextGrantDate && e.vacationPattern) {
            const cfg = await loadAppConfig(e.configVersion || undefined)
            // 次回付与日の勤続年数を計算（半年刻み）
            const yearsSinceJoin = diffInYearsHalfStep(new Date(e.joinDate), nextGrantDate)
            nextGrantDays = chooseGrantDaysForEmployee(e.vacationPattern, yearsSinceJoin, cfg)
          }
          
          // 最新の付与日での付与日数を取得（5日消化義務アラート判定用）
          const today = new Date()
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
        // 「承認待ち」画面では全ての申請、「全社員」画面では最新の申請のみ
        let requests: any[] = []
        try {
          const allPendingRequests = await prisma.timeOffRequest.findMany({
            where: { employeeId: e.id, status: "PENDING" },
            orderBy: { createdAt: "desc" },
          })
          // 「承認待ち」画面では全て、「全社員」画面では最新1件のみ
          requests = view === "pending" ? allPendingRequests : (allPendingRequests.length > 0 ? [allPendingRequests[0]] : [])
        } catch {}

        // 計算式: 総付与数 - 取得済み - 申請中 = 残り有給日数
        // 総付与数が0の場合は、残日数 + 取得済み + 申請中で逆算（フォールバック）
        const calculatedRemaining = granted > 0 
          ? Math.max(0, granted - used - pending) 
          : Math.max(0, remaining - pending)
        
        // 「承認待ち」画面では各申請ごとにカードを返す、「全社員」画面では社員ごとに1カードのみ
        if (view === "pending") {
          // 「承認待ち」画面では申請がある場合のみカードを返す
          if (requests.length > 0) {
            // 各申請ごとにカードを生成
            const avatarText = avatarTextMap.get(e.id) || null
            return requests.map((req) => ({
              id: `${e.id}_${req.id}`, // ユニークID
              employeeId: e.id, // 元の社員IDを保持
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
              avatarText: avatarText, // 画像テキスト（DBから取得）
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
          // 「全社員」画面では社員ごとに1カードのみ（最新の申請情報を表示）
          const latestRequest = requests.length > 0 ? requests[0] : null
          const avatarText = avatarTextMap.get(e.id) || null
          return {
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
            avatarText: avatarText, // 画像テキスト（DBから取得）
            remaining: calculatedRemaining,
            used,
            pending,
            granted: granted > 0 ? granted : (used + pending + calculatedRemaining),
            nextGrantDate: nextGrantDate ? nextGrantDate.toISOString().slice(0, 10) : null,
            nextGrantDays: nextGrantDays,
            latestGrantDays: latestGrantDays, // 最新の付与日での付与日数（5日消化義務アラート判定用）
            requestId: latestRequest?.id || undefined,
            status: latestRequest ? "pending" : undefined,
            startDate: latestRequest?.startDate?.toISOString()?.slice(0, 10),
            endDate: latestRequest?.endDate?.toISOString()?.slice(0, 10),
            days: latestRequest ? Number(latestRequest.totalDays || 0) : undefined,
            reason: latestRequest?.reason || undefined,
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
      
      // フォールバック時もUserSettingsからavatar-textを取得
      const employeeIds = employees.map(e => e.id)
      const fallbackUserSettings = await prisma.userSettings.findMany({
        where: {
          employeeId: { in: employeeIds },
          key: 'avatar-text'
        },
        select: {
          employeeId: true,
          value: true
        }
      }).catch(() => [])
      const fallbackAvatarTextMap = new Map<string, string>()
      fallbackUserSettings.forEach(setting => {
        fallbackAvatarTextMap.set(setting.employeeId, setting.value)
      })
      
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
        avatarText: fallbackAvatarTextMap.get(e.id) || null, // 画像テキスト（DBから取得）
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


