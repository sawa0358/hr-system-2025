import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'hr_session'
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30日

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    console.warn('[Session] SESSION_SECRET 環境変数が未設定です。開発用のデフォルトキーを使用します。本番環境では必ず設定してください。')
    return new TextEncoder().encode('hr-system-dev-secret-key-change-in-production')
  }
  return new TextEncoder().encode(secret)
}

export interface SessionPayload {
  id: string
  name: string
  role: string
  email?: string | null
  department?: string | null
  position?: string | null
  organization?: string | null
  employeeType?: string | null
  isPersonnelEvaluationTarget?: boolean
  personnelEvaluationTeamId?: string | null
}

export async function createSessionToken(user: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecretKey())
  return token
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export function getSessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}${secure}`
}

export function getClearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

export function getTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(';').map(c => c.trim())
  for (const cookie of cookies) {
    if (cookie.startsWith(`${COOKIE_NAME}=`)) {
      return cookie.substring(COOKIE_NAME.length + 1)
    }
  }
  return null
}

export { COOKIE_NAME }
