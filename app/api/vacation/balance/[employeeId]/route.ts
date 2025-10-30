import { NextRequest, NextResponse } from "next/server"
import { getVacationBalanceSummary } from "@/lib/vacation-service"

export async function GET(
  _request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const data = await getVacationBalanceSummary(params.employeeId)
    return NextResponse.json({
      totalRemaining: data.totalRemaining,
      balances: data.balances,
      nextGrantDate: data.nextGrantDate,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 })
  }
}


