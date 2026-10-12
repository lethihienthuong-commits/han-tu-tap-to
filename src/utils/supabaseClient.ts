import { createClient } from '@supabase/supabase-js'

// Lấy biến môi trường từ Vite (.env hoặc thiết lập trên hosting Vercel), fallback cấu hình trực tiếp của dự án
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://umyhxqcasnvnkkycnose.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVteWh4cWNhc252bmtreWNub3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NzM1MjcsImV4cCI6MjEwNzM0OTUyN30.DYsD9zVcSMY8F75VitPLV4RrXzfoWYowSVAQQ8-ujP4'

// Khởi tạo Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = (): boolean => {
  return !!supabase
}
