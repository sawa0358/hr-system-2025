import { NextRequest, NextResponse } from "next/server"
import {
  ensureViewPermission,
  fetchConvenienceTree,
  resolveConvenienceUser,
} from "@/lib/convenience-service"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-employee-id")
    const resolved = ensureViewPermission(await resolveConvenienceUser(userId))

    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error.message }, { status: resolved.error.status })
    }

    const searchParams = request.nextUrl.searchParams
    const includeArchived = searchParams.get("includeArchived") === "true"
    const tenantParam = searchParams.get("tenantId")

    const tenantId =
      tenantParam === null
        ? undefined
        : tenantParam.trim().length === 0 || tenantParam.toLowerCase() === "null"
        ? null
        : tenantParam

    const data = await fetchConvenienceTree({ includeArchived, tenantId })
    return NextResponse.json(data)
  } catch (error) {
    console.error("[convenience] GET failed:", error)
    return NextResponse.json({ error: "便利機能データの取得に失敗しました" }, { status: 500 })
  }
}

