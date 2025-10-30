import { NextRequest, NextResponse } from "next/server"
import { commitVacationRequest } from "@/lib/vacation-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, startDate, endDate, usedDays, reason } = body
    if (!employeeId || !startDate || !endDate || !usedDays) {
      return NextResponse.json({ error: "invalid input" }, { status: 400 })
    }
    const req = await commitVacationRequest({
      employeeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usedDays: Number(usedDays),
      reason,
    })
    return NextResponse.json(req)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 })
  }
}


