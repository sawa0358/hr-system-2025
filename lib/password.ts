import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS)
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  // bcryptハッシュ（$2a$, $2b$, $2y$で始まる）の場合はbcrypt.compareで検証
  if (hashedPassword.startsWith('$2')) {
    return bcrypt.compare(plainPassword, hashedPassword)
  }
  // 平文パスワード（移行期間中の互換性）の場合は直接比較
  return plainPassword === hashedPassword
}

export function isPasswordHashed(password: string): boolean {
  return password.startsWith('$2')
}
