export interface CreditPlan {
  id: string
  name: string
  price: number // VNĐ
  priceDisplay: string
  credits: number
  bonusCredits?: number
  tag?: string
  popular?: boolean
  description: string
  features: string[]
}

export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'plan_starter',
    name: 'Gói Trải Nghiệm',
    price: 49000,
    priceDisplay: '49.000 đ',
    credits: 60,
    description: 'Phù hợp học viên hoặc phụ huynh in vở luyện viết',
    features: [
      'Xuất 60 trang A4 trọn vẹn',
      'Định dạng Word .docx chuẩn A4',
      'Đầy đủ các kiểu font chữ',
    ],
  },
  {
    id: 'plan_teacher',
    name: 'Gói Giáo Viên',
    price: 99000,
    priceDisplay: '99.000 đ',
    credits: 150,
    bonusCredits: 30,
    popular: true,
    tag: 'Bán chạy nhất',
    description: 'Dành cho giáo viên dạy kèm và soạn bài cho lớp học',
    features: [
      'Tổng nhận 180 trang (Tặng 30 trang)',
      'Tự do chèn thương hiệu & tên GV',
      'Nạp file Word, Excel, PDF trích xuất chữ',
      'Không giới hạn thời hạn sử dụng',
    ],
  },
  {
    id: 'plan_center',
    name: 'Gói Trung Tâm',
    price: 199000,
    priceDisplay: '199.000 đ',
    credits: 400,
    bonusCredits: 100,
    tag: 'Tiết kiệm 45%',
    description: 'Dành cho trung tâm tiếng Trung in giáo trình số lượng lớn',
    features: [
      'Tổng nhận 500 trang (Tặng 100 trang)',
      'Chèn Logo, Slogan & Hotline trung tâm',
      'Xuất trọn bộ cả tập sách tới 1000 trang',
      'Hỗ trợ ưu tiên và cập nhật mẫu mới',
    ],
  },
]

export type PaymentMethodType = 'vietqr' | 'momo' | 'vnpay' | 'card'

export interface PaymentMethod {
  id: PaymentMethodType
  name: string
  icon: string
  badge?: string
  description: string
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'vietqr',
    name: 'Chuyển khoản VietQR',
    icon: '🏦',
    badge: 'Tự động 24/7',
    description: 'Quét mã qua mọi ứng dụng ngân hàng (Vietcombank, MB, Techcombank...)',
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    icon: '👛',
    badge: 'Phổ biến',
    description: 'Quét mã thanh toán trực tiếp từ ứng dụng ví MoMo',
  },
  {
    id: 'vnpay',
    name: 'VNPAY-QR',
    icon: '💳',
    description: 'Thanh toán qua cổng VNPAY hỗ trợ hơn 40 ngân hàng',
  },
  {
    id: 'card',
    name: 'Thẻ Quốc tế (Visa / Master)',
    icon: '🌐',
    description: 'Thanh toán tiện lợi bằng thẻ tín dụng hoặc ghi nợ quốc tế',
  },
]
