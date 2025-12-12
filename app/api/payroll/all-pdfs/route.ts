import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 給与or請求管理「全員分」PDF一覧取得API
 *
 * - 対象: cron `workclock-monthly-pdf-all` によって自動生成されたPDF
 * - 絞り込み: ?year=YYYY&month=M を指定した場合、その対象月のフォルダのみを返す
 *   - フォルダ名: `全員分/{YYYY}年{M}月`
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')

    const ownerEmployeeId = process.env.PAYROLL_ALL_EMPLOYEE_ID
    if (!ownerEmployeeId) {
      console.error('[GET /api/payroll/all-pdfs] PAYROLL_ALL_EMPLOYEE_ID が未設定です')
      return NextResponse.json(
        {
          success: false,
          error: 'PAYROLL_ALL_EMPLOYEE_ID is not configured',
        },
        { status: 500 }
      )
    }

    let folderName: string | undefined
    if (yearParam && monthParam) {
      const year = Number(yearParam)
      const month = Number(monthParam)

      if (!year || !month) {
        return NextResponse.json(
          {
            success: false,
            error: 'year または month の指定が不正です',
          },
          { status: 400 }
        )
      }

      const targetMonthLabel = `${year}年${month}月`
      folderName = `全員分/${targetMonthLabel}`
    }

    const where: any = {
      employeeId: ownerEmployeeId,
      category: 'payroll',
    }

    if (folderName) {
      where.folderName = folderName
    } else {
      // 明示指定がない場合でも、「全員分/」配下のみ取得
      where.folderName = {
        startsWith: '全員分/',
      }
    }

    const files = await prisma.file.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      files,
    })
  } catch (error: any) {
    console.error('[GET /api/payroll/all-pdfs] エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: '全員分PDF一覧の取得に失敗しました',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}













