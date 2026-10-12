import { supabase, isSupabaseConfigured } from './supabaseClient'

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  role?: 'user' | 'vip'
}

const AUTH_USER_KEY = 'han_tu_auth_user'
const USER_CREDITS_PREFIX = 'han_tu_credits_'

// 1. Lấy thông tin tài khoản hiện tại (Ưu tiên Supabase, fallback LocalStorage)
export function getCurrentUser(): AuthUser | null {
  const data = localStorage.getItem(AUTH_USER_KEY)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

// 2. Lấy số dư Credits thật từ đám mây Supabase
export async function fetchUserCreditsCloud(userId: string): Promise<number> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()
      if (!error && data) {
        // Lưu cache lại local
        localStorage.setItem(`${USER_CREDITS_PREFIX}${userId}`, data.credits.toString())
        return data.credits
      }
    } catch {
      // Bỏ qua lỗi mạng và dùng fallback
    }
  }

  // Fallback lấy từ LocalStorage
  return getUserCredits(userId)
}

// Lấy số dư Credits (đồng bộ nhanh từ LocalStorage)
export function getUserCredits(userId: string): number {
  const saved = localStorage.getItem(`${USER_CREDITS_PREFIX}${userId}`)
  if (saved !== null) {
    return parseInt(saved, 10)
  }
  // Tài khoản mới đăng ký được tặng 25 credits
  localStorage.setItem(`${USER_CREDITS_PREFIX}${userId}`, '25')
  return 25
}

// Lưu số dư Credits cho tài khoản (Cập nhật Local + Cloud nếu có)
export async function saveUserCredits(userId: string, amount: number): Promise<void> {
  localStorage.setItem(`${USER_CREDITS_PREFIX}${userId}`, amount.toString())

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('profiles')
        .update({ credits: amount, updated_at: new Date().toISOString() })
        .eq('id', userId)
    } catch {
      // Giữ cập nhật local
    }
  }
}

// Đăng nhập tài khoản
export function loginUser(user: AuthUser): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

// Đăng xuất tài khoản
export async function logoutUser(): Promise<void> {
  localStorage.removeItem(AUTH_USER_KEY)
  if (isSupabaseConfigured() && supabase) {
    await supabase.auth.signOut().catch(() => {})
  }
}

// Đăng nhập Google thật bằng Supabase OAuth
export async function signInWithGoogleOAuth(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { error: 'Chưa cấu hình Supabase URL & Key' }
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  })
  if (error) return { error: error.message }
  return {}
}
