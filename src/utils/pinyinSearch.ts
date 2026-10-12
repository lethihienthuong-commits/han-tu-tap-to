import pinyinDict from '../data/pinyinDict.json'

export interface HanziCandidate {
  char: string
  pinyin: string
}

const typedDict = pinyinDict as Record<string, HanziCandidate[]>

/**
 * Tìm kiếm các chữ Hán dựa theo chuỗi pinyin không dấu người dùng gõ
 * Ví dụ: gõ "hao" -> gợi ý [ { char: '好', pinyin: 'hǎo' }, { char: '号', pinyin: 'hào' }, ... ]
 */
export function searchHanziByPinyin(query: string): HanziCandidate[] {
  const clean = query.trim().toLowerCase().replace(/[^a-z]/g, '')
  if (!clean) return []

  // 1. Khớp chính xác âm tiết (ví dụ: gõ "hao", "ni", "zhong")
  if (typedDict[clean]) {
    return typedDict[clean]
  }

  // 2. Khớp tiền tố nếu người dùng đang gõ (ví dụ: gõ "ha" -> gợi ý từ "hao", "hai", "han"...)
  const results: HanziCandidate[] = []
  const seen = new Set<string>()

  for (const [key, candidates] of Object.entries(typedDict)) {
    if (key.startsWith(clean)) {
      for (const item of candidates) {
        if (!seen.has(item.char)) {
          seen.add(item.char)
          results.push(item)
          if (results.length >= 20) break
        }
      }
    }
    if (results.length >= 20) break
  }

  return results
}
