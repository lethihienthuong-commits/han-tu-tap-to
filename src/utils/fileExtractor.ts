import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import * as pdfjsLib from 'pdfjs-dist'

// Import worker trực tiếp từ pdfjs-dist để đảm bảo offline/local chạy trơn tru
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Cấu hình worker local
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * Đọc nội dung văn bản từ file Word (.docx), Excel (.xlsx, .xls), hoặc PDF (.pdf)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase()
  const arrayBuffer = await file.arrayBuffer()

  // 1. File Word (.docx)
  if (fileName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value || ''
  }

  // 2. File Excel (.xlsx, .xls, .csv)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    let fullText = ''
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName]
      const text = XLSX.utils.sheet_to_txt(sheet)
      fullText += text + '\n'
    })
    return fullText
  }

  // 3. File PDF (.pdf) - Cấu hình CMaps để giải mã font tiếng Trung chính xác
  if (fileName.endsWith('.pdf')) {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/',
    })
    const pdfDoc = await loadingTask.promise
    let fullText = ''
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean)
      fullText += pageStrings.join(' ') + '\n'
    }
    return fullText
  }

  // File văn bản thuần .txt
  if (fileName.endsWith('.txt')) {
    const textDecoder = new TextDecoder('utf-8')
    return textDecoder.decode(arrayBuffer)
  }

  throw new Error('Định dạng file không được hỗ trợ. Vui lòng tải lên file Word (.docx), Excel (.xlsx, .xls) hoặc PDF (.pdf).')
}
