import { NextRequest, NextResponse } from "next/server"
import { recalcEmployeeBalances } from "@/lib/vacation-service"

export async function POST(
  _request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const result = await recalcEmployeeBalances(params.employeeId)
    return NextResponse.json({ success: true, ...result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? "failed" }, { status: 500 })
  }
}


