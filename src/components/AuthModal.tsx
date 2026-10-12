import React, { useState } from 'react'
import { type AuthUser, loginUser } from '../utils/authService'
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
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  if (!isOpen) return null

  // Đăng nhập nhanh bằng tài khoản Google (Nhập Gmail thật của người dùng)
  const handleGoogleLogin = () => {
    const inputGmail = window.prompt(
      'ĐĂNG NHẬP VỚI TÀI KHOẢN GOOGLE:\n\nNhập địa chỉ Gmail của bạn để kết nối:',
      email || 'example@gmail.com'
    )

    if (!inputGmail || !inputGmail.trim()) return

    const cleanEmail = inputGmail.trim().toLowerCase()
    const namePart = cleanEmail.split('@')[0]
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1)

    const googleUser: AuthUser = {
      id: 'google_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12),
      name: formattedName,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${formattedName}`,
      role: 'vip',
    }

    loginUser(googleUser)
    onLoginSuccess(googleUser)
    onClose()
  }

  // Đăng nhập / Đăng ký bằng Email & Mật khẩu
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ Email và Mật khẩu!')
      return
    }

    const cleanEmail = email.trim().toLowerCase()
    const displayName = tab === 'register' && name.trim() ? name.trim() : cleanEmail.split('@')[0]

    const user: AuthUser = {
      id: 'user_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10),
      name: displayName,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`,
    }

    loginUser(user)
    onLoginSuccess(user)
    onClose()
  }

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="auth-header">
          <div className="auth-logo-badge">漢</div>
          <h2>{tab === 'login' ? 'Đăng Nhập Tài Khoản' : 'Tạo Tài Khoản Mới'}</h2>
          <p className="auth-subtitle">
            Đăng nhập để quản lý số dư Credits và mua thêm lượt xuất sách VIP!
          </p>
        </div>

        {/* Nút đăng nhập Google */}
        <button type="button" className="btn-google-login" onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 24 24">
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
          Đăng nhập nhanh với Google
        </button>

        <div className="auth-divider">
          <span>hoặc dùng Email</span>
        </div>

        {errorMessage && <div className="auth-error-toast">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'register' && (
            <div className="auth-input-group">
              <label>Họ và tên / Tên trung tâm:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cô Minh Thư"
              />
            </div>
          )}

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

          <button type="submit" className="btn-auth-submit">
            {tab === 'login' ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản & Nhận 25 Credits'}
          </button>
        </form>

        <div className="auth-footer-switch">
          {tab === 'login' ? (
            <span>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                className="btn-switch-tab"
                onClick={() => {
                  setTab('register')
                  setErrorMessage('')
                }}
              >
                Đăng ký nhận 25 Credits miễn phí
              </button>
            </span>
          ) : (
            <span>
              Đã có tài khoản?{' '}
              <button
                type="button"
                className="btn-switch-tab"
                onClick={() => {
                  setTab('login')
                  setErrorMessage('')
                }}
              >
                Đăng nhập
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
