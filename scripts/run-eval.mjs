import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseWords } from '../src/parseWords.js'
import { hyphenate } from '../src/hyphenate.js'
import { compareBreaks } from '../src/compare.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const trainPath = join(root, 'src/data/train.txt')
const journalPath = join(root, 'progress.md')



const ruleId = process.argv[2] ?? 'baseline'
const ruleTitle = process.argv[3] ?? 'Заглушка (без правил)'
const notes = process.argv.slice(4).join(' ')

const text = readFileSync(trainPath, 'utf8')
const entries = parseWords(text)

const failures = []
let passed = 0
let totalExtra = 0
let totalMissing = 0

for (const { word, raw } of entries) {
  const expected = raw
  const prediction = hyphenate(word)
  const { exact, extra, missing } = compareBreaks(prediction, expected)

  totalExtra += extra.length
  totalMissing += missing.length

  if (exact) {
    passed += 1
  } else {
    failures.push({ word, expected, prediction, extra, missing })
  }
}

const total = entries.length
const failed = failures.length
const stamp = new Date().toISOString().slice(0, 10)

const surpriseLines =
  failures.length === 0
    ? ['Неожиданностей нет — все слова совпали с эталоном.']
    : [
        `Не совпало: ${failed}.`,
        '',
        '| Слово | Эталон | Результат | Лишние | Пропущенные |',
        '| --- | --- | --- | --- | --- |',
        ...failures.map(
          ({ word, expected, prediction, extra, missing }) =>
            `| ${word} | ${expected} | ${prediction} | ${extra.join(', ') || '—'} | ${missing.join(', ') || '—'} |`,
        ),
      ]

const section = [
  `## ${ruleId}: ${ruleTitle}`,
  '',
  `- Дата: ${stamp}`,
  `- Прошло: **${passed}/${total}** (${((passed / total) * 100).toFixed(1)}%)`,
  `- Лишних границ всего: ${totalExtra}`,
  `- Пропущенных границ всего: ${totalMissing}`,
  notes ? `- Заметки: ${notes}` : null,
  '',
  '### Неожиданности',
  '',
  ...surpriseLines,
  '',
]
  .filter((line) => line !== null)
  .join('\n')

let journal = existsSync(journalPath) ? readFileSync(journalPath, 'utf8') : ''
if (!journal.trim()) {
  journal = [
    '# Журнал правил переноса',
    '',
    'Наивная реализация: правила применяются по очереди, без полного морфемного анализа.',
    'Эталон: `src/data/train.txt`. Совпадение — полное совпадение всех позиций `|`.',
    '',
  ].join('\n')
}

if (!journal.endsWith('\n')) journal += '\n'
journal += `\n${section}\n`

writeFileSync(journalPath, journal, 'utf8')

console.log(`${ruleId}: ${passed}/${total} exact`)
console.log(`extra breaks: ${totalExtra}, missing breaks: ${totalMissing}`)
console.log(`journal → ${journalPath}`)
if (failures.length > 0) {
  console.log(`first failures:`)
  for (const item of failures.slice(0, 8)) {
    console.log(
      `  ${item.word}: expected ${item.expected} → got ${item.prediction}`,
    )
  }
  if (failures.length > 8) console.log(`  … и ещё ${failures.length - 8}`)
}
