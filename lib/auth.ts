import { NextRequest } from "next/server"

/**
 * 認証ヘッダーを取得するヘルパー関数
 * リクエストから認証情報を抽出
 */
export function getAuthHeaders(request: NextRequest): { userId: string | null } {
  // x-employee-idヘッダーからユーザーIDを取得
  const userId = request.headers.get("x-employee-id")

  return {
    userId,
  }
}













