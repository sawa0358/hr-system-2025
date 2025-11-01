import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getNextGrantDate } from "@/lib/vacation-grant-lot"
import { loadAppConfig } from "@/lib/vacation-config"
import { chooseGrantDaysForEmployee } from "@/lib/vacation-grant-lot"

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

    // 社員ごとの統計を集計
    const today = new Date()
    const resultsArrays = await Promise.all(
      employees.map(async (e) => {
        let remaining = 0
        let granted = 0
        
        // まず新しいロットベースシステムを試す（テーブルが存在しない場合はスキップ）
        try {
          // 残日数: 失効していないロットの残日数の合計
          const activeLots = await prisma.grantLot.findMany({
            where: {
              employeeId: e.id,
              expiryDate: { gte: today },
              daysRemaining: { gt: 0 },
            },
            orderBy: { grantDate: 'desc' }, // 新しい付与日順
          })
          remaining = activeLots.reduce((sum, lot) => sum + Number(lot.daysRemaining), 0)
          // 0.5日単位で丸める
          remaining = Math.round(remaining * 2) / 2
          
          // 総付与数: 最新の付与基準日時点で有効だったロットの初期付与日数（daysGranted）の合計
          // これは「昨年残高日数 + 新付与日数」を意味し、消費前の値（1年間固定）
          // 計算式: 総付与数 - 取得済み - 申請中 = 残り有給日数
          if (activeLots.length > 0) {
            // grantDateでソート（新しい順）
            const sortedLots = [...activeLots].sort((a, b) => 
              new Date(b.grantDate).getTime() - new Date(a.grantDate).getTime()
            )
            const latestGrantDate = sortedLots[0].grantDate
            granted = sortedLots
              .filter(lot => new Date(lot.grantDate).getTime() <= new Date(latestGrantDate).getTime())
              .reduce((sum, lot) => sum + Number(lot.daysGranted), 0) // daysRemainingではなくdaysGrantedを使用
            // 0.5日単位で丸める
            granted = Math.round(granted * 2) / 2
          }
        } catch (lotError: any) {
          // テーブルが存在しない場合は無視（フォールバック処理へ）
          // PrismaエラーコードP2021は「テーブルが存在しない」を意味する
          if (lotError?.code !== 'P2021' && !lotError?.message?.includes('does not exist')) {
            // 予期しないエラーのみログに記録
            console.warn(`GrantLot取得エラー (employeeId: ${e.id}):`, lotError?.code, lotError?.message)
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

        let used = 0
        let pending = 0
        
        // 新しいシステムから取得を試す（テーブルが存在しない場合はスキップ）
        try {
          const consumptions = await prisma.consumption.findMany({
            where: { employeeId: e.id },
          })
          used = consumptions.reduce((sum, c) => sum + Number(c.daysUsed), 0)
          
          const pendingRequests = await prisma.timeOffRequest.findMany({
            where: { employeeId: e.id, status: "PENDING" },
            orderBy: { createdAt: "desc" },
          })
          pending = pendingRequests.reduce((sum, r) => sum + Number(r.totalDays ?? 0), 0)
        } catch (newSystemError: any) {
          // テーブルが存在しない場合は無視（フォールバック処理へ）
          // PrismaエラーコードP2021は「テーブルが存在しない」を意味する
          if (newSystemError?.code !== 'P2021' && !newSystemError?.message?.includes('does not exist')) {
            // 予期しないエラーのみログに記録
            console.warn(`新システム取得エラー (employeeId: ${e.id}):`, newSystemError?.code, newSystemError?.message)
          }
        }
        
        // 新システムでデータがない場合は旧システムを使用
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
        try {
          const cfg = await loadAppConfig(e.vacationPattern ? (e.configVersion || undefined) : undefined)
          if (e.vacationPattern && e.joinDate) {
            nextGrantDate = getNextGrantDate(e.joinDate, cfg, today)
            if (nextGrantDate) {
              // 次回付与日の勤続年数を計算
              const yearsSinceJoin = (nextGrantDate.getTime() - e.joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
              nextGrantDays = chooseGrantDaysForEmployee(e.vacationPattern, yearsSinceJoin, cfg)
            }
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
              remaining: calculatedRemaining,
              used,
              pending,
              granted: granted > 0 ? granted : (used + pending + calculatedRemaining),
              nextGrantDate: nextGrantDate ? nextGrantDate.toISOString().slice(0, 10) : null,
              nextGrantDays: nextGrantDays,
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
            remaining: calculatedRemaining,
            used,
            pending,
            granted: granted > 0 ? granted : (used + pending + calculatedRemaining),
            nextGrantDate: nextGrantDate ? nextGrantDate.toISOString().slice(0, 10) : null,
            nextGrantDays: nextGrantDays,
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


