import { jsPDF } from 'jspdf'
import { saveAs } from 'file-saver'
import {
  type CharSize,
  CHAR_SIZE_MAP,
  FONT_OPTIONS,
} from '../components/TianzigeBox'
import type { BrandingOptions, MultiPageItem } from './exportDocx'

export interface ExportPdfOptions {
  char: string
  pinyin?: string
  rows?: number
  cols?: number
  fontId?: string
  charSize?: CharSize
  branding?: BrandingOptions
  multiPageItems?: MultiPageItem[]
  charRowLimit?: number
  onProgress?: (percent: number, current: number, total: number) => void
}

/**
 * Vẽ toàn bộ 1 trang A4 trọn vẹn lên HTML5 Canvas với độ phân giải cao (150 DPI)
 * Bố cục đảm bảo 100% vừa khít một trang duy nhất, không bao giờ bị nhảy trang
 */
function renderPageToCanvas(
  canvas: HTMLCanvasElement,
  char: string,
  pinyin: string,
  rows: number,
  cols: number,
  fontFamily: string,
  fontWeight: number | string,
  charSize: CharSize,
  branding?: BrandingOptions,
  charRowLimit?: number,
  logoImg?: HTMLImageElement | null
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width // 1240 px
  const height = canvas.height // 1754 px

  // 1. Nền trắng
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const marginX = 80
  const contentWidth = width - marginX * 2 // 1080 px

  // 2. Header thương hiệu
  let currentY = 65

  const hasBranding = !!(
    branding &&
    (branding.centerName || branding.teacherName || branding.phone || branding.logoDataUrl)
  )
  const centerTitle = branding?.centerName?.trim() || 'LUYỆN VIẾT CHỮ HÁN'
  const sloganText = branding?.slogan?.trim() || 'Có công mài sắt có ngày nên kim'

  // Vẽ Logo (nếu có)
  let textStartX = marginX
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const logoSize = 46
    ctx.drawImage(logoImg, marginX, currentY, logoSize, logoSize)
    textStartX = marginX + logoSize + 12
  }

  // Tiêu đề trung tâm / lớp học
  ctx.fillStyle = hasBranding ? '#b91c1c' : '#0f172a'
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(centerTitle, textStartX, currentY + 2)

  // Thông tin Giáo viên & Hotline
  const subInfoParts: string[] = []
  if (branding?.teacherName?.trim()) subInfoParts.push(`GV: ${branding.teacherName.trim()}`)
  if (branding?.phone?.trim()) subInfoParts.push(`Hotline: ${branding.phone.trim()}`)
  const subInfo = subInfoParts.join(' • ')

  if (subInfo) {
    ctx.fillStyle = '#64748b'
    ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
    ctx.fillText(subInfo, textStartX, currentY + 30)
  }

  // Slogan / Câu khẩu hiệu bên phải
  ctx.fillStyle = '#64748b'
  ctx.font = 'italic 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(sloganText, width - marginX, currentY + 8)

  currentY += 58

  // Đường kẻ phân cách header nhẹ nhàng
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(marginX, currentY)
  ctx.lineTo(width - marginX, currentY)
  ctx.stroke()

  currentY += 16

  // 3. Dòng chữ mẫu & Phiên âm
  if (char) {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#0f172a'
    ctx.font = `${fontWeight || 400} 46px ${fontFamily}`
    ctx.fillText(char, marginX, currentY + 22)

    if (pinyin) {
      ctx.fillStyle = '#334155'
      ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      ctx.fillText(`[ ${pinyin} ]`, marginX + 68, currentY + 22)
    }

    currentY += 46

    ctx.fillStyle = '#64748b'
    ctx.font = 'italic 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
    ctx.textBaseline = 'top'
    ctx.fillText('Tập tô theo chữ màu xám nhạt trong từng ô vuông bên dưới.', marginX, currentY)
    currentY += 24
  } else {
    ctx.fillStyle = '#64748b'
    ctx.font = 'italic 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('Giấy kẻ ô Điền Tự Cách chuẩn A4 để tự do luyện viết chữ Hán theo ý muốn.', marginX, currentY)
    currentY += 28
  }

  // 4. Lưới ô Mễ Tự Cách (Tianzige Grid)
  const bottomReserved = 160 // Không gian dành riêng cho Ghi chú & Footer
  const availableGridHeight = height - currentY - bottomReserved
  const gap = 3

  const maxBoxWidth = (contentWidth - (cols - 1) * gap) / cols
  const maxBoxHeight = (availableGridHeight - (rows - 1) * gap) / rows
  const boxSize = Math.floor(Math.min(maxBoxWidth, maxBoxHeight))

  const totalGridWidth = cols * boxSize + (cols - 1) * gap
  const totalGridHeight = rows * boxSize + (rows - 1) * gap

  const gridStartX = marginX + Math.floor((contentWidth - totalGridWidth) / 2)
  const gridStartY = currentY

  const factor = CHAR_SIZE_MAP[charSize]?.canvasFactor || 0.70
  const charFontSize = Math.floor(boxSize * factor)

  for (let r = 0; r < rows; r++) {
    const isCharRow = charRowLimit === undefined || r < charRowLimit
    const displayChar = isCharRow ? char : ''

    for (let c = 0; c < cols; c++) {
      const bx = gridStartX + c * (boxSize + gap)
      const by = gridStartY + r * (boxSize + gap)

      // Nền trắng ô
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(bx, by, boxSize, boxSize)

      // Khung viền ngoài hình vuông
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 1.2
      ctx.setLineDash([])
      ctx.strokeRect(bx, by, boxSize, boxSize)

      // Đường kẻ nét đứt Mễ Tự Cách (米字格)
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 0.8
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      // Đường ngang chia đôi
      ctx.moveTo(bx, by + boxSize / 2)
      ctx.lineTo(bx + boxSize, by + boxSize / 2)
      // Đường dọc chia đôi
      ctx.moveTo(bx + boxSize / 2, by)
      ctx.lineTo(bx + boxSize / 2, by + boxSize)
      // 2 đường chéo
      ctx.moveTo(bx, by)
      ctx.lineTo(bx + boxSize, by + boxSize)
      ctx.moveTo(bx + boxSize, by)
      ctx.lineTo(bx, by + boxSize)
      ctx.stroke()

      // Chữ tập tô màu xám nhạt ở giữa ô
      if (displayChar) {
        ctx.setLineDash([])
        ctx.fillStyle = '#bcbcbc'
        ctx.font = `${fontWeight || 400} ${charFontSize}px ${fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(displayChar, bx + boxSize / 2, by + boxSize / 2 + boxSize * 0.02)
      }
    }
  }

  currentY = gridStartY + totalGridHeight + 20

  // 5. Phần Ghi chú có hàng dấu chấm
  let noteLines = 2
  if (rows <= 9) noteLines = 3
  else if (rows <= 14) noteLines = 2
  else noteLines = 1

  ctx.setLineDash([2, 4])
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 1

  for (let l = 0; l < noteLines; l++) {
    const lineY = currentY + l * 24
    if (l === 0) {
      ctx.setLineDash([])
      ctx.fillStyle = '#475569'
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText('Ghi chú:', marginX, lineY)

      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.moveTo(marginX + 54, lineY + 2)
      ctx.lineTo(width - marginX, lineY + 2)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(marginX, lineY + 2)
      ctx.lineTo(width - marginX, lineY + 2)
      ctx.stroke()
    }
  }

  // 6. Chân trang (Footer)
  ctx.setLineDash([])
  const footerY = height - 45
  ctx.fillStyle = '#64748b'
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('Hán Tự Tập Tô • Khổ A4 chuẩn in', marginX, footerY)

  ctx.textAlign = 'right'
  ctx.fillText('Họ và tên: ............................................ Ngày: ...../...../202...', width - marginX, footerY)
}

/**
 * Tạo file PDF (.pdf) khổ A4 chuẩn in ấn với độ nét cao, định dạng trang cố định 100% không nhảy trang
 * Hỗ trợ xuất 1 chữ hoặc trọn bộ nhiều trang (tối đa tới 5000 trang)
 */
export async function exportToPdf({
  char,
  pinyin = '',
  rows = 14,
  cols = 10,
  fontId = 'yahei',
  charSize = 'medium',
  branding,
  multiPageItems,
  charRowLimit,
  onProgress,
}: ExportPdfOptions): Promise<boolean> {
  const fontOpt = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0]

  // Xác định danh sách các trang cần xuất
  const itemsToExport: MultiPageItem[] =
    multiPageItems && multiPageItems.length > 0
      ? multiPageItems
      : [{ char, pinyin }]

  const total = itemsToExport.length

  // Tải trước logo nếu có để vẽ lên Canvas
  let logoImg: HTMLImageElement | null = null
  if (branding?.logoDataUrl) {
    logoImg = new Image()
    logoImg.src = branding.logoDataUrl
    await new Promise((resolve) => {
      logoImg!.onload = () => resolve(true)
      logoImg!.onerror = () => resolve(false)
    })
  }

  // Khởi tạo tài liệu jsPDF khổ A4 (210 x 297 mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  // Tái sử dụng 1 phần tử Canvas duy nhất (1240 x 1754 px ≈ 150 DPI) để tiết kiệm tối đa bộ nhớ RAM
  const canvas = document.createElement('canvas')
  canvas.width = 1240
  canvas.height = 1754

  onProgress?.(0, 0, total)

  for (let i = 0; i < total; i++) {
    const item = itemsToExport[i]

    // Vẽ toàn bộ nội dung trang lên Canvas
    renderPageToCanvas(
      canvas,
      item.char,
      item.pinyin,
      rows,
      cols,
      fontOpt.fontFamily,
      fontOpt.fontWeight || 400,
      charSize,
      branding,
      charRowLimit,
      logoImg
    )

    // Nếu từ trang 2 trở đi thì thêm trang mới vào PDF
    if (i > 0) {
      pdf.addPage('a4', 'portrait')
    }

    // Nén trang canvas thành ảnh JPEG chất lượng cao và đặt phủ kín khổ giấy A4 (210 x 297 mm)
    const imgData = canvas.toDataURL('image/jpeg', 0.90)
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')

    // Tiến độ giai đoạn 1: 0% -> 90%
    const percent = Math.min(90, Math.round(((i + 1) / total) * 90))

    if (i % 2 === 0 || i === total - 1) {
      onProgress?.(percent, i + 1, total)
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  // Giai đoạn 2: Tạo Blob PDF và tải về máy
  onProgress?.(95, total, total)
  await new Promise((resolve) => setTimeout(resolve, 15))

  const pdfBlob = pdf.output('blob')
  const fileName =
    itemsToExport.length > 1
      ? `Tap_to_chu_Han_${itemsToExport.length}_trang.pdf`
      : char
      ? `Tap_to_chu_${char}.pdf`
      : `Giay_ke_o_tu_luyen_viet_A4.pdf`

  onProgress?.(100, total, total)

  // Kiểm tra thiết bị di động
  const ua = navigator.userAgent || ''
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  const isInAppBrowser = /FBAN|FBAV|Instagram|Line|musical_ly|ByteLocale|Snapchat|MicroMessenger|Zalo/i.test(ua)

  // 1. Nếu trên máy tính và trình duyệt hỗ trợ Native Save Picker, cho phép chọn thư mục lưu
  if (!isMobile && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Tài liệu PDF (Chuẩn in ấn A4)',
            accept: {
              'application/pdf': ['.pdf'],
            },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(pdfBlob)
      await writable.close()
      return true
    } catch (pickerErr: any) {
      if (pickerErr.name === 'AbortError') {
        throw new Error('USER_CANCELLED')
      }
    }
  }

  // 2. Kỹ thuật tải chuẩn bằng Anchor link + FileSaver cho mọi thiết bị di động
  try {
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      try {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (cleanErr) {
        // ignore
      }
    }, 4000)

    try {
      saveAs(pdfBlob, fileName)
    } catch {
      // Đã có anchor link bảo đảm
    }

    return true
  } catch (err) {
    console.warn('Anchor download failed, fallback to saveAs:', err)
    try {
      saveAs(pdfBlob, fileName)
      return true
    } catch (fallbackErr) {
      console.error('Không thể lưu file về máy:', fallbackErr)
      throw new Error(
        isInAppBrowser
          ? 'Trình duyệt Facebook / Zalo chặn tải file. Vui lòng bấm vào dấu 3 chấm góc trên bên phải (⋮ hoặc ⋯) và chọn "Mở bằng trình duyệt" (Chrome / Safari) để tải file PDF nhé!'
          : 'Không thể tải file PDF về máy. Vui lòng kiểm tra quyền tải xuống của trình duyệt.'
      )
    }
  }
}
