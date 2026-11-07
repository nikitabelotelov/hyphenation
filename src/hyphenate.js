const VOWELS = new Set('аеёиоуыэюяАЕЁИОУЫЭЮЯ')
const SIGNS = new Set('ьъЬЪ')
const SHORT_I = new Set('йЙ')

/**
 * Односложные приставки на согласную (§ 118, прим. 1).
 * Longer first — longest match.
 * Без гласной (в, с, вз…) R117 всё равно запретит границу.
 */
const MONO_PREFIXES = [
  'пред',
  'без',
  'бес',
  'раз',
  'рас',
  'из',
  'ис',
  'воз',
  'вос',
  'низ',
  'нис',
  'под',
  'над',
  'чрез',
  'от',
  'об',
  'вз',
  'вс',
  'в',
  'с',
]

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

function leftMatchesPrefix(word, index, prefixes = MONO_PREFIXES) {
  const left = word.slice(0, index).toLowerCase()
  return prefixes.some((prefix) => left === prefix)
}

/** R118_PREFIX_VOWEL: приставка|гласная (не ы) поверх запрета CV. */
function isPrefixVowelException(word, index) {
  const next = word[index]
  if (!isVowel(next) || next.toLowerCase() === 'ы') return false
  return leftMatchesPrefix(word, index)
}

/**
 * R118_PREFIX_Y: после приставки нельзя перенос, если дальше ы.
 * роз/рос — позиционные варианты раз/рас перед ы.
 */
function isPrefixYForbidden(word, index) {
  if (word[index].toLowerCase() !== 'ы') return false
  return leftMatchesPrefix(word, index, [...MONO_PREFIXES, 'роз', 'рос'])
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
 * R118_PREFIX_VOWEL: исключение — после односложной приставки перед гласной (не ы).
 * R118_PREFIX_Y: после приставки перед ы перенос нельзя.
 * R119_1: нельзя отрывать ь/ъ от предшествующей буквы.
 * R119_2: нельзя отрывать й от предшествующей гласной.
 */
export function hyphenate(word) {
  const breaks = new Set()

  for (let i = 1; i < word.length; i++) {
    const left = word.slice(0, i)
    const right = word.slice(i)

    // R117_SYLLABLE
    if (!hasVowel(left) || !hasVowel(right)) continue

    // R119_1_SIGNS — не перед ь/ъ
    if (SIGNS.has(word[i])) continue

    // R119_2_SHORT_I — не между гласной и й
    if (isVowel(word[i - 1]) && SHORT_I.has(word[i])) continue

    // R118_PREFIX_Y
    if (isPrefixYForbidden(word, i)) continue

    // R118_CV — с исключением для приставок
    const cvBreak = isConsonant(word[i - 1]) && isVowel(word[i])
    if (cvBreak && !isPrefixVowelException(word, i)) continue

    breaks.add(i)
  }

  return formatWithBreaks(word, breaks)
}
