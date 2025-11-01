// 社員ごとの有給計算パターン設定API
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateVacationPattern, getVacationPatternFromWeeklyPattern, type VacationPattern } from "@/lib/vacation-pattern"

// GET: パターン値を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.employeeId },
      select: {
        id: true,
        name: true,
        employeeType: true,
        vacationPattern: true,
        weeklyPattern: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: "社員が見つかりません" }, { status: 404 })
    }

    return NextResponse.json({
      employeeId: employee.id,
      employeeName: employee.name,
      employeeType: employee.employeeType,
      vacationPattern: employee.vacationPattern,
      weeklyPattern: employee.weeklyPattern,
    })
  } catch (error) {
    console.error("GET /api/vacation/employee/[employeeId]/pattern error", error)
    return NextResponse.json({ error: "パターン値の取得に失敗しました" }, { status: 500 })
  }
}

// PUT: パターン値を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const body = await request.json()
    const { vacationPattern, weeklyPattern } = body

    // 社員情報を取得（vacationPatternが存在しない場合はエラーを回避）
    let employee: any
    try {
      employee = await prisma.employee.findUnique({
        where: { id: params.employeeId },
        select: {
          id: true,
          employeeType: true,
          vacationPattern: true,
          weeklyPattern: true,
        },
      })
    } catch (schemaError: any) {
      // vacationPatternカラムが存在しない場合は、それらを除外して取得
      if (schemaError?.code === 'P2022') {
        employee = await prisma.employee.findUnique({
          where: { id: params.employeeId },
          select: {
            id: true,
            employeeType: true,
          },
        })
        employee = employee ? {
          ...employee,
          vacationPattern: null,
          weeklyPattern: null,
        } : null
      } else {
        throw schemaError
      }
    }

    if (!employee) {
      return NextResponse.json({ error: "社員が見つかりません" }, { status: 404 })
    }

    // パターン値の決定
    let pattern: VacationPattern | null = null
    if (vacationPattern) {
      pattern = vacationPattern as VacationPattern
    } else if (weeklyPattern) {
      pattern = getVacationPatternFromWeeklyPattern(weeklyPattern)
    }

    // バリデーション
    const validation = validateVacationPattern(employee.employeeType, pattern, weeklyPattern || employee.weeklyPattern)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 更新
    await prisma.employee.update({
      where: { id: params.employeeId },
      data: {
        vacationPattern: pattern,
        weeklyPattern: weeklyPattern !== undefined ? weeklyPattern : employee.weeklyPattern,
      },
    })

    // 有給計算パターンが設定された場合、自動でロットを生成
    if (pattern) {
      try {
        const { generateGrantLotsForEmployee } = await import('@/lib/vacation-lot-generator')
        const today = new Date()
        const { generated, updated } = await generateGrantLotsForEmployee(params.employeeId, today)
        console.log(`[有給管理] 社員 ${params.employeeId} のロット自動生成完了: 生成=${generated}, 更新=${updated}`)
        return NextResponse.json({ 
          success: true, 
          vacationPattern: pattern,
          grantLots: { generated, updated }
        })
      } catch (grantError: any) {
        console.error(`[有給管理] 社員 ${params.employeeId} のロット自動生成エラー（無視）:`, grantError?.message || grantError)
        // ロット生成エラーは警告のみで、パターン更新自体は成功とする
        return NextResponse.json({ 
          success: true, 
          vacationPattern: pattern,
          grantLotsError: grantError?.message || 'ロット生成エラー'
        })
      }
    }

    return NextResponse.json({ success: true, vacationPattern: pattern })
  } catch (error) {
    console.error("PUT /api/vacation/employee/[employeeId]/pattern error", error)
    return NextResponse.json({ error: "パターン値の更新に失敗しました" }, { status: 500 })
  }
}

