import React from 'react'

export type CharSize = 'large' | 'medium' | 'small'

export interface FontOption {
  id: string
  name: string
  fontFamily: string
  docxFont: string
  desc: string
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'yahei',
    name: 'Microsoft YaHei (Bút bi - Nét đều)',
    fontFamily: '"Microsoft YaHei", "微软雅黑", "Noto Sans SC", sans-serif',
    docxFont: 'Microsoft YaHei',
    desc: 'Nét đều, dễ tô bằng bút bi / bút mực',
  },
  {
    id: 'kaiti',
    name: 'KaiTi (Khải thư - Chuẩn luyện viết)',
    fontFamily: '"LXGW WenKai", "KaiTi", "STKaiti", "Kaiti SC", "楷体", "Ma Shan Zheng", serif',
    docxFont: 'KaiTi',
    desc: 'Nét bút khải thư chuẩn mực để luyện viết',
  },
  {
    id: 'simhei',
    name: 'SimHei (Hắc thể - Nét đậm)',
    fontFamily: '"SimHei", "黑体", "Noto Sans SC", sans-serif',
    docxFont: 'SimHei',
    desc: 'Nét dày, vuông vắn, rõ ràng',
  },
  {
    id: 'simsun',
    name: 'SimSun (Tống thể - Cổ điển)',
    fontFamily: '"SimSun", "宋体", "Noto Serif SC", serif',
    docxFont: 'SimSun',
    desc: 'Font sách in cổ điển có chân',
  },
  {
    id: 'fangsong',
    name: 'FangSong (Phảng Tống / Tiêu đài)',
    fontFamily: '"FangSong", "仿宋", "ZCOOL XiaoWei", "Noto Serif SC", serif',
    docxFont: 'FangSong',
    desc: 'Nét thanh mảnh, tao nhã',
  },
]

export const CHAR_SIZE_MAP: Record<
  CharSize,
  { label: string; svgFontSize: number; canvasFactor: number }
> = {
  large: { label: 'To', svgFontSize: 82, canvasFactor: 0.82 },
  medium: { label: 'Trung bình', svgFontSize: 70, canvasFactor: 0.70 },
  small: { label: 'Nhỏ', svgFontSize: 56, canvasFactor: 0.56 },
}

interface TianzigeBoxProps {
  char: string
  charColor?: string
  gridColor?: string
  borderColor?: string
  fontFamily?: string
  charSize?: CharSize
}

export const TianzigeBox: React.FC<TianzigeBoxProps> = ({
  char,
  charColor = '#bcbcbc',
  gridColor = '#94a3b8',
  borderColor = '#64748b',
  fontFamily = FONT_OPTIONS[0].fontFamily,
  charSize = 'medium',
}) => {
  const fontSize = CHAR_SIZE_MAP[charSize].svgFontSize

  return (
    <div className="tianzige-wrapper">
      <svg
        viewBox="0 0 100 100"
        className="tianzige-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Nền ô màu trắng */}
        <rect x="0" y="0" width="100" height="100" fill="#ffffff" />

        {/* Khung viền ngoài hình vuông */}
        <rect
          x="1"
          y="1"
          width="98"
          height="98"
          fill="none"
          stroke={borderColor}
          strokeWidth="1.5"
        />

        {/* Đường kẻ ngang nét đứt chia đôi ô */}
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke={gridColor}
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Đường kẻ dọc nét đứt chia đôi ô */}
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="100"
          stroke={gridColor}
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* 2 đường kẻ chéo nét đứt tạo chuẩn ô Mễ Tự Cách (米字格) */}
        <line
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          stroke={gridColor}
          strokeWidth="0.8"
          strokeDasharray="4,4"
        />
        <line
          x1="100"
          y1="0"
          x2="0"
          y2="100"
          stroke={gridColor}
          strokeWidth="0.8"
          strokeDasharray="4,4"
        />

        {/* Chữ Hán màu xám nhạt để tập tô (nếu có) */}
        {char && (
          <text
            x="50"
            y="52"
            dominantBaseline="central"
            textAnchor="middle"
            fill={charColor}
            fontSize={fontSize}
            fontFamily={fontFamily}
            style={{ fontFamily }}
          >
            {char}
          </text>
        )}
      </svg>
    </div>
  )
}
