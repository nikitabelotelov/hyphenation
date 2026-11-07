/** Индексы границ переноса: 1 = после первой буквы. */
export function breakPositions(marked) {
  const positions = []
  let index = 0
  for (const char of marked) {
    if (char === '|') {
      positions.push(index)
    } else {
      index += 1
    }
  }
  return positions
}

/**
 * Сравнивает предсказание с эталоном по позициям `|`.
 * @returns {{ exact: boolean, extra: number[], missing: number[] }}
 */
export function compareBreaks(prediction, expected) {
  const predicted = new Set(breakPositions(prediction))
  const gold = new Set(breakPositions(expected))

  const extra = [...predicted].filter((pos) => !gold.has(pos)).sort((a, b) => a - b)
  const missing = [...gold].filter((pos) => !predicted.has(pos)).sort((a, b) => a - b)

  return {
    exact: extra.length === 0 && missing.length === 0,
    extra,
    missing,
  }
}
