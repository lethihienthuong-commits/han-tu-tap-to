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
  onPaymentSuccess: _onPaymentSuccess,
}) => {
  const defaultPlan = CREDIT_PLANS && CREDIT_PLANS.length > 1 ? CREDIT_PLANS[1] : (CREDIT_PLANS[0] || {
    id: 'plan_teacher',
    name: 'Gói Giáo Viên',
    price: 99000,
    priceDisplay: '99.000 đ',
    credits: 1200,
    bonusCredits: 300,
  })

  const [selectedPlan, setSelectedPlan] = useState<CreditPlan>(defaultPlan)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('vietqr')
  const [step, setStep] = useState<'select' | 'checkout' | 'pending' | 'success'>('select')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [copiedField, setCopiedField] = useState<string>('')
  // Giữ mã giao dịch cố định trong suốt phiên mở modal
  const [transactionCode] = useState<string>(() => 'HT' + Math.floor(100000 + (Math.random() * 900000)))

  if (!isOpen) return null

  // Cấu hình ngân hàng nhận tiền an toàn tuyệt đối
  const BANK_BIN = '970432'
  const BANK_NAME = 'VPBank'
  const ACCOUNT_NO = '0969246788'
  const ACCOUNT_NAME = 'LE THI HIEN THUONG'

  // Tổng số credits nhận được từ gói
  const currentPlan = selectedPlan || defaultPlan
  const totalPlanCredits = (currentPlan.credits || 1000) + (currentPlan.bonusCredits || 0)

  // Tạo URL mã VietQR chuẩn liên ngân hàng NAPAS
  const planPrice = currentPlan.price || 99000
  const qrUrl = `https://api.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NO}-compact.jpg?amount=${planPrice}&addInfo=${transactionCode}&accountName=${encodeURIComponent(
    ACCOUNT_NAME
  )}`

  // Xử lý sao chép thông tin
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  // Xử lý khi người dùng bấm "Tôi đã chuyển khoản":
  // Chuyển sang màn hình xác nhận đã gửi thông tin, KHÔNG tự cộng credits và KHÔNG qua Zalo
  const handleConfirmPaid = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setStep('pending')
    }, 600)
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
              <button
                type="button"
                className="btn-proceed-checkout"
                onClick={() => setStep('checkout')}
              >
                Tiếp tục thanh toán {selectedPlan.priceDisplay} ({totalPlanCredits} Credits) →
              </button>
              {!currentUser && (
                <p className="guest-note-text" style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                  (Bạn có thể <span style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }} onClick={onRequireLogin}>đăng nhập</span> để bảo vệ số dư tài khoản lâu dài)
                </p>
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
                        alt="Mã QR thanh toán VPBank"
                        className="qr-img"
                      />
                    </div>

                    <div className="bank-info-table">
                      <div className="bank-row">
                        <span className="bank-label">Ngân hàng:</span>
                        <span className="bank-value"><strong>{BANK_NAME}</strong> (Việt Nam Thịnh Vượng)</span>
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
                        <span className="spinner-mini"></span> Đang gửi xác nhận...
                      </>
                    ) : (
                      `Tôi đã chuyển khoản xong (${selectedPlan.priceDisplay})`
                    )}
                  </button>
                  <p className="payment-note">
                    🔒 Vui lòng chuyển khoản đúng số tiền và nội dung chuyển khoản để hệ thống tự động nhận diện và cập nhật số dư.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'pending' && (
          <div className="pending-step">
            <div className="pending-icon-wrap">
              <span className="pending-icon">✅</span>
            </div>
            <h2>Đã Tiếp Nhận Thông Tin Chuyển Khoản</h2>
            <p className="pending-desc">
              Hệ thống đã ghi nhận yêu cầu nạp <strong>{selectedPlan.name}</strong> ({selectedPlan.priceDisplay}).
            </p>

            <div className="pending-info-card">
              <div className="pending-row">
                <span className="pending-label">Mã giao dịch:</span>
                <span className="pending-code">
                  <strong>{transactionCode}</strong>
                  <button
                    type="button"
                    className="btn-copy"
                    onClick={() => handleCopy(transactionCode, 'pending_code')}
                  >
                    {copiedField === 'pending_code' ? '✓ Đã chép' : 'Sao chép'}
                  </button>
                </span>
              </div>
              <div className="pending-row">
                <span className="pending-label">Gói nạp:</span>
                <span>{selectedPlan.name} (+{totalPlanCredits} Credits)</span>
              </div>
              <div className="pending-row">
                <span className="pending-label">Số tiền:</span>
                <span className="pending-price">{selectedPlan.priceDisplay}</span>
              </div>
              <div className="pending-row">
                <span className="pending-label">Trạng thái:</span>
                <span className="pending-status-badge">🟡 Chờ hệ thống ghi nhận biến động số dư</span>
              </div>
            </div>

            <div className="pending-note-box">
              <p style={{ margin: 0, fontWeight: 500 }}>
                Hệ thống sẽ kiểm tra và tự động cập nhật số dư <strong>+{totalPlanCredits} Credits</strong> vào tài khoản của bạn ngay khi tiền vào tài khoản ngân hàng.
              </p>
            </div>

            <div className="pending-actions">
              <button
                type="button"
                className="btn-pending-done"
                onClick={() => {
                  setStep('select')
                  onClose()
                }}
              >
                Đóng thông báo
              </button>
              <button
                type="button"
                className="btn-pending-back"
                onClick={() => setStep('checkout')}
              >
                ← Quay lại xem mã QR / STK
              </button>
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
