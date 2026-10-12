import React, { useState } from 'react'
import './WelcomeModal.css'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false)

  if (!isOpen) return null

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('han_tu_hide_welcome', 'true')
    }
    onClose()
  }

  return (
    <div className="welcome-backdrop" onClick={handleClose}>
      <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng */}
        <button type="button" className="welcome-close-btn" onClick={handleClose} aria-label="Đóng">
          ✕
        </button>

        {/* Banner Hero chuẩn quốc tế */}
        <div className="welcome-hero">
          <div className="welcome-hero-badge">
            <span className="hero-badge-icon">✨</span> NỀN TẢNG TẠO NÊN NHỮNG TRANG LUYỆN VIẾT CHỮ HÁN CHUYÊN NGHIỆP THEO NHU CẦU CÁ NHÂN
          </div>
          <h2>
            Chào mừng bạn đến với <span className="text-gradient">Hán Tự Tập Tô</span>
          </h2>
          <p className="welcome-hero-desc">
            Công cụ hỗ trợ giáo viên, trung tâm và người tự học kiến tạo những cuốn vở tập viết chữ Hán chuẩn mực chỉ trong tích tắc.
          </p>
        </div>

        {/* Lưới 4 tính năng nổi bật */}
        <div className="welcome-features-grid">
          <div className="welcome-feature-card">
            <div className="feature-icon-wrapper bg-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="feature-content">
              <h4>Tạo Cả Quyển Vở Trong 1 Giây</h4>
              <p>Dán đoạn văn hoặc tải file Word / Excel lên. Tự động sinh trọn bộ trang bài tập khổ A4 chuẩn Điền Tự Cách.</p>
            </div>
          </div>

          <div className="welcome-feature-card">
            <div className="feature-icon-wrapper bg-amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div className="feature-content">
              <h4>Lọc Trùng & Kéo Thả Thứ Tự</h4>
              <p>Một cú click để lọc sạch chữ bị lặp. Dễ dàng kéo thả các thẻ chữ hoặc dùng mũi tên để sắp xếp theo lộ trình.</p>
            </div>
          </div>

          <div className="welcome-feature-card">
            <div className="feature-icon-wrapper bg-emerald">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9h1" />
                <path d="M9 13h1" />
                <path d="M9 17h1" />
              </svg>
            </div>
            <div className="feature-content">
              <h4>Đóng Dấu Thương Hiệu Riêng</h4>
              <p>Tự do chèn Logo, Tên trung tâm, Giáo viên & Hotline trên đầu trang. Nâng tầm hình ảnh lớp học chuyên nghiệp.</p>
            </div>
          </div>

          <div className="welcome-feature-card">
            <div className="feature-icon-wrapper bg-purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="feature-content">
              <h4>Xuất File Word & In Chuẩn A4</h4>
              <p>Tải trọn bộ file .DOCX để chỉnh sửa thêm hoặc bấm in nhanh từ trình duyệt với độ sắc nét tuyệt đối.</p>
            </div>
          </div>
        </div>

        {/* Hộp quà tặng chào mừng */}
        <div className="welcome-gift-box">
          <div className="gift-icon">🎁</div>
          <div className="gift-text">
            <strong>Món quà khởi đầu dành cho bạn: </strong>
            <span>Đã chuẩn bị sẵn <strong>15 Credits miễn phí</strong> để bạn thoải mái trải nghiệm xuất những trang vở tập viết đầu tiên!</span>
          </div>
        </div>

        {/* Footer & CTA */}
        <div className="welcome-footer">
          <label className="welcome-dont-show">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Không hiển thị lại thông báo này</span>
          </label>

          <button type="button" className="btn-welcome-cta" onClick={handleClose}>
            Bắt Đầu Trải Nghiệm Ngay 🚀
          </button>
        </div>
      </div>
    </div>
  )
}
