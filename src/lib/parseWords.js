/**
 * Парсит текст файла со словами.
 * Одна строка — одно слово. Символ | — эталонная позиция переноса.
 * Пустые строки и строки, начинающиеся с #, игнорируются.
 *
 * @param {string} text
 * @returns {{ word: string, etalon: string | null }[]}
 */
export function parseWords(text) {
  const lines = text.split(/\r?\n/)
  const result = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const hasEtalon = line.includes('|')
    const word = hasEtalon ? line.replaceAll('|', '') : line
    const etalon = hasEtalon ? line : null

    result.push({ word, etalon })
  }

  return result
}
