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
  // Tài khoản mới đăng ký được tặng 15 credits
  localStorage.setItem(`${USER_CREDITS_PREFIX}${userId}`, '15')
  return 15
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

// Đăng ký tài khoản Email bằng Supabase
export async function signUpWithEmail(email: string, password: string, name?: string): Promise<{ user?: AuthUser; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0],
          name: name || email.split('@')[0],
        },
      },
    })
    if (error) return { error: error.message }
    if (data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        name: name || email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name || email.split('@')[0]}`,
        role: 'user',
      }
      loginUser(authUser)
      return { user: authUser }
    }
  }

  // Fallback
  const cleanEmail = email.trim().toLowerCase()
  const displayName = name?.trim() || cleanEmail.split('@')[0]
  const user: AuthUser = {
    id: 'user_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10),
    name: displayName,
    email: cleanEmail,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`,
    role: 'user',
  }
  loginUser(user)
  return { user }
}

// Đăng nhập tài khoản Email bằng Supabase
export async function signInWithEmail(email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) return { error: error.message }
    if (data.user) {
      const meta = data.user.user_metadata || {}
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        name: meta.full_name || meta.name || email.split('@')[0],
        avatar: meta.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${email.split('@')[0]}`,
        role: 'user',
      }
      loginUser(authUser)
      return { user: authUser }
    }
  }

  // Fallback
  const cleanEmail = email.trim().toLowerCase()
  const displayName = cleanEmail.split('@')[0]
  const user: AuthUser = {
    id: 'user_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10),
    name: displayName,
    email: cleanEmail,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`,
    role: 'user',
  }
  loginUser(user)
  return { user }
}
