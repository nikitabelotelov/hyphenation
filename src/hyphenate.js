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

/**
 * R119_4: длина ведущей приставки, если дальше согласная (или ъ/ь: подъ|езд).
 * Иначе null — приставку можно дробить (бе|зумный).
 */
function leadingPrefixBeforeConsonantLen(word) {
  const lower = word.toLowerCase()
  for (const prefix of MONO_PREFIXES) {
    if (!lower.startsWith(prefix) || prefix.length >= word.length) continue
    const next = word[prefix.length]
    if (isConsonant(next) || SIGNS.has(next)) return prefix.length
  }
  return null
}

/** Запрет границ строго внутри такой приставки (по|дбить нельзя). */
function isInsidePrefixBeforeConsonant(word, index) {
  const prefixLen = leadingPrefixBeforeConsonantLen(word)
  return prefixLen !== null && index > 0 && index < prefixLen
}

/**
 * R119_7: удвоенные согласные между гласными.
 * Нельзя V|CC… (ма|сса); типичный разрыв между ними (мас|са).
 * После пары не режем дальше по согласному кластеру до гласной (рус|ский).
 * Морфемные исключения (ново|вве…) наивно не ловим.
 */
function isDoubleConsonantForbidden(word, index) {
  const prev = word[index - 1]
  const cur = word[index]
  const next = word[index + 1]

  // ма|сса — перед первой из пары CC
  if (
    isVowel(prev) &&
    isConsonant(cur) &&
    next &&
    cur.toLowerCase() === next.toLowerCase() &&
    hasVowel(word.slice(index + 2))
  ) {
    return true
  }

  // рус|с|кий → убрать с|к: после CC ещё согласные до гласной
  if (
    index >= 3 &&
    isConsonant(word[index - 2]) &&
    word[index - 2].toLowerCase() === prev.toLowerCase() &&
    isConsonant(cur) &&
    isVowel(word[index - 3]) &&
    hasVowel(word.slice(index))
  ) {
    return true
  }

  return false
}

/**
 * R119_9: буквенные аббревиатуры (МИД, СССР, КЗоТ, ТУ-104) не переносятся.
 */
function isInitialism(word) {
  const letters = [...word].filter((char) => /[а-яёa-z]/i.test(char))
  if (letters.length < 2) return false

  const uppers = letters.filter(
    (char) => char === char.toUpperCase() && char !== char.toLowerCase(),
  )

  // все буквы заглавные
  if (uppers.length === letters.length) return true

  // смешанные вроде КЗоТ: почти все заглавные
  if (uppers.length >= 2 && uppers.length >= letters.length - 1) return true

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
 * R117: слева и справа — хотя бы одна гласная.
 * R118: нельзя рвать согласную и следующую гласную (й/ь/ъ — отдельно).
 * R118_PREFIX_VOWEL: исключение — после односложной приставки перед гласной (не ы).
 * R118_PREFIX_Y: после приставки перед ы перенос нельзя.
 * R119_1: нельзя отрывать ь/ъ от предшествующей буквы.
 * R119_2: нельзя отрывать й от предшествующей гласной.
 * R119_3: нельзя оставлять одну букву в начале или конце слова.
 * R119_4: не дробить односложную приставку перед согласной (формулировка 1956).
 * R119_7: удвоенные согласные — разрыв между ними (наивно, без морфемных исключений).
 * R119_9: буквенные аббревиатуры не переносятся.
 */
export function hyphenate(word) {
  // R119_9_INITIALISM
  if (isInitialism(word)) return word

  const breaks = new Set()

  for (let i = 1; i < word.length; i++) {
    const left = word.slice(0, i)
    const right = word.slice(i)

    // R117_SYLLABLE
    if (!hasVowel(left) || !hasVowel(right)) continue

    // R119_3_SINGLE_LETTER
    if (left.length === 1 || right.length === 1) continue

    // R119_1_SIGNS — не перед ь/ъ
    if (SIGNS.has(word[i])) continue

    // R119_2_SHORT_I — не между гласной и й
    if (isVowel(word[i - 1]) && SHORT_I.has(word[i])) continue

    // R119_7_DOUBLE
    if (isDoubleConsonantForbidden(word, i)) continue

    // R119_4_PREFIX_CONSONANT — не внутри приставки перед согласной
    if (isInsidePrefixBeforeConsonant(word, i)) continue

    // R118_PREFIX_Y
    if (isPrefixYForbidden(word, i)) continue

    // R118_CV — с исключением для приставок
    const cvBreak = isConsonant(word[i - 1]) && isVowel(word[i])
    if (cvBreak && !isPrefixVowelException(word, i)) continue

    breaks.add(i)
  }

  return formatWithBreaks(word, breaks)
}
