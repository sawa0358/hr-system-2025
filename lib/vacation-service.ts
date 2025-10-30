import { prisma } from "@/lib/prisma"

export async function getVacationBalancesLIFO(employeeId: string) {
  return prisma.vacationBalance.findMany({
    where: { employeeId, remainingDays: { gt: 0 }, isExpired: false },
    orderBy: { grantDate: "desc" },
  })
}

export async function calculateServiceYears(hireDate: Date, targetDate: Date): Promise<number> {
  const diffMs = targetDate.getTime() - hireDate.getTime()
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25)
  return Math.floor(years * 10) / 10
}

export function calculateServiceDays(hireDate: Date, targetDate: Date): number {
  const diffMs = targetDate.getTime() - hireDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export async function getNextGrantDate(employeeId: string): Promise<Date | null> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
  if (!employee) return null
  const settings = await prisma.vacationSettings.findFirst()
  if (!settings) return null
  const base = new Date(employee.joinDate)
  const initial = new Date(base)
  initial.setMonth(initial.getMonth() + settings.initialGrantPeriod)
  const today = new Date()
  if (initial > today) return initial
  // 付与間隔ごとに次回を進める
  const next = new Date(initial)
  while (next <= today) {
    next.setMonth(next.getMonth() + settings.grantPeriod)
  }
  return next
}

export async function getVacationBalanceSummary(employeeId: string) {
  const balances = await getVacationBalancesLIFO(employeeId)
  const totalRemaining = balances.reduce((s, b) => s + Number(b.remainingDays), 0)
  const nextGrantDate = await getNextGrantDate(employeeId)
  return { totalRemaining, balances, nextGrantDate }
}

export async function calculatePartTimeGrantDaysByServiceDays(
  serviceDays: number,
  workDaysPerWeek: number
): Promise<number> {
  const row = await prisma.partTimeGrantSchedule.findFirst({
    where: { serviceDays: { lte: serviceDays }, workDaysPerWeek },
    orderBy: { serviceDays: "desc" },
  })
  return row?.grantDays ?? 0
}

export async function calculateFullTimeGrantDaysByServiceYears(
  serviceYears: number
): Promise<number> {
  const row = await prisma.vacationGrantSchedule.findFirst({
    where: { serviceYears: { lte: serviceYears } },
    orderBy: { serviceYears: "desc" },
  })
  return row?.fullTimeGrantDays ?? 0
}

export function calculateExpiryDate(grantDate: Date, validityYears: number): Date {
  const d = new Date(grantDate)
  d.setFullYear(d.getFullYear() + validityYears)
  return d
}

export async function getEmployeeVacationStats(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
  if (!employee) throw new Error("employee not found")
  const balances = await prisma.vacationBalance.findMany({
    where: { employeeId },
    orderBy: { grantDate: "desc" },
  })
  const totalGranted = balances.reduce((s, b) => s + Number(b.grantDays), 0)
  const totalRemaining = balances.reduce((s, b) => s + Number(b.remainingDays), 0)
  const used = totalGranted - totalRemaining
  const pendingAgg = await prisma.vacationRequest.aggregate({
    where: { employeeId, status: "PENDING" },
    _sum: { usedDays: true },
  })
  const pending = Number(pendingAgg._sum.usedDays ?? 0)
  const nextGrantDate = await getNextGrantDate(employeeId)
  return {
    employeeId,
    joinDate: employee.joinDate,
    totalGranted,
    totalRemaining,
    used,
    pending,
    nextGrantDate,
  }
}

export async function recalcEmployeeBalances(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
  if (!employee) throw new Error("employee not found")
  const settings = await prisma.vacationSettings.findFirst()
  if (!settings) throw new Error("vacation settings not found")

  const join = new Date(employee.joinDate)
  const initial = new Date(join)
  initial.setMonth(initial.getMonth() + settings.initialGrantPeriod)
  const today = new Date()
  if (initial > today) return { generated: 0, updated: 0 }

  let cursor = new Date(initial)
  let generated = 0
  let updated = 0

  while (cursor <= today) {
    // 付与日ごとの付与日数を計算
    const serviceYears = await calculateServiceYears(join, cursor)

    // 正社員前提（既存EmployeeはemployeeTypeが文字列のため型断定しない）
    const grantDays = await calculateFullTimeGrantDaysByServiceYears(serviceYears)

    const expiry = calculateExpiryDate(cursor, settings.validityYears)

    const existing = await prisma.vacationBalance.findFirst({
      where: { employeeId, grantDate: cursor },
    })

    if (!existing) {
      await prisma.vacationBalance.create({
        data: {
          employeeId,
          grantDate: cursor,
          grantDays,
          remainingDays: grantDays, // 後で使用実績で減算
          expiryDate: expiry,
          isExpired: expiry < today,
        },
      })
      generated++
    } else {
      const updatedRow = await prisma.vacationBalance.update({
        where: { id: existing.id },
        data: {
          grantDays,
          expiryDate: expiry,
          isExpired: expiry < today,
        },
      })
      updated++
    }

    // 使用実績で残数を矯正
    const bal = await prisma.vacationBalance.findFirst({
      where: { employeeId, grantDate: cursor },
    })
    if (bal) {
      const used = await prisma.vacationUsage.aggregate({
        where: { balanceId: bal.id },
        _sum: { usedDays: true },
      })
      const usedDays = Number(used._sum.usedDays ?? 0)
      const newRemaining = Math.max(0, Number(bal.grantDays) - usedDays)
      await prisma.vacationBalance.update({
        where: { id: bal.id },
        data: { remainingDays: newRemaining },
      })
    }

    // 次の付与日へ
    cursor = new Date(cursor)
    cursor.setMonth(cursor.getMonth() + settings.grantPeriod)
  }

  return { generated, updated }
}

export async function processVacationUsage(employeeId: string, requestedDays: number) {
  const balances = await getVacationBalancesLIFO(employeeId)
  let remaining = requestedDays
  const usageDetails: { balanceId: string; usedDays: number }[] = []
  for (const bal of balances) {
    if (remaining <= 0) break
    const useDays = Math.min(remaining, Number(bal.remainingDays))
    if (useDays > 0) {
      usageDetails.push({ balanceId: bal.id, usedDays: useDays })
      remaining -= useDays
    }
  }
  if (remaining > 0) return { ok: false as const, usageDetails: [] }
  return { ok: true as const, usageDetails }
}

export async function commitVacationRequest(params: {
  employeeId: string
  startDate: Date
  endDate: Date
  usedDays: number
  reason?: string
}) {
  const usagePlan = await processVacationUsage(params.employeeId, params.usedDays)
  if (!usagePlan.ok) throw new Error("残高不足のため申請できません")
  return prisma.$transaction(async (tx) => {
    const request = await tx.vacationRequest.create({
      data: {
        employeeId: params.employeeId,
        startDate: params.startDate,
        endDate: params.endDate,
        usedDays: params.usedDays,
        reason: params.reason ?? null,
        status: "PENDING",
      },
    })
    for (const u of usagePlan.usageDetails) {
      await tx.vacationUsage.create({
        data: { requestId: request.id, balanceId: u.balanceId, usedDays: u.usedDays },
      })
      await tx.vacationBalance.update({
        where: { id: u.balanceId },
        data: { remainingDays: { decrement: u.usedDays } },
      })
    }
    return request
  })
}


