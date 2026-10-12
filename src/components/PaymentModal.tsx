import React, { useState } from 'react'
import {
  CREDIT_PLANS,
  PAYMENT_METHODS,
  type CreditPlan,
  type PaymentMethodType,
} from '../utils/creditPlans'
import './PaymentModal.css'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  currentCredits: number
  currentUser: { name: string; email: string } | null
  onRequireLogin: () => void
  onPaymentSuccess: (addedCredits: number, planName: string) => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  currentCredits,
  currentUser,
  onRequireLogin,
  onPaymentSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan>(CREDIT_PLANS[1]) // Mặc định gói Giáo Viên
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('vietqr')
  const [step, setStep] = useState<'select' | 'checkout' | 'success'>('select')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [copiedField, setCopiedField] = useState<string>('')

  if (!isOpen) return null

  // Tổng số credits nhận được từ gói
  const totalPlanCredits = selectedPlan.credits + (selectedPlan.bonusCredits || 0)

  // Cấu hình ngân hàng nhận tiền
  const BANK_BIN = import.meta.env.VITE_SEPAY_BANK_BIN || '970407' // Mã ngân hàng Techcombank
  const BANK_NAME = import.meta.env.VITE_SEPAY_BANK_NAME || 'Techcombank'
  const ACCOUNT_NO = import.meta.env.VITE_SEPAY_ACCOUNT_NO || '19032752672024'
  const ACCOUNT_NAME = import.meta.env.VITE_SEPAY_ACCOUNT_NAME || 'LE THI HIEN THUONG'

  // Mã giao dịch thanh toán duy nhất (dùng để SePAY tự động nhận diện và cộng điểm)
  const [transactionCode] = useState<string>(() => {
    const userPrefix = currentUser ? currentUser.email.split('@')[0].slice(0, 4).toUpperCase() : 'HT'
    return `${userPrefix}${Math.floor(100000 + Math.random() * 900000)}`
  })

  // Tạo URL mã VietQR chuẩn liên ngân hàng NAPAS
  const qrUrl = `https://api.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NO}-compact.jpg?amount=${selectedPlan.price}&addInfo=${transactionCode}&accountName=${encodeURIComponent(
    ACCOUNT_NAME
  )}`

  // Xử lý sao chép thông tin
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  // Xử lý hoàn tất thanh toán
  const handleConfirmPaid = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setStep('success')
      onPaymentSuccess(totalPlanCredits, selectedPlan.name)
    }, 1500)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng modal */}
        <button type="button" className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        {step === 'select' && (
          <>
            <div className="modal-header">
              <div className="modal-icon-badge">💎</div>
              <h2>Nạp Credits VIP - Mở Khóa In Trọn Cuốn</h2>
              <p className="modal-subtitle">
                Số dư hiện tại của bạn: <strong>{currentCredits} Credits</strong> (1 Credit = 1 Trang A4 đầy đủ)
              </p>
            </div>

            {/* Bước 1: Chọn gói nạp */}
            <div className="plans-grid">
              {CREDIT_PLANS.map((plan) => {
                const isSelected = selectedPlan.id === plan.id
                const total = plan.credits + (plan.bonusCredits || 0)

                return (
                  <div
                    key={plan.id}
                    className={`plan-card ${isSelected ? 'selected' : ''} ${
                      plan.popular ? 'popular' : ''
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {plan.tag && <div className="plan-badge">{plan.tag}</div>}
                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-price">{plan.priceDisplay}</div>
                    <div className="plan-credits-callout">
                      <span className="credits-number">{total}</span>
                      <span className="credits-unit">Trang A4</span>
                      {plan.bonusCredits && (
                        <span className="bonus-tag">+{plan.bonusCredits} tặng thêm</span>
                      )}
                    </div>
                    <p className="plan-desc">{plan.description}</p>
                    <ul className="plan-features">
                      {plan.features.map((feat, i) => (
                        <li key={i}>✓ {feat}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`plan-select-btn ${isSelected ? 'active' : ''}`}
                    >
                      {isSelected ? 'Đang chọn' : 'Chọn gói này'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="modal-footer-action">
              {!currentUser ? (
                <div className="login-prompt-before-pay">
                  <p>💡 Bạn cần đăng nhập tài khoản để lưu giữ số Credits đã nạp vĩnh viễn.</p>
                  <button
                    type="button"
                    className="btn-proceed-checkout"
                    onClick={() => {
                      onRequireLogin()
                    }}
                  >
                    🔑 Đăng Nhập Để Thanh Toán {selectedPlan.priceDisplay}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-proceed-checkout"
                  onClick={() => setStep('checkout')}
                >
                  Tiếp tục thanh toán {selectedPlan.priceDisplay} ({totalPlanCredits} Credits) →
                </button>
              )}
            </div>
          </>
        )}

        {step === 'checkout' && (
          <div className="checkout-step">
            <div className="checkout-header">
              <button
                type="button"
                className="btn-back-step"
                onClick={() => setStep('select')}
              >
                ← Chọn gói khác
              </button>
              <h2>Chọn Hình Thức Thanh Toán</h2>
              <div className="selected-summary">
                Gói: <strong>{selectedPlan.name}</strong> • Số tiền:{' '}
                <span className="summary-price">{selectedPlan.priceDisplay}</span>
              </div>
            </div>

            <div className="checkout-body">
              {/* Cột trái: Danh sách các phương thức thanh toán */}
              <div className="methods-selector">
                <div className="section-label">Phương thức thanh toán:</div>
                {PAYMENT_METHODS.map((method) => {
                  const isChosen = selectedMethod === method.id
                  return (
                    <div
                      key={method.id}
                      className={`method-item ${isChosen ? 'chosen' : ''}`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <span className="method-icon">{method.icon}</span>
                      <div className="method-info">
                        <div className="method-title-row">
                          <span className="method-name">{method.name}</span>
                          {method.badge && (
                            <span className="method-badge">{method.badge}</span>
                          )}
                        </div>
                        <div className="method-desc">{method.description}</div>
                      </div>
                      <div className="method-radio">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={isChosen}
                          onChange={() => setSelectedMethod(method.id)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Cột phải: Khung hiển thị chi tiết thanh toán tương ứng */}
              <div className="payment-details-panel">
                {selectedMethod === 'vietqr' && (
                  <div className="qr-payment-box">
                    <div className="qr-title">Quét mã VietQR bằng App Ngân Hàng</div>
                    <div className="qr-image-wrap">
                      <img
                        src={qrUrl}
                        alt="Mã QR thanh toán Techcombank"
                        className="qr-img"
                      />
                    </div>

                    <div className="bank-info-table">
                      <div className="bank-row">
                        <span className="bank-label">Ngân hàng:</span>
                        <span className="bank-value"><strong>{BANK_NAME}</strong> (Kỹ Thương Việt Nam)</span>
                      </div>
                      <div className="bank-row">
                        <span className="bank-label">Chủ tài khoản:</span>
                        <span className="bank-value"><strong>{ACCOUNT_NAME}</strong></span>
                      </div>
                      <div className="bank-row">
                        <span className="bank-label">Số tài khoản:</span>
                        <span className="bank-value highlight">
                          {ACCOUNT_NO}
                          <button
                            type="button"
                            className="btn-copy"
                            onClick={() => handleCopy(ACCOUNT_NO, 'stk')}
                          >
                            {copiedField === 'stk' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </span>
                      </div>
                      <div className="bank-row">
                        <span className="bank-label">Số tiền:</span>
                        <span className="bank-value text-red">
                          {selectedPlan.priceDisplay}
                        </span>
                      </div>
                      <div className="bank-row">
                        <span className="bank-label">Nội dung CK:</span>
                        <span className="bank-value highlight">
                          {transactionCode}
                          <button
                            type="button"
                            className="btn-copy"
                            onClick={() => handleCopy(transactionCode, 'code')}
                          >
                            {copiedField === 'code' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === 'momo' && (
                  <div className="momo-payment-box">
                    <div className="qr-title">Thanh toán qua Ví MoMo</div>
                    <div className="momo-card-preview">
                      <div className="momo-logo">Ví MoMo</div>
                      <p>Mở ứng dụng MoMo trên điện thoại để quét mã hoặc chuyển đến:</p>
                      <div className="bank-row">
                        <span className="bank-label">SĐT MoMo:</span>
                        <span className="bank-value highlight">
                          0988.666.888
                          <button
                            type="button"
                            className="btn-copy"
                            onClick={() => handleCopy('0988666888', 'momo')}
                          >
                            {copiedField === 'momo' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </span>
                      </div>
                      <div className="bank-row">
                        <span className="bank-label">Lời nhắn:</span>
                        <span className="bank-value highlight">{transactionCode}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === 'vnpay' && (
                  <div className="vnpay-box">
                    <div className="qr-title">Cổng Thanh Toán VNPAY-QR</div>
                    <div className="vnpay-banner">
                      <span className="vnpay-logo-text">VNPAY-QR</span>
                      <p>Hỗ trợ quét qua hơn 40 ứng dụng ngân hàng và ví điện tử</p>
                    </div>
                    <div className="vnpay-instructions">
                      Sau khi nhấn xác nhận, hệ thống sẽ kết nối với cổng VNPAY để bạn quét mã QR trực tiếp.
                    </div>
                  </div>
                )}

                {selectedMethod === 'card' && (
                  <div className="card-box">
                    <div className="qr-title">Thanh toán thẻ Quốc tế (Visa / Mastercard)</div>
                    <div className="card-form-mock">
                      <div className="form-group">
                        <label>Số thẻ:</label>
                        <input type="text" placeholder="4111 2222 3333 4444" />
                      </div>
                      <div className="form-row-card">
                        <div className="form-group">
                          <label>Ngày hết hạn:</label>
                          <input type="text" placeholder="MM/YY" />
                        </div>
                        <div className="form-group">
                          <label>Mã CVV:</label>
                          <input type="text" placeholder="123" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="payment-action-bottom">
                  <button
                    type="button"
                    className="btn-confirm-paid"
                    onClick={handleConfirmPaid}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner-mini"></span> Đang kiểm tra giao dịch...
                      </>
                    ) : (
                      `Tôi đã chuyển khoản / Thanh toán ngay (${selectedPlan.priceDisplay})`
                    )}
                  </button>
                  <p className="payment-note">
                    🔒 Hệ thống cộng Credits tự động sau khi giao dịch thành công. Nếu cần hỗ trợ nhanh, gọi Hotline 0988.666.888.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="success-step">
            <div className="success-icon">🎉</div>
            <h2>Nạp Credits Thành Công!</h2>
            <p className="success-desc">
              Bạn đã nạp thành công <strong>{selectedPlan.name}</strong>.
            </p>
            <div className="credits-gain-box">
              <span className="gain-label">Số Credits được cộng:</span>
              <span className="gain-amount">+{totalPlanCredits} Credits</span>
              <span className="gain-total">
                Tổng số dư mới: <strong>{currentCredits + totalPlanCredits} Credits</strong>
              </span>
            </div>
            <p className="success-subnote">
              Bạn có thể bắt đầu xuất trọn bộ cuốn tập {totalPlanCredits} trang A4 ngay bây giờ!
            </p>
            <button
              type="button"
              className="btn-success-close"
              onClick={() => {
                setStep('select')
                onClose()
              }}
            >
              Bắt đầu tạo sách ngay
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
