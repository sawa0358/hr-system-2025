import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, startDate, endDate, usedDays, reason } = body || {}

    if (!employeeId || !startDate || !endDate || !usedDays) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 })
    }

    // 社員存在チェック
    const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } })
    if (!employee) {
      return NextResponse.json({ error: "社員が見つかりません" }, { status: 404 })
    }

    const created = await prisma.vacationRequest.create({
      data: {
        employeeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usedDays: Number(usedDays),
        reason: reason ?? null,
        status: "PENDING",
      },
    })

    return NextResponse.json({ request: created }, { status: 201 })
  } catch (error) {
    console.error("POST /api/vacation/request error", error)
    return NextResponse.json({ error: "申請の作成に失敗しました" }, { status: 500 })
  }
}

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


