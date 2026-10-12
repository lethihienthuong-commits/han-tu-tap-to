import React, { useState } from 'react'
import {
  type AuthUser,
  signInWithGoogleOAuth,
  sendOtpToEmail,
  verifyEmailOtp,
  signUpWithEmail,
  signInWithEmail,
} from '../utils/authService'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (user: AuthUser) => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'otp'>('login')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [otpCode, setOtpCode] = useState<string>('')
  const [usePassword, setUsePassword] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successNotice, setSuccessNotice] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  if (!isOpen) return null

  // Đăng nhập chuẩn bằng tài khoản Google chính chủ (Tự động mở popup chọn Gmail đang có trên trình duyệt)
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await signInWithGoogleOAuth()
      if (res.error) {
        setErrorMessage(`Lỗi kết nối Google: ${res.error}`)
      }
    } catch {
      setErrorMessage('Không thể mở cửa sổ đăng nhập Google. Vui lòng thử lại!')
    } finally {
      setIsLoading(false)
    }
  }

  // 1. Gửi mã xác thực về Email
  const handleSendOtp = async (targetEmail: string) => {
    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ Email hợp lệ!')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await sendOtpToEmail(targetEmail)
      if (res.error) {
        setErrorMessage(res.error)
      } else {
        setSuccessNotice(`Mã xác thực đã được gửi về: ${targetEmail}. Vui lòng kiểm tra email và nhập mã bên dưới.`)
        setTab('otp')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Xác thực mã OTP người dùng nhập
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode.trim()) {
      setErrorMessage('Vui lòng nhập mã xác thực!')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await verifyEmailOtp(email, otpCode)
      if (res.error) {
        setErrorMessage(res.error)
      } else if (res.user) {
        onLoginSuccess(res.user)
        onClose()
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Đăng nhập bằng Email & Mật khẩu vào Supabase Cloud
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ Email và Mật khẩu!')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await signInWithEmail(email, password)
      if (res.error) {
        // Nếu tài khoản chưa có mật khẩu, tự động đăng ký mới luôn
        if (res.error.toLowerCase().includes('invalid login') || res.error.toLowerCase().includes('not found')) {
          const regRes = await signUpWithEmail(email, password)
          if (regRes.error) {
            setErrorMessage(res.error)
            return
          }
          if (regRes.user) {
            onLoginSuccess(regRes.user)
            onClose()
            return
          }
        }
        setErrorMessage(res.error)
        return
      }
      if (res.user) {
        onLoginSuccess(res.user)
        onClose()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="auth-header">
          <div className="auth-logo-badge">漢</div>
          <h2>
            {tab === 'otp' ? 'Xác Thực Mã Email' : 'Đăng Nhập / Tiếp Tục'}
          </h2>
          <p className="auth-subtitle">
            {tab === 'otp'
              ? 'Nhập mã đã gửi về hòm thư để tiếp tục sử dụng'
              : 'Đăng nhập nhanh để lưu tài liệu và nhận 15 lượt xuất sách miễn phí!'}
          </p>
        </div>

        {/* Lựa chọn tiếp tục với Google */}
        {tab !== 'otp' && (
          <>
            <button type="button" className="btn-google-login" onClick={handleGoogleLogin} disabled={isLoading}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {isLoading ? 'Đang kết nối...' : 'Tiếp tục với Google'}
            </button>

            <div className="auth-divider">
              <span>hoặc tiếp tục với Email</span>
            </div>
          </>
        )}

        {errorMessage && <div className="auth-error-toast">{errorMessage}</div>}
        {successNotice && <div className="auth-success-toast" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>{successNotice}</div>}

        {/* Tab nhập mã OTP xác thực */}
        {tab === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="auth-input-group">
              <label>Email của bạn:</label>
              <input type="text" value={email} disabled style={{ background: '#f8fafc', color: '#64748b' }} />
            </div>

            <div className="auth-input-group">
              <label>Mã xác thực gửi về Email:</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Nhập mã 6 chữ số..."
                maxLength={8}
                style={{ fontSize: '20px', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                autoFocus
                required
              />
            </div>

            <button type="submit" className="btn-auth-submit" disabled={isLoading}>
              {isLoading ? 'Đang kiểm tra...' : 'Xác Thực & Vào Ứng Dụng'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                className="btn-switch-tab"
                onClick={() => handleSendOtp(email)}
                disabled={isLoading}
              >
                Gửi lại mã xác thực
              </button>
              <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
              <button
                type="button"
                className="btn-switch-tab"
                onClick={() => {
                  setTab('login')
                  setSuccessNotice('')
                  setErrorMessage('')
                }}
              >
                Dùng email khác
              </button>
            </div>
          </form>
        ) : (
          /* Form Email chuẩn quốc tế: Mặc định gửi OTP không cần nhớ mật khẩu, hoặc mở mật khẩu */
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (usePassword) {
                handlePasswordSubmit(e)
              } else {
                handleSendOtp(email)
              }
            }}
            className="auth-form"
          >
            <div className="auth-input-group">
              <label>Địa chỉ Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            {usePassword && (
              <div className="auth-input-group">
                <label>Mật khẩu:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <button type="submit" className="btn-auth-submit" disabled={isLoading}>
              {isLoading
                ? 'Đang xử lý...'
                : usePassword
                ? 'Đăng Nhập Với Mật Khẩu'
                : 'Tiếp Tục Với Email (Gửi mã OTP)'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                className="btn-switch-tab"
                style={{ fontSize: '12px', color: '#64748b', textDecoration: 'underline' }}
                onClick={() => {
                  setUsePassword(!usePassword)
                  setErrorMessage('')
                }}
              >
                {usePassword
                  ? '← Đăng nhập không cần mật khẩu (Nhận mã qua Email)'
                  : 'Hoặc đăng nhập bằng Mật khẩu riêng →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
