import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'hr_session'

// 認証不要の公開エンドポイント
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/version',
]

// パスのプレフィックスで認証不要なもの（cronは独自トークン認証を持つ）
const PUBLIC_API_PREFIXES = [
  '/api/cron/',
]

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    return new TextEncoder().encode('hr-system-dev-secret-key-change-in-production')
  }
  return new TextEncoder().encode(secret)
}

function isPublicApiPath(pathname: string): boolean {
  if (PUBLIC_API_PATHS.includes(pathname)) return true
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API以外のリクエストはそのまま通過（ページはクライアントRouteGuardで保護）
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // 公開APIはそのまま通過
  if (isPublicApiPath(pathname)) {
    return NextResponse.next()
  }

  // Cookie からJWTトークンを取得
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    console.log(`[Middleware] 401 no-token: ${pathname}, cookies: ${request.cookies.getAll().map(c => c.name).join(',')}`)
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    )
  }

  // JWT検証
  try {
    const { payload } = await jwtVerify(token, getSecretKey())

    // 信頼できるヘッダーを注入して次のハンドラに渡す
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-employee-id', payload.id as string)
    requestHeaders.set('x-employee-role', payload.role as string)
    requestHeaders.set('x-employee-name', payload.name as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (err) {
    console.log(`[Middleware] 401 jwt-invalid: ${pathname}, tokenLen=${token.length}, err=${err instanceof Error ? err.message : err}`)
    return NextResponse.json(
      { error: '認証が無効です。再ログインしてください。' },
      { status: 401 }
    )
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
