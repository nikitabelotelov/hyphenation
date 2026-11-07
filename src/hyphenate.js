const VOWELS = new Set('аеёиоуыэюяАЕЁИОУЫЭЮЯ')
const SIGNS = new Set('ьъЬЪ')
const SHORT_I = new Set('йЙ')

function isVowel(char) {
  return VOWELS.has(char)
}

function hasVowel(part) {
  for (const char of part) {
    if (isVowel(char)) return true
  }
  return false
}

/** Обычная согласная для § 118: не гласная, не ь/ъ, не й. */
function isConsonant(char) {
  if (!/[а-яёА-ЯЁ]/.test(char)) return false
  return !isVowel(char) && !SIGNS.has(char) && !SHORT_I.has(char)
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
 * R117: слева и справа — хотя бы одна гласная.
 * R118: нельзя рвать согласную и следующую гласную (й/ь/ъ — отдельно).
 */
export function hyphenate(word) {
  const breaks = new Set()

  for (let i = 1; i < word.length; i++) {
    const left = word.slice(0, i)
    const right = word.slice(i)

    // R117_SYLLABLE
    if (!hasVowel(left) || !hasVowel(right)) continue

    // R118_CV
    if (isConsonant(word[i - 1]) && isVowel(word[i])) continue

    breaks.add(i)
  }

  return formatWithBreaks(word, breaks)
}
