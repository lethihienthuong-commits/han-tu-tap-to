export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  role?: 'user' | 'vip'
}

const AUTH_USER_KEY = 'han_tu_auth_user'
const USER_CREDITS_PREFIX = 'han_tu_credits_'

// Lấy thông tin tài khoản hiện tại từ LocalStorage
export function getCurrentUser(): AuthUser | null {
  const data = localStorage.getItem(AUTH_USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

// Lấy số dư Credits của một tài khoản (tặng 25 credits khởi đầu cho tài khoản mới)
export function getUserCredits(userId: string): number {
  const saved = localStorage.getItem(`${USER_CREDITS_PREFIX}${userId}`)
  if (saved !== null) {
    return parseInt(saved, 10)
  }
  // Tài khoản mới đăng ký được tặng 25 credits
  localStorage.setItem(`${USER_CREDITS_PREFIX}${userId}`, '25')
  return 25
}

// Lưu số dư Credits cho tài khoản
export function saveUserCredits(userId: string, amount: number): void {
  localStorage.setItem(`${USER_CREDITS_PREFIX}${userId}`, amount.toString())
}

// Đăng nhập tài khoản
export function loginUser(user: AuthUser): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

// Đăng xuất tài khoản
export function logoutUser(): void {
  localStorage.removeItem(AUTH_USER_KEY)
}
