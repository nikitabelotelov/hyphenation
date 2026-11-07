import { useState } from 'react'
import { parseWords } from './parseWords'
import { hyphenate } from './hyphenate'
import { compareBreaks } from './compare'
import './App.css'

function App() {
  const [results, setResults] = useState([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const entries = parseWords(text)
      setResults(
        entries.map(({ word, etalon }) => {
          const prediction = hyphenate(word)
          const mismatch =
            etalon !== null && !compareBreaks(prediction, etalon).exact
          return { word, etalon, prediction, mismatch }
        }),
      )
    }
    reader.onerror = () => {
      setError('Не удалось прочитать файл')
      setResults([])
    }
    reader.readAsText(file)
  }

  const withEtalon = results.filter((item) => item.etalon !== null)
  const mismatches = withEtalon.filter((item) => item.mismatch).length

  return (
    <main className="app">
      <h1>Переносы слов</h1>

      <div className="file-actions">
        <label className="file-picker">
          Выбрать файл
          <input type="file" accept=".txt,text/plain" onChange={handleFileChange} />
        </label>
        <a
          className="sample-link"
          href={`${import.meta.env.BASE_URL}sample.txt`}
          download="sample.txt"
        >
          Скачать пример
        </a>
      </div>

      {fileName && <p className="meta">Файл: {fileName}</p>}
      {withEtalon.length > 0 && (
        <p className="meta">
          С эталоном: {withEtalon.length - mismatches}/{withEtalon.length} совпало
          {mismatches > 0 ? `, не совпало: ${mismatches}` : ''}
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {results.length > 0 && (
        <ul className="results">
          {results.map(({ word, etalon, prediction, mismatch }, index) => (
            <li
              key={`${word}-${index}`}
              className={mismatch ? 'result result-mismatch' : 'result'}
            >
              <div className="result-head">
                <div>
                  <span className="label">Слово:</span> {word}
                </div>
                {mismatch && <span className="badge">не совпало</span>}
              </div>
              {etalon !== null && (
                <div>
                  <span className="label">Эталон:</span> {etalon}
                </div>
              )}
              <div>
                <span className="label">Результат:</span> {prediction}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
