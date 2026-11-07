const VOWELS = new Set('аеёиоуыэюяАЕЁИОУЫЭЮЯ')

function hasVowel(part) {
  for (const char of part) {
    if (VOWELS.has(char)) return true
  }
  return false
}

function formatWithBreaks(word, breaks) {
  let result = ''
  for (let i = 0; i < word.length; i++) {
    if (breaks.has(i)) result += '|'
    result += word[i]
  }
  return result
}

/**
 * Наивный алгоритм переноса.
 * Кандидаты — все позиции между буквами; правила запрещают часть из них.
 *
 * R117: слева и справа от границы должна быть хотя бы одна гласная.
 */
export function hyphenate(word) {
  const breaks = new Set()

  for (let i = 1; i < word.length; i++) {
    const left = word.slice(0, i)
    const right = word.slice(i)
    // R117_SYLLABLE
    if (!hasVowel(left) || !hasVowel(right)) continue
    breaks.add(i)
  }

  return formatWithBreaks(word, breaks)
}
