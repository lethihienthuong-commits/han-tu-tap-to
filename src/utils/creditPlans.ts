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
    credits: 250,
    bonusCredits: 50,
    tag: '~163 đ / trang',
    description: 'Chi phí cực rẻ cho học viên hoặc phụ huynh in vở luyện viết',
    features: [
      'Tổng nhận 300 trang A4 (Tặng thêm 50 trang)',
      'Giá chỉ ~163 đồng cho mỗi trang vở chuẩn A4',
      'Định dạng Word .docx chất lượng cao',
      'Đầy đủ các kiểu font chữ & Điền Tự Cách',
    ],
  },
  {
    id: 'plan_teacher',
    name: 'Gói Giáo Viên',
    price: 99000,
    priceDisplay: '99.000 đ',
    credits: 1200,
    bonusCredits: 300,
    popular: true,
    tag: 'Bán chạy nhất • ~66 đ / trang',
    description: 'Dành cho giáo viên dạy kèm và soạn bài cho lớp học',
    features: [
      'Tổng nhận 1.500 trang A4 (Tặng 300 trang)',
      'Giá siêu rẻ chỉ ~66 đồng / trang in',
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
    credits: 3200,
    bonusCredits: 800,
    tag: 'Siêu tiết kiệm • ~49 đ / trang',
    description: 'Dành cho trung tâm tiếng Trung in giáo trình số lượng lớn',
    features: [
      'Tổng nhận tới 4.000 trang A4 (Tặng 800 trang)',
      'Giá chạm đáy chỉ ~49 đồng / trang in',
      'Chèn Logo, Slogan & Hotline trung tâm',
      'Xuất trọn bộ nhiều tập sách lớn tới 1000 trang/file',
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
