import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Khởi tạo Supabase client với Secret / Anon Key
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://umyhxqcasnvnkkycnose.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVteWh4cWNhc252bmtreWNub3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NzM1MjcsImV4cCI6MjEwNzM0OTUyN30.DYsD9zVcSMY8F75VitPLV4RrXzfoWYowSVAQQ8-ujP4'

const supabase = createClient(supabaseUrl, supabaseKey)

// Bảng quy đổi gói nạp dựa trên số tiền (VNĐ)
const PLAN_CREDITS_MAP: Record<number, number> = {
  49000: 300,  // Gói Trải Nghiệm (250 + 50)
  99000: 1500, // Gói Giáo Viên (1200 + 300)
  199000: 4000 // Gói Trung Tâm (3200 + 800)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Chỉ nhận HTTP POST từ SePay Webhook
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' })
  }

  try {
    const payload = req.body || {}

    // Payload từ SePay:
    // {
    //   "id": 92704,
    //   "gateway": "VPBank",
    //   "accountNumber": "0969246788",
    //   "code": "HT123456",
    //   "content": "HT123456 chuyen tien",
    //   "transferType": "in",
    //   "transferAmount": 99000,
    //   "referenceCode": "FT24012345678"
    // }

    const transferType = payload.transferType
    const transferAmount = Number(payload.transferAmount || 0)
    const content = String(payload.content || '')
    const sepayCode = String(payload.code || '')
    const sepayTransactionId = String(payload.id || payload.referenceCode || '')

    // Chỉ xử lý giao dịch tiền vào (transferType === 'in')
    if (transferType !== 'in' && transferType !== undefined) {
      return res.status(200).json({ success: true, message: 'Ignored non-in transfer' })
    }

    // Trích xuất mã giao dịch dạng HTxxxxxx từ content hoặc code
    const fullText = `${sepayCode} ${content}`.toUpperCase()
    const match = fullText.match(/HT\d{6}/)
    const orderCode = match ? match[0] : null

    if (!orderCode) {
      console.warn('SePay Webhook: Không tìm thấy mã đơn hàng HTxxxxxx trong nội dung:', content)
      return res.status(200).json({ success: true, message: 'No HT order code detected' })
    }

    // 1. Kiểm tra xem mã đơn hàng HTxxxxxx đã tồn tại trong bảng transactions chưa
    const { data: existingTx, error: findErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_code', orderCode)
      .maybeSingle()

    if (findErr) {
      console.error('Lỗi truy vấn transactions:', findErr)
    }

    // Nếu giao dịch đã được xử lý thành công trước đó (tránh cộng 2 lần)
    if (existingTx && existingTx.status === 'completed') {
      return res.status(200).json({ success: true, message: 'Order already completed' })
    }

    // Xác định số credits cần cộng:
    // Ưu tiên lấy từ bản ghi transaction đã lưu, nếu chưa có thì tính từ transferAmount
    let creditsToAdd = existingTx?.credits_added
    if (!creditsToAdd) {
      creditsToAdd = PLAN_CREDITS_MAP[transferAmount] || Math.floor(transferAmount / 100)
    }

    const userId = existingTx?.user_id

    // 2. Cập nhật trạng thái giao dịch thành 'completed'
    if (existingTx) {
      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          amount: transferAmount || existingTx.amount,
          credits_added: creditsToAdd,
          sepay_transaction_id: sepayTransactionId,
          completed_at: new Date().toISOString()
        })
        .eq('order_code', orderCode)
    } else {
      // Nếu chưa có transaction trước đó (khách quét QR trực tiếp), tự tạo bản ghi completed
      await supabase
        .from('transactions')
        .insert({
          order_code: orderCode,
          plan_id: 'sepay_plan',
          amount: transferAmount,
          credits_added: creditsToAdd,
          status: 'completed',
          payment_method: 'vietqr_sepay',
          sepay_transaction_id: sepayTransactionId,
          completed_at: new Date().toISOString()
        })
    }

    // 3. Nếu giao dịch gắn với user_id của Supabase, cộng trực tiếp credits vào profiles
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (profile) {
        const newCredits = (profile.credits || 0) + creditsToAdd
        await supabase
          .from('profiles')
          .update({
            credits: newCredits,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      orderCode,
      creditsAdded: creditsToAdd
    })
  } catch (err: any) {
    console.error('Lỗi xử lý SePay Webhook:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
