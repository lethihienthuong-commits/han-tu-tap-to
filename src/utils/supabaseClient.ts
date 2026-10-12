import { createClient } from '@supabase/supabase-js'

// Lấy biến môi trường từ Vite (.env hoặc thiết lập trên hosting Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Khởi tạo Supabase client nếu đã có config, nếu chưa có sẽ fallback an toàn
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = (): boolean => {
  return !!supabase
}
