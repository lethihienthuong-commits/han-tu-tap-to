import { useState, useMemo } from 'react'
import { pinyin as getPinyin } from 'pinyin-pro'
import {
  TianzigeBox,
  FONT_OPTIONS,
  type CharSize,
} from './components/TianzigeBox'
import { exportToWord } from './utils/exportDocx'
import { searchHanziByPinyin, type HanziCandidate } from './utils/pinyinSearch'
import { extractTextFromFile } from './utils/fileExtractor'
import { PaymentModal } from './components/PaymentModal'
import { AuthModal } from './components/AuthModal'
import {
  type AuthUser,
  getCurrentUser,
  getUserCredits,
  saveUserCredits,
  logoutUser,
} from './utils/authService'
import './App.css'

function App() {
  // Quản lý tài khoản người dùng
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)

  // Quản lý Credits nạp tiền (Liên kết theo ID tài khoản hoặc lưu tạm cho khách dùng thử)
  const [userCredits, setUserCredits] = useState<number>(() => {
    const user = getCurrentUser()
    if (user) {
      return getUserCredits(user.id)
    }
    const guestCredits = localStorage.getItem('han_tu_guest_credits')
    return guestCredits !== null ? parseInt(guestCredits, 10) : 10 // Khách chưa đăng nhập có 10 credits thử
  })
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false)

  // Cập nhật credits
  const updateCredits = (newAmount: number) => {
    setUserCredits(newAmount)
    if (currentUser) {
      saveUserCredits(currentUser.id, newAmount)
    } else {
      localStorage.setItem('han_tu_guest_credits', newAmount.toString())
    }
  }

  // Khi đăng nhập thành công
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user)
    const credits = getUserCredits(user.id)
    setUserCredits(credits)
  }

  // Khi đăng xuất
  const handleLogout = () => {
    logoutUser()
    setCurrentUser(null)
    const guestCredits = localStorage.getItem('han_tu_guest_credits')
    setUserCredits(guestCredits !== null ? parseInt(guestCredits, 10) : 10)
  }

  // Khi nạp tiền thành công
  const handlePaymentSuccess = (addedCredits: number, planName: string) => {
    const updated = userCredits + addedCredits
    updateCredits(updated)
    alert(`🎉 Nạp thành công ${planName}! Bạn được cộng thêm +${addedCredits} Credits vào tài khoản.`)
  }

  // Chữ và pinyin được chọn hiện tại
  const [selectedChar, setSelectedChar] = useState<string>('好')
  const [selectedPinyin, setSelectedPinyin] = useState<string>('hǎo')

  // Input tìm kiếm pinyin không dấu
  const [pinyinSearch, setPinyinSearch] = useState<string>('hao')

  // Cấu hình font chữ và kích thước chữ
  const [fontId, setFontId] = useState<string>('yahei')
  const [charSize, setCharSize] = useState<CharSize>('medium')

  // Bố cục dòng và cột
  const [rows, setRows] = useState<number>(14)
  const [cols, setCols] = useState<number>(10)
  // Bản thiết kế: số dòng có chữ mẫu (0 nghĩa là toàn bộ các dòng đều có chữ tô)
  const [charRowLimit, setCharRowLimit] = useState<number>(0)

  // --- TÍNH NĂNG VIP 1: Nhập nhiều chữ / Danh sách từ vựng ---
  const [isVipMode, setIsVipMode] = useState<boolean>(true) // Bật sẵn chế độ trải nghiệm thử
  const [batchText, setBatchText] = useState<string>('学中文很快乐')
  const [showVipPanel, setShowVipPanel] = useState<boolean>(true) // Mở sẵn bảng chỉnh sửa thương hiệu
  const [activePageIndex, setActivePageIndex] = useState<number>(0)
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false)
  const [fileReadStatus, setFileReadStatus] = useState<string>('')

  // Xử lý đọc file Word, Excel, PDF tải lên
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsReadingFile(true)
      setFileReadStatus(`Đang đọc file "${file.name}"...`)

      const extracted = await extractTextFromFile(file)
      // Lọc các chữ Hán trong file (hỗ trợ toàn bộ chuẩn Unicode tiếng Hán phồn thể & giản thể)
      const hanziList = extracted.match(/[\p{Script=Han}]/gu) || []

      if (hanziList.length === 0) {
        // Kiểm tra xem file có phải dạng PDF scan (chỉ chứa hình ảnh, không có lớp chữ số) hay không
        if (extracted.trim().length === 0) {
          alert(
            `File PDF này là dạng TÀI LIỆU SCAN (hình ảnh chụp), không chứa văn bản kỹ thuật số nên trình duyệt không thể trích xuất chữ được.\n\n👉 Bạn vui lòng dùng file Word, Excel, hoặc file PDF có thể bôi đen copy chữ được nhé!`
          )
        } else {
          alert(`Đã đọc xong file "${file.name}" nhưng không tìm thấy chữ Hán nào trong nội dung văn bản!`)
        }
        setFileReadStatus('')
        return
      }

      setBatchText(extracted)
      setActivePageIndex(0)
      setFileReadStatus(`Đã trích xuất thành công ${hanziList.length} chữ Hán từ file "${file.name}"!`)
      setTimeout(() => setFileReadStatus(''), 4000)
    } catch (err: any) {
      console.error('Lỗi khi đọc file:', err)
      alert(err.message || 'Có lỗi xảy ra khi đọc file. Vui lòng kiểm tra lại!')
      setFileReadStatus('')
    } finally {
      setIsReadingFile(false)
      // Reset input để có thể chọn lại cùng 1 file nếu muốn
      e.target.value = ''
    }
  }

  // --- TÍNH NĂNG VIP 2: Tùy chỉnh thương hiệu & Tên trung tâm (để trống mặc định) ---
  const [centerName, setCenterName] = useState<string>('')
  const [teacherName, setTeacherName] = useState<string>('')
  const [hotline, setHotline] = useState<string>('')
  const [slogan, setSlogan] = useState<string>('')
  const [logoDataUrl, setLogoDataUrl] = useState<string>('')

  // Danh sách chỉ số các chữ người dùng đã loại bỏ (không đưa vào file tập tô)
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set())

  // Tách và phân tích danh sách chữ trong đoạn văn VIP
  const parsedBatchItems = useMemo<{ char: string; pinyin: string; originalIndex: number }[]>(() => {
    if (!batchText.trim()) return []
    // Lấy tất cả ký tự chữ Hán (hỗ trợ toàn bộ dải Unicode Han)
    const hanziChars = batchText.match(/[\p{Script=Han}]/gu) || []
    // Giới hạn tối đa 1000 chữ tương ứng với tối đa 1000 trang cho cuốn tập
    const limitedChars = hanziChars.slice(0, 1000)
    return limitedChars.map((ch, idx) => ({
      char: ch,
      pinyin: getPinyin(ch, { toneType: 'symbol' }),
      originalIndex: idx,
    }))
  }, [batchText])

  // Danh sách các chữ thực tế được chọn đưa vào file tập tô (đã lọc các chữ bị bỏ)
  const effectiveBatchItems = useMemo(() => {
    return parsedBatchItems.filter((item) => !excludedIndices.has(item.originalIndex))
  }, [parsedBatchItems, excludedIndices])

  // Khi người dùng toggle loại bỏ hoặc giữ lại một chữ
  const handleToggleExclude = (idx: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setExcludedIndices((prev) => {
      const next = new Set(prev)
      const isNowExcluding = !next.has(idx)
      if (isNowExcluding) {
        next.add(idx)
      } else {
        next.delete(idx)
      }

      // Tự động chuyển trang đang xem trước sang chữ hợp lệ kế tiếp
      if (isNowExcluding && activePageIndex === idx) {
        // Tìm chữ gần nhất chưa bị loại bỏ
        const remaining = parsedBatchItems.filter((item) => !next.has(item.originalIndex))
        if (remaining.length > 0) {
          // Ưu tiên chữ đứng sau, nếu không có thì lấy chữ đứng trước
          const nextAvailable = remaining.find((item) => item.originalIndex > idx) || remaining[remaining.length - 1]
          setActivePageIndex(nextAvailable.originalIndex)
        }
      } else if (!isNowExcluding) {
        // Nếu khôi phục lại chữ, tự động chuyển xem trước ngay về chữ này
        setActivePageIndex(idx)
      }

      return next
    })
  }

  // Khôi phục chọn lại tất cả chữ
  const handleIncludeAll = () => {
    setExcludedIndices(new Set())
    if (parsedBatchItems.length > 0) {
      setActivePageIndex(0)
    }
  }

  // Tổng số chữ Hán tìm thấy trong văn bản (để cảnh báo nếu người dùng dán quá 1000 chữ)
  const totalCharsFound = useMemo(() => {
    if (!batchText.trim()) return 0
    const all = batchText.match(/[\p{Script=Han}]/gu) || []
    return all.length
  }, [batchText])

  // Trạng thái xuất file
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportMessage, setExportMessage] = useState<string>('')

  // Tìm kiếm danh sách các chữ đề xuất dựa trên chuỗi pinyin người dùng gõ
  const candidateList = useMemo<HanziCandidate[]>(() => {
    return searchHanziByPinyin(pinyinSearch)
  }, [pinyinSearch])

  // CÁCH 1: Người dùng nhập hoặc dán trực tiếp chữ Hán
  const handleDirectCharInput = (val: string) => {
    const clean = val.trim()
    if (!clean) {
      setSelectedChar('')
      setSelectedPinyin('')
      return
    }
    // Lấy ký tự chữ Hán (nếu có dán cả câu thì lấy ký tự đầu tiên)
    const match = clean.match(/[\u4e00-\u9fa5]/)
    const char = match ? match[0] : clean.charAt(0)
    setSelectedChar(char)

    // Tự động phân tích và điền Pinyin có dấu thanh
    const autoPinyin = getPinyin(char, { toneType: 'symbol' })
    setSelectedPinyin(autoPinyin)

    // Đồng bộ luôn ô tìm kiếm Pinyin không dấu để hiển thị danh sách các chữ cùng âm
    const toneless = getPinyin(char, { toneType: 'none' })
    setPinyinSearch(toneless)
  }

  // CÁCH 2: Người dùng gõ Pinyin không dấu để tìm và chọn chữ
  const handlePinyinSearchChange = (val: string) => {
    setPinyinSearch(val)
    const matches = searchHanziByPinyin(val)
    if (matches.length > 0) {
      setSelectedChar(matches[0].char)
      setSelectedPinyin(matches[0].pinyin)
    }
  }

  // Khi người dùng click chọn một chữ trong danh sách đề xuất
  const handleSelectCandidate = (candidate: HanziCandidate) => {
    setSelectedChar(candidate.char)
    setSelectedPinyin(candidate.pinyin)
  }

  // CÁCH 3: Người dùng chủ động chỉnh sửa Pinyin nếu tự động điền chưa đúng ý
  const handlePinyinEdit = (val: string) => {
    setSelectedPinyin(val)
  }

  // Xử lý nạp ảnh Logo từ máy tính
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setLogoDataUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Đặt lại mặc định toàn bộ thông tin thương hiệu
  const handleResetBranding = () => {
    setCenterName('')
    setTeacherName('')
    setHotline('')
    setSlogan('')
    setLogoDataUrl('')
  }

  // Font được chọn hiện tại
  const currentFont = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0]

  // Xác định chữ hiển thị trên bản xem trước hiện tại
  const previewItem = useMemo(() => {
    if (isVipMode && effectiveBatchItems.length > 0) {
      // Tìm xem chữ tại activePageIndex có trong effectiveBatchItems không
      const itemAtActive = parsedBatchItems[activePageIndex]
      if (itemAtActive && !excludedIndices.has(itemAtActive.originalIndex)) {
        return { char: itemAtActive.char, pinyin: itemAtActive.pinyin }
      }
      return { char: effectiveBatchItems[0].char, pinyin: effectiveBatchItems[0].pinyin }
    }
    if (isVipMode && parsedBatchItems.length > 0 && effectiveBatchItems.length === 0) {
      return { char: '', pinyin: '' }
    }
    return { char: selectedChar, pinyin: selectedPinyin }
  }, [isVipMode, parsedBatchItems, effectiveBatchItems, excludedIndices, activePageIndex, selectedChar, selectedPinyin])

  // Xử lý xuất file Word (.docx)
  const handleExportWord = async () => {
    const willExportMulti = isVipMode && effectiveBatchItems.length > 1
    const pagesToExport = willExportMulti ? effectiveBatchItems.length : 1

    // Kiểm tra số dư Credits (Mỗi trang tốn 1 credit khi xuất bộ nhiều trang VIP)
    if (willExportMulti) {
      if (userCredits < pagesToExport) {
        setIsPaymentModalOpen(true)
        alert(
          `⚠️ Bạn cần ${pagesToExport} Credits để xuất ${pagesToExport} trang A4, nhưng số dư hiện tại chỉ còn ${userCredits} Credits.\n\nVui lòng nạp thêm Credits để tiếp tục xuất file nhé!`
        )
        return
      }
    }

    const singleExportChar = effectiveBatchItems.length === 1 ? effectiveBatchItems[0].char : previewItem.char
    const singleExportPinyin = effectiveBatchItems.length === 1 ? effectiveBatchItems[0].pinyin : previewItem.pinyin

    try {
      setIsExporting(true)
      setExportMessage(
        willExportMulti
          ? `Đang tạo trọn bộ vở ${effectiveBatchItems.length} trang A4...`
          : 'Đang khởi tạo file Word (.docx)...'
      )

      await exportToWord({
        char: singleExportChar,
        pinyin: singleExportPinyin,
        rows,
        cols,
        fontId,
        charSize,
        branding: {
          centerName: centerName.trim() || undefined,
          teacherName: teacherName.trim() || undefined,
          phone: hotline.trim() || undefined,
          slogan: slogan.trim() || undefined,
          logoDataUrl: logoDataUrl || undefined,
        },
        multiPageItems: willExportMulti ? effectiveBatchItems : undefined,
        charRowLimit: charRowLimit > 0 ? charRowLimit : undefined,
      })

      // Trừ credits tương ứng với số trang đã xuất
      if (willExportMulti) {
        const remaining = userCredits - pagesToExport
        updateCredits(remaining)
        setExportMessage(`Đã tải xuống thành công! (Trừ ${pagesToExport} Credits, còn lại ${remaining})`)
      } else {
        setExportMessage('Đã tải xuống file Word thành công!')
      }
      setTimeout(() => setExportMessage(''), 3500)
    } catch (error) {
      console.error('Lỗi khi xuất file Word:', error)
      alert('Có lỗi xảy ra khi tạo file Word. Vui lòng thử lại!')
    } finally {
      setIsExporting(false)
    }
  }

  // In trực tiếp từ trình duyệt
  const handlePrint = () => {
    window.print()
  }

  // Danh sách các ô hiển thị cho bảng xem trước
  const totalCells = rows * cols
  const cellsArray = Array.from({ length: totalCells }, (_, index) => index)

  return (
    <div className="app-container">
      {/* Thanh điều khiển trên cùng (ẩn khi in giấy) */}
      <header className="control-panel no-print">
        <div className="panel-brand">
          <div className="brand-logo">漢</div>
          <div className="brand-text-wrap">
            <div className="brand-title-row">
              <h1>Hán Tự Tập Tô</h1>
              <div className="user-credits-badge" onClick={() => setIsPaymentModalOpen(true)} title="Bấm để nạp thêm Credits">
                <span className="credits-gem">💎</span>
                <span className="credits-val"><strong>{userCredits}</strong> Credits</span>
                <span className="credits-add-btn">+ Nạp thêm</span>
              </div>
              <button
                type="button"
                className={`vip-badge-btn ${isVipMode ? 'active' : ''}`}
                onClick={() => {
                  setShowVipPanel(!showVipPanel)
                  setIsVipMode(true)
                }}
                title="Bấm để ẩn / hiện ô Chỉnh sửa Thương hiệu trung tâm"
              >
                {showVipPanel ? '🏢 Ẩn ô Thương hiệu' : '🏢 Chỉnh sửa Thương hiệu'}
              </button>

              {/* Khu vực đăng nhập / Tài khoản người dùng */}
              {currentUser ? (
                <div className="user-profile-badge" title={`Đang đăng nhập: ${currentUser.email}`}>
                  <span className="user-avatar-circle">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="user-name-text">{currentUser.name}</span>
                  <button
                    type="button"
                    className="btn-logout-small"
                    onClick={handleLogout}
                    title="Đăng xuất khỏi tài khoản này"
                  >
                    Thoát
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-login-header"
                  onClick={() => setIsAuthModalOpen(true)}
                  title="Đăng nhập để lưu số dư và bảo vệ tài khoản"
                >
                  👤 Đăng Nhập
                </button>
              )}
            </div>
            <p className="subtitle">
              Tạo trang tập tô chữ Hán chuẩn A4 • Hỗ trợ xuất trọn bộ cả quyển vở & Chèn thương hiệu trung tâm
            </p>
          </div>
        </div>

        {/* Bảng cấu hình tính năng VIP (Thương hiệu & Logo) */}
        {showVipPanel && (
          <div className="vip-settings-card">
            <div className="vip-settings-header">
              <h3>🏢 Chỉnh Sửa Thương Hiệu & Thông Tin Trung Tâm / Lớp Học</h3>
              <div className="vip-settings-header-actions">
                <button
                  type="button"
                  className="reset-vip-btn"
                  onClick={handleResetBranding}
                  title="Xóa trắng toàn bộ thông tin thương hiệu và logo về mặc định"
                >
                  🔄 Đặt lại mặc định
                </button>
                <button
                  type="button"
                  className="close-vip-btn"
                  onClick={() => setShowVipPanel(false)}
                >
                  ✕ Thu gọn
                </button>
              </div>
            </div>
            <div className="vip-inputs-row">
              <div className="vip-input-item">
                <label>Tên trung tâm / Trường học</label>
                <input
                  type="text"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="vip-input-item">
                <label>Giáo viên phụ trách</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="vip-input-item">
                <label>Hotline / Zalo liên hệ</label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="vip-input-item">
                <label>Slogan / Câu khẩu hiệu</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="vip-input-item">
                <label>Tải Logo (Ảnh PNG/JPG)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="vip-file-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Khu vực VIP 1: Nhập cả đoạn văn / Danh sách từ vựng */}
        <div className="vip-batch-section">
          <div className="vip-batch-header">
            <span className="vip-batch-title">
              <span className="vip-star">★</span> Nhập danh sách từ vựng (Mỗi chữ 1 trang A4 trọn vẹn • Tối đa 1000 trang):
            </span>
            <div className="vip-batch-actions">
              <span className="page-count-badge" title="Số trang sẽ xuất sau khi loại trừ">
                {effectiveBatchItems.length} trang được chọn
                {excludedIndices.size > 0 && ` (Đã bỏ ${excludedIndices.size} chữ)`}
              </span>
              <div className="vip-file-upload-wrap">
                <label className="btn-vip-upload">
                  {isReadingFile ? '⏳ Đang nạp file...' : '📁 Nạp File Word / Excel / PDF'}
                  <input
                    type="file"
                    accept=".docx,.xlsx,.xls,.csv,.pdf,.txt"
                    onChange={handleFileUpload}
                    disabled={isReadingFile}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <button
                type="button"
                className="btn-vip-sample"
                onClick={() => {
                  setBatchText('学中文很快乐，每天进步一点点')
                  setExcludedIndices(new Set())
                }}
              >
                Điền mẫu ví dụ
              </button>
              {excludedIndices.size > 0 && (
                <button
                  type="button"
                  className="btn-vip-restore"
                  onClick={handleIncludeAll}
                  title="Chọn lại tất cả các chữ đã bị bỏ"
                >
                  Khôi phục tất cả ({excludedIndices.size})
                </button>
              )}
              <button
                type="button"
                className="btn-vip-clear"
                onClick={() => {
                  setBatchText('')
                  setExcludedIndices(new Set())
                }}
              >
                Xóa sạch
              </button>
            </div>
          </div>
          {fileReadStatus && (
            <div className="vip-file-status">
              ℹ️ {fileReadStatus}
            </div>
          )}
          {totalCharsFound > 1000 && (
            <div className="vip-limit-warning">
              ⚠️ Văn bản có {totalCharsFound} chữ Hán. Hệ thống tự động giới hạn <strong>1000 trang đầu tiên</strong> để tối ưu tốc độ xuất file.
            </div>
          )}
          <textarea
            className="vip-batch-textarea"
            rows={2}
            value={batchText}
            onChange={(e) => {
              setBatchText(e.target.value)
              setActivePageIndex(0)
              setExcludedIndices(new Set())
            }}
            placeholder="Dán đoạn văn hoặc danh sách từ vào đây (tối đa 1000 chữ tương ứng cuốn tập 1000 trang). Mỗi chữ Hán sẽ là 1 trang A4 đầy đủ các dòng tập tô!"
          />

          {/* Danh sách các chữ liệt kê & Cho phép bấm bỏ chữ hoặc xem trước */}
          {parsedBatchItems.length > 0 && (
            <div className="batch-chips-bar">
              <div className="batch-chips-header-line">
                <span className="batch-chips-label">
                  Danh sách chữ ({effectiveBatchItems.length}/{parsedBatchItems.length}):
                </span>
                <span className="batch-chips-hint">
                  (Bấm dấu ✕ trên chữ để bỏ không đưa vào vở, hoặc bấm vào chữ để xem trước trang)
                </span>
              </div>
              <div className="batch-chips-list">
                {parsedBatchItems.map((item, idx) => {
                  const isExcluded = excludedIndices.has(item.originalIndex)
                  const isActive = activePageIndex === idx && !isExcluded

                  return (
                    <div
                      key={idx}
                      className={`batch-chip ${isActive ? 'active' : ''} ${isExcluded ? 'excluded' : ''}`}
                      onClick={() => {
                        if (!isExcluded) {
                          setActivePageIndex(idx)
                        } else {
                          // Bấm vào chữ đang bị gạch thì phục hồi lại
                          handleToggleExclude(item.originalIndex)
                        }
                      }}
                      title={
                        isExcluded
                          ? `Chữ "${item.char}" đang bị bỏ. Bấm để chọn lại vào file.`
                          : `Chữ "${item.char}" (${item.pinyin}). Bấm để xem trước, bấm ✕ để bỏ.`
                      }
                    >
                      <span className="chip-char">{item.char}</span>
                      <span className="chip-pinyin">{item.pinyin}</span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={(e) => handleToggleExclude(item.originalIndex, e)}
                        title={isExcluded ? 'Đưa chữ này trở lại file tập tô' : 'Bỏ chữ này khỏi file tập tô'}
                      >
                        {isExcluded ? '↩' : '✕'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Khung nhập liệu và điều khiển */}
        <div className="controls-wrapper">
          <div className="input-grid">
            {/* 1. Nhập / Dán chữ Hán trực tiếp */}
            <div className="input-group">
              <label htmlFor="directCharInput">Chữ Hán</label>
              <input
                id="directCharInput"
                type="text"
                value={selectedChar}
                onChange={(e) => handleDirectCharInput(e.target.value)}
                placeholder=""
                className="direct-char-input"
              />
            </div>

            {/* 2. Chỉnh sửa Phiên âm Pinyin */}
            <div className="input-group">
              <label htmlFor="editablePinyinInput">Chỉnh Sửa Phiên Âm Pinyin</label>
              <input
                id="editablePinyinInput"
                type="text"
                value={selectedPinyin}
                onChange={(e) => handlePinyinEdit(e.target.value)}
                placeholder=""
                className="editable-pinyin-input"
              />
            </div>

            {/* 3. Tìm kiếm theo Pinyin không dấu */}
            <div className="input-group">
              <label htmlFor="pinyinSearchInput">Tìm bằng Pinyin</label>
              <input
                id="pinyinSearchInput"
                type="text"
                value={pinyinSearch}
                onChange={(e) => handlePinyinSearchChange(e.target.value)}
                placeholder=""
                className="pinyin-search-input"
                autoComplete="off"
              />
            </div>

            {/* 4. Lựa chọn Kiểu Font chữ */}
            <div className="input-group font-group">
              <label htmlFor="fontSelect">Kiểu Font chữ</label>
              <select
                id="fontSelect"
                value={fontId}
                onChange={(e) => setFontId(e.target.value)}
                className="font-select"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Lựa chọn Kích thước chữ: To - Trung bình - Nhỏ */}
            <div className="input-group size-group">
              <label>Kích thước chữ trong ô</label>
              <div className="size-segmented-control">
                <button
                  type="button"
                  className={`size-btn ${charSize === 'small' ? 'active' : ''}`}
                  onClick={() => setCharSize('small')}
                >
                  Nhỏ
                </button>
                <button
                  type="button"
                  className={`size-btn ${charSize === 'medium' ? 'active' : ''}`}
                  onClick={() => setCharSize('medium')}
                >
                  Vừa
                </button>
                <button
                  type="button"
                  className={`size-btn ${charSize === 'large' ? 'active' : ''}`}
                  onClick={() => setCharSize('large')}
                >
                  To
                </button>
              </div>
            </div>

            {/* 6. Cấu hình số dòng và số cột */}
            <div className="input-group grid-setup-group">
              <label>Bố cục giấy</label>
              <div className="row-col-inputs">
                <select
                  value={rows}
                  onChange={(e) => {
                    const newRows = Number(e.target.value)
                    setRows(newRows)
                    // Nếu số dòng có chữ vượt quá số dòng trang thì chỉnh lại
                    if (charRowLimit > newRows) setCharRowLimit(newRows)
                  }}
                  aria-label="Số dòng"
                >
                  <option value={9}>9 dòng (Ô to)</option>
                  <option value={14}>14 dòng (Ô vừa - Chuẩn A4)</option>
                  <option value={22}>22 dòng (Ô nhỏ - Nhiều chữ)</option>
                </select>
                <span className="divider">×</span>
                <select
                  value={cols}
                  onChange={(e) => {
                    const newCols = Number(e.target.value)
                    setCols(newCols)
                    // Tự động gợi ý số dòng vuông vắn tương ứng với số cột
                    if (newCols === 6) setRows(9)
                    else if (newCols === 10) setRows(14)
                    else if (newCols === 16) setRows(22)
                  }}
                  aria-label="Số cột"
                >
                  <option value={6}>6 ô / dòng</option>
                  <option value={10}>10 ô / dòng</option>
                  <option value={16}>16 ô / dòng</option>
                </select>
              </div>
            </div>

            {/* 7. Tab Bản thiết kế: Cho phép điền số dòng có chữ, không vượt quá tổng số dòng */}
            <div className="input-group design-blueprint-group">
              <label htmlFor="blueprintRowsInput" title="Nhập số dòng có chữ mẫu, các dòng còn lại là ô kẻ trống">
                Bản thiết kế (Số dòng có chữ)
              </label>
              <div className="blueprint-input-wrap">
                <input
                  id="blueprintRowsInput"
                  type="number"
                  min={0}
                  max={rows}
                  value={charRowLimit === 0 ? '' : charRowLimit}
                  onChange={(e) => {
                    const valStr = e.target.value.trim()
                    if (valStr === '') {
                      // Nếu để trống thì coi như hiện đầy đủ cả trang
                      setCharRowLimit(0)
                      return
                    }
                    const num = parseInt(valStr, 10)
                    if (isNaN(num) || num < 0) {
                      setCharRowLimit(0)
                    } else if (num > rows) {
                      // Tự động chặn không cho vượt quá tổng số dòng của trang
                      setCharRowLimit(rows)
                    } else {
                      setCharRowLimit(num)
                    }
                  }}
                  placeholder={`Tất cả (${rows} dòng)`}
                  className="blueprint-number-input"
                />
                <span className="blueprint-max-hint">/ {rows} dòng</span>
              </div>
            </div>
          </div>

          {/* Khu vực Đề xuất các chữ Hán tương ứng với Pinyin */}
          <div className="candidates-section">
            <div className="candidates-header">
              <span className="candidates-label">
                Các chữ đề xuất cho âm <strong>"{pinyinSearch || '...'}"</strong>:
              </span>
              <span className="candidates-hint">
                Bấm vào chữ bên dưới để chọn, hoặc gõ/dán thẳng chữ vào ô Chữ Hán
              </span>
            </div>

            <div className="candidates-scroll">
              {candidateList.length > 0 ? (
                candidateList.map((item) => (
                  <button
                    key={item.char + item.pinyin}
                    type="button"
                    className={`candidate-card ${selectedChar === item.char ? 'selected' : ''}`}
                    onClick={() => handleSelectCandidate(item)}
                    title={`Chọn chữ ${item.char} (${item.pinyin})`}
                  >
                    <span className="candidate-char" style={{ fontFamily: currentFont.fontFamily }}>
                      {item.char}
                    </span>
                    <span className="candidate-pinyin">{item.pinyin}</span>
                  </button>
                ))
              ) : (
                <div className="no-candidate-message">
                  Không tìm thấy chữ phù hợp với âm "{pinyinSearch}". Bạn có thể dán thẳng chữ Hán vào ô "Chữ Hán" ở trên!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="action-buttons">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportWord}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="spinner"></span> {exportMessage || 'Đang tạo file Word...'}
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {effectiveBatchItems.length > 1
                  ? `Xuất trọn bộ vở (${effectiveBatchItems.length} trang .docx)`
                  : effectiveBatchItems.length === 1
                  ? `Xuất file Word 1 trang (${effectiveBatchItems[0].char} - .docx)`
                  : previewItem.char
                  ? 'Xuất file Word (.docx)'
                  : 'Xuất giấy kẻ ô trống (.docx)'}
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            In nhanh từ trình duyệt
          </button>

          {/* Nút nhanh để tạo giấy kẻ ô trống tự viết */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSelectedChar('')
              setSelectedPinyin('')
              setPinyinSearch('')
              setBatchText('')
            }}
            title="Xóa chữ để tạo tờ giấy ô vuông trống hoàn toàn"
          >
            📄 Tạo giấy kẻ ô trống
          </button>

          {exportMessage && <div className="status-toast">{exportMessage}</div>}
        </div>
      </header>

      {/* Khu vực xem trước tờ giấy A4 (A4 Preview) */}
      <main className="preview-container">
        <div className="preview-hint no-print">
          <span>
            Xem trước bản in (Khổ A4 chuẩn)
            {effectiveBatchItems.length > 1 && (
              <>
                {' '}• Trang{' '}
                {effectiveBatchItems.findIndex((it) => it.originalIndex === activePageIndex) + 1 || 1}/
                {effectiveBatchItems.length}
              </>
            )}
            {excludedIndices.size > 0 && ` (Đã tự động loại bỏ ${excludedIndices.size} trang)`}
          </span>
        </div>

        <div className="a4-sheet" id="print-area">
          {/* Header của tờ giấy in (Hỗ trợ chèn thương hiệu VIP) */}
          <div className="sheet-header">
            <div className="header-top">
              <div className="brand-header-left">
                {logoDataUrl && (
                  <img src={logoDataUrl} alt="Logo" className="sheet-logo-img" />
                )}
                <div>
                  <h2 className="sheet-title">
                    {centerName.trim() || 'LUYỆN VIẾT CHỮ HÁN'}
                  </h2>
                  {(teacherName.trim() || hotline.trim()) && (
                    <div className="sheet-sub-brand">
                      {teacherName.trim() && <span>GV: {teacherName.trim()}</span>}
                      {teacherName.trim() && hotline.trim() && <span> • </span>}
                      {hotline.trim() && <span>Hotline: {hotline.trim()}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="header-motto">
                {slogan.trim() || 'Có công mài sắt có ngày nên kim'}
              </div>
            </div>

            {previewItem.char ? (
              <>
                <div className="sample-row">
                  <span
                    className="sample-char"
                    style={{ fontFamily: currentFont.fontFamily }}
                  >
                    {previewItem.char}
                  </span>
                  {previewItem.pinyin && (
                    <span className="sample-pinyin-text">[ {previewItem.pinyin} ]</span>
                  )}
                </div>

                <div className="sheet-instruction">
                  Tập tô theo chữ màu xám nhạt trong từng ô vuông bên dưới.
                </div>
              </>
            ) : (
              <div className="sheet-instruction blank-mode">
                Giấy kẻ ô Điền Tự Cách chuẩn A4 để tự do luyện viết chữ Hán theo ý muốn.
              </div>
            )}
          </div>

          {/* Lưới các ô vuông tập tô chia 4 phần */}
          <div
            className="tianzige-grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {cellsArray.map((idx) => {
              // Tính số hàng hiện tại của ô (0-indexed)
              const rowIndex = Math.floor(idx / cols)
              // Nếu charRowLimit > 0 thì chỉ hiển thị chữ trong các hàng đầu, các hàng sau để trống
              const isCharCell = charRowLimit === 0 || rowIndex < charRowLimit
              const displayChar = isCharCell ? previewItem.char : ''

              return (
                <TianzigeBox
                  key={idx}
                  char={displayChar}
                  fontFamily={currentFont.fontFamily}
                  charSize={charSize}
                />
              )
            })}
          </div>

          {/* Khoảng không gian trống phía dưới tự động điền các hàng dấu chấm để ghi chú thêm */}
          <div className="notes-container">
            <div className="notes-line">
              <span className="notes-label">Ghi chú:</span>
              <div className="notes-dot-leader"></div>
            </div>
            {Array.from({ length: (rows <= 9 ? 4 : rows <= 14 ? 2 : 1) - 1 }).map((_, i) => (
              <div key={i} className="notes-line">
                <div className="notes-dot-leader full-width"></div>
              </div>
            ))}
          </div>

          {/* Chân trang */}
          <div className="sheet-footer">
            <span>Hán Tự Tập Tô • Khổ A4</span>
            <span>Họ và tên: ............................................ Ngày: ...../...../202...</span>
          </div>
        </div>
      </main>

      {/* Modal nạp tiền Credits VIP */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        currentCredits={userCredits}
        currentUser={currentUser}
        onRequireLogin={() => {
          setIsPaymentModalOpen(false)
          setIsAuthModalOpen(true)
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Modal đăng nhập / đăng ký tài khoản */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}

export default App
