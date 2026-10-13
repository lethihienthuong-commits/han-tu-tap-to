import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  ImageRun,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  TabStopType,
  LeaderType,
} from 'docx'
import { saveAs } from 'file-saver'
import {
  type CharSize,
  CHAR_SIZE_MAP,
  FONT_OPTIONS,
} from '../components/TianzigeBox'

/**
 * Vẽ một ô Điền Tự Cách (田字格) hình vuông lên Canvas
 * gồm viền ngoài, 2 đường nét đứt chia 4 phần và chữ Hán màu xám nhạt ở giữa.
 */
function generateTianzigeImage(
  char: string,
  fontFamily: string,
  charSize: CharSize = 'medium',
  size = 200,
  charColor = '#c0c0c0',
  gridColor = '#a0a0a0',
  fontWeight: number | string = 400
): Uint8Array {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Trình duyệt không hỗ trợ Canvas')
  }

  // Nền trắng tinh
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Khung viền ngoài hình vuông
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, size - 2, size - 2)

  // 2 đường kẻ nét đứt chia 4 phần (chữ thập)
  ctx.setLineDash([6, 6])
  ctx.lineWidth = 1.2
  ctx.strokeStyle = gridColor
  ctx.beginPath()
  // Đường ngang
  ctx.moveTo(0, size / 2)
  ctx.lineTo(size, size / 2)
  // Đường dọc
  ctx.moveTo(size / 2, 0)
  ctx.lineTo(size / 2, size)
  // 2 đường chéo (Mễ Tự Cách)
  ctx.moveTo(0, 0)
  ctx.lineTo(size, size)
  ctx.moveTo(size, 0)
  ctx.lineTo(0, size)
  ctx.stroke()

  // Chữ Hán màu xám nhạt để tập tô theo cỡ chữ và font được chọn (nếu có chữ)
  if (char) {
    ctx.setLineDash([])
    ctx.fillStyle = charColor
    const factor = CHAR_SIZE_MAP[charSize].canvasFactor
    const weightPrefix = fontWeight ? `${fontWeight} ` : ''
    ctx.font = `${weightPrefix}${Math.floor(size * factor)}px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Căn giữa ô vuông
    ctx.fillText(char, size / 2, size / 2 + size * 0.02)
  }

  // Xuất ra dạng dữ liệu nhị phân (Uint8Array) cho thư viện docx
  const dataUrl = canvas.toDataURL('image/png')
  const base64 = dataUrl.split(',')[1]
  const binaryString = window.atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
}

export interface BrandingOptions {
  centerName?: string
  slogan?: string
  teacherName?: string
  phone?: string
  logoDataUrl?: string // base64 / data URL
}

export interface MultiPageItem {
  char: string
  pinyin: string
}

export interface ExportOptions {
  char: string
  pinyin?: string
  rows?: number
  cols?: number
  fontId?: string
  charSize?: CharSize
  branding?: BrandingOptions
  multiPageItems?: MultiPageItem[]
  charRowLimit?: number // Số hàng có chữ mẫu (VD: 2 hàng đầu có chữ tô, các hàng dưới ô trống tự viết)
  onProgress?: (percent: number, current: number, total: number) => void
}

/**
 * Chuyển data URL thành Uint8Array
 */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64Index = dataUrl.indexOf(';base64,')
  const base64 = base64Index !== -1 ? dataUrl.substring(base64Index + 8) : dataUrl
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Tạo các đoạn văn bản có hàng dấu chấm để người học ghi chú thêm vào khoảng trống phía dưới
 */
function createNotesParagraphs(rows: number): Paragraph[] {
  // Số dòng ghi chú tự động tính theo số dòng chữ đã chọn (9 dòng -> 3 dòng, 14 dòng -> 2 dòng, 22 dòng -> 1 dòng)
  let lineCount = 2
  if (rows <= 9) lineCount = 3
  else if (rows <= 14) lineCount = 2
  else lineCount = 1

  const paragraphs: Paragraph[] = []

  // Dòng đầu tiên có chữ "Ghi chú: ........................"
  paragraphs.push(
    new Paragraph({
      spacing: { before: 100, after: 40 },
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: 9600,
          leader: LeaderType.DOT,
        },
      ],
      children: [
        new TextRun({
          text: 'Ghi chú: ',
          bold: true,
          size: 18, // 9pt
          font: 'Arial',
          color: '4B5563',
        }),
        new TextRun({
          text: '\t',
        }),
      ],
    })
  )

  // Các dòng chấm tiếp theo trải dài đều đến hết lề phải
  for (let i = 1; i < lineCount; i++) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 40 },
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: 9600,
            leader: LeaderType.DOT,
          },
        ],
        children: [
          new TextRun({
            text: '\t',
          }),
        ],
      })
    )
  }

  return paragraphs
}

/**
 * Tạo một phần (Section) khổ A4 hoàn chỉnh cho 1 chữ Hán, hỗ trợ thương hiệu và logo
 */
function createPageSection(
  char: string,
  pinyin: string,
  rows: number,
  cols: number,
  fontOpt: (typeof FONT_OPTIONS)[0],
  charSize: CharSize,
  branding?: BrandingOptions,
  charRowLimit?: number,
  precomputedEmptyBytes?: Uint8Array
) {
  // 1. Tạo hình ảnh ô có chữ tập tô
  const imageWithCharBytes = generateTianzigeImage(
    char,
    fontOpt.fontFamily,
    charSize,
    200,
    '#c0c0c0',
    '#a0a0a0',
    fontOpt.fontWeight
  )
  // 2. Tái sử dụng hình ảnh ô trống (tiết kiệm bộ nhớ & tối ưu tốc độ)
  const imageEmptyBytes =
    precomputedEmptyBytes ||
    generateTianzigeImage(
      '',
      fontOpt.fontFamily,
      charSize,
      200,
      '#c0c0c0',
      '#a0a0a0',
      fontOpt.fontWeight
    )
  // Tính kích thước pixel của ô vuông để đảm bảo 100% vừa khít trọn vẹn trong 1 trang A4
  const boxPixelSize = Math.min(
    Math.floor(400 / cols), // Vừa vặn chiều ngang
    Math.floor(540 / rows)  // Vừa vặn chiều dọc (không vượt quá 540px ~ 405pt)
  )

  const tableRows: TableRow[] = []
  for (let r = 0; r < rows; r++) {
    // Nếu có quy định số hàng có chữ (VD: VIP 2 hàng), thì từ hàng thứ 3 trở đi là ô trống
    const isCharRow = charRowLimit === undefined || r < charRowLimit
    const currentBytes = isCharRow ? imageWithCharBytes : imageEmptyBytes

    const cells: TableCell[] = []
    for (let c = 0; c < cols; c++) {
      cells.push(
        new TableCell({
          width: {
            size: Math.floor(9600 / cols),
            type: WidthType.DXA,
          },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          margins: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0, line: 240 },
              children: [
                new ImageRun({
                  data: currentBytes,
                  transformation: {
                    width: boxPixelSize,
                    height: boxPixelSize,
                  },
                  type: 'png',
                }),
              ],
            }),
          ],
        })
      )
    }

    tableRows.push(
      new TableRow({
        cantSplit: true,
        children: cells,
      })
    )
  }

  // Header thương hiệu (Nếu có thông tin VIP)
  const headerParagraphs: Paragraph[] = []

  if (branding && (branding.centerName || branding.logoDataUrl || branding.teacherName)) {
    const headerChildren: (TextRun | ImageRun)[] = []

    if (branding.logoDataUrl) {
      try {
        const logoBytes = dataUrlToBytes(branding.logoDataUrl)
        headerChildren.push(
          new ImageRun({
            data: logoBytes,
            transformation: {
              width: 32,
              height: 32,
            },
            type: 'png',
          })
        )
        headerChildren.push(new TextRun({ text: '  ' }))
      } catch (err) {
        console.error('Lỗi nạp logo:', err)
      }
    }

    headerChildren.push(
      new TextRun({
        text: branding.centerName || 'LUYỆN VIẾT CHỮ HÁN',
        bold: true,
        size: 22, // 11pt
        font: 'Arial',
        color: 'B91C1C', // Đỏ đô sang trọng
      })
    )

    const subInfoParts: string[] = []
    if (branding.teacherName) subInfoParts.push(`GV: ${branding.teacherName}`)
    if (branding.phone) subInfoParts.push(`Hotline: ${branding.phone}`)
    const subInfo = subInfoParts.join(' • ')

    headerParagraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 40 },
        tabStops: [{ type: TabStopType.RIGHT, position: 9600 }],
        children: [
          ...headerChildren,
          new TextRun({
            text: `\t${subInfo || branding.slogan || 'Có công mài sắt có ngày nên kim'}`,
            italics: true,
            size: 16,
            font: 'Arial',
            color: '6B7280',
          }),
        ],
      })
    )
  } else {
    // Tiêu đề mặc định
    headerParagraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 40 },
        tabStops: [{ type: TabStopType.RIGHT, position: 9600 }],
        children: [
          new TextRun({
            text: 'LUYỆN VIẾT CHỮ HÁN',
            bold: true,
            size: 24,
            font: 'Arial',
            color: '1F2937',
          }),
          new TextRun({
            text: '\tCó công mài sắt có ngày nên kim',
            italics: true,
            size: 18,
            font: 'Arial',
            color: '4B5563',
          }),
        ],
      })
    )
  }

  return {
    properties: {
      page: {
        size: {
          width: 11906, // A4: 210mm
          height: 16838, // A4: 297mm
        },
        margin: {
          top: 720,
          bottom: 720,
          left: 900,
          right: 900,
        },
      },
    },
    children: [
      ...headerParagraphs,

      // Dòng chữ mẫu và phiên âm (chỉ hiện khi có chữ)
      ...(char
        ? [
            new Paragraph({
              spacing: { before: 40, after: 20 },
              children: [
                new TextRun({
                  text: char,
                  bold: true,
                  size: 36, // 18pt
                  font: fontOpt.docxFont,
                  color: '111827',
                }),
                ...(pinyin
                  ? [
                      new TextRun({
                        text: `   [ ${pinyin} ]`,
                        size: 22,
                        font: 'Arial',
                        color: '374151',
                      }),
                    ]
                  : []),
              ],
            }),
            new Paragraph({
              spacing: { before: 0, after: 60 },
              children: [
                new TextRun({
                  text: 'Hướng dẫn: Tô theo nét chữ màu xám nhạt trong từng ô vuông bên dưới.',
                  italics: true,
                  size: 16, // 8pt
                  color: '6B7280',
                  font: 'Arial',
                }),
              ],
            }),
          ]
        : [
            new Paragraph({
              spacing: { before: 40, after: 60 },
              children: [
                new TextRun({
                  text: 'Hướng dẫn: Giấy kẻ ô Điền Tự Cách chuẩn A4 để tự luyện viết chữ Hán theo ý muốn.',
                  italics: true,
                  size: 18,
                  color: '4B5563',
                  font: 'Arial',
                }),
              ],
            }),
          ]),

      // Bảng các ô điền tự cách tập tô
      new Table({
        rows: tableRows,
        alignment: AlignmentType.CENTER,
      }),

      // Ghi chú phía dưới
      ...createNotesParagraphs(rows),
    ],
  }
}

/**
 * Tạo file Word (.docx) khổ A4 chuẩn in ấn chứa các ô tập tô chữ Hán
 * Hỗ trợ xuất 1 chữ hoặc xuất trọn bộ nhiều trang (VIP)
 */
export async function exportToWord({
  char,
  pinyin = '',
  rows = 10,
  cols = 8,
  fontId = 'yahei',
  charSize = 'medium',
  branding,
  multiPageItems,
  charRowLimit,
  onProgress,
}: ExportOptions): Promise<boolean> {
  const fontOpt = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0]

  // Xác định danh sách các trang cần xuất
  const itemsToExport: MultiPageItem[] =
    multiPageItems && multiPageItems.length > 0
      ? multiPageItems
      : [{ char, pinyin }]

  const total = itemsToExport.length

  // Pre-generate imageEmptyBytes ONCE per export job so we don't draw thousands of identical empty canvases!
  const precomputedEmptyBytes = generateTianzigeImage(
    '',
    fontOpt.fontFamily,
    charSize,
    200,
    '#c0c0c0',
    '#a0a0a0',
    fontOpt.fontWeight
  )

  // Thông báo tiến độ khởi đầu 0%
  onProgress?.(0, 0, total)

  // Khởi tạo các Section trong Word cho từng trang A4
  const sections: any[] = []
  for (let i = 0; i < total; i++) {
    const item = itemsToExport[i]
    sections.push(
      createPageSection(
        item.char,
        item.pinyin,
        rows,
        cols,
        fontOpt,
        charSize,
        branding,
        charRowLimit,
        precomputedEmptyBytes
      )
    )

    // Tiến độ giai đoạn 1 (Vẽ các trang Word): từ 0% đến 80%
    const percent = Math.min(80, Math.round(((i + 1) / total) * 80))

    // Trả quyền điều khiển cho JavaScript Event Loop định kỳ để UI cập nhật % mượt mà
    if (i % 2 === 0 || i === total - 1) {
      onProgress?.(percent, i + 1, total)
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  // Giai đoạn 2: Nén và đóng gói cấu trúc file .docx (80% -> 95%)
  onProgress?.(85, total, total)
  await new Promise((resolve) => setTimeout(resolve, 15))

  const doc = new Document({
    sections,
  })

  onProgress?.(92, total, total)
  await new Promise((resolve) => setTimeout(resolve, 15))

  // Đóng gói file Word và kích hoạt tải về máy
  const blob = await Packer.toBlob(doc)

  onProgress?.(100, total, total)
  const fileName =
    itemsToExport.length > 1
      ? `Tap_to_chu_Han_${itemsToExport.length}_trang.docx`
      : char
      ? `Tap_to_chu_${char}.docx`
      : `Giay_ke_o_tu_luyen_viet_A4.docx`

  // Tạo blob rõ ràng với MIME type chuẩn của docx
  const docxBlob = new Blob([blob], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  // Kiểm tra môi trường mobile / Webview (Facebook, Zalo, TikTok, Messenger, iOS, Android)
  const ua = navigator.userAgent || ''
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  const isInAppBrowser = /FBAN|FBAV|Instagram|Line|musical_ly|ByteLocale|Snapchat|MicroMessenger|Zalo/i.test(ua)

  // 1. Nếu trên máy tính (desktop) và trình duyệt hỗ trợ Native Save Picker, cho phép chọn nơi lưu
  if (!isMobile && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Microsoft Word Document',
            accept: {
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(docxBlob)
      await writable.close()
      return true
    } catch (pickerErr: any) {
      if (pickerErr.name === 'AbortError') {
        throw new Error('USER_CANCELLED')
      }
      // Fallback xuống cơ chế tải chuẩn nếu picker bị từ chối
    }
  }

  // 2. Kỹ thuật tải chuẩn và tương thích tối đa cho Mobile (đặc biệt In-App WebView & Safari / Chrome Mobile)
  try {
    const url = URL.createObjectURL(docxBlob)
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

    // Nếu đang trong In-App Browser của Facebook/Zalo, nhiều trường hợp không cho tải blob trực tiếp
    // Chúng ta hỗ trợ thêm saveAs để tăng cường khả năng kích hoạt
    try {
      saveAs(docxBlob, fileName)
    } catch (saveAsErr) {
      // Đã có anchor click ở trên bảo đảm
    }

    return true
  } catch (err: any) {
    console.warn('Anchor download failed, fallback to saveAs:', err)
    try {
      saveAs(docxBlob, fileName)
      return true
    } catch (fallbackErr) {
      console.error('Không thể lưu file về máy:', fallbackErr)
      throw new Error(
        isInAppBrowser
          ? 'Trình duyệt Facebook / Zalo chặn tải file. Vui lòng bấm vào dấu 3 chấm góc trên bên phải (⋮ hoặc ⋯) và chọn "Mở bằng trình duyệt" (Chrome / Safari) để tải file Word nhé!'
          : 'Không thể tải file về máy. Vui lòng kiểm tra quyền tải xuống của trình duyệt.'
      )
    }
  }
}

