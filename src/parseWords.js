/**
 * Парсит текст файла со словами.
 * Одна строка — одно слово. `|` — допустимая позиция переноса.
 * Пустые строки и строки, начинающиеся с `#`, игнорируются.
 *
 * @returns {{ word: string, raw: string, etalon: string | null }[]}
 * etalon — разметка с `|`, если она была; иначе null (файл без эталона).
 * raw — исходная строка; в train.txt это и есть эталон, даже без `|`.
 */
export function parseWords(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((raw) => {
      const word = raw.replaceAll('|', '')
      const hasMarks = raw.includes('|')
      return {
        word,
        raw,
        etalon: hasMarks ? raw : null,
      }
    })
}

