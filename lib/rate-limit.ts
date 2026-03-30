/**
 * シンプルなインメモリレート制限
 * IPアドレスごとに一定時間内の試行回数を制限する
 */
const attempts = new Map<string, { count: number; resetAt: number }>()

// 期限切れエントリを定期的にクリーンアップ（メモリリーク防止）
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of attempts) {
    if (now > value.resetAt) {
      attempts.delete(key)
    }
  }
}, 60 * 1000)

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): { allowed: boolean; remainingAttempts: number; retryAfterMs: number } {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remainingAttempts: maxAttempts - 1, retryAfterMs: 0 }
  }

  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: entry.resetAt - now
    }
  }

  entry.count++
  return { allowed: true, remainingAttempts: maxAttempts - entry.count, retryAfterMs: 0 }
}
