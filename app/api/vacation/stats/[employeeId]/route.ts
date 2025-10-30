import { NextRequest, NextResponse } from "next/server"
import { getEmployeeVacationStats } from "@/lib/vacation-service"

export async function GET(
  _request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const stats = await getEmployeeVacationStats(params.employeeId)
    return NextResponse.json(stats)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 })
  }
}


