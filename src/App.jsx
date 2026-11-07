import { useState } from 'react'
import { parseWords } from './parseWords'
import { hyphenate } from './hyphenate'
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
        entries.map(({ word, etalon }) => ({
          word,
          etalon,
          prediction: hyphenate(word),
        })),
      )
    }
    reader.onerror = () => {
      setError('Не удалось прочитать файл')
      setResults([])
    }
    reader.readAsText(file)
  }

  return (
    <main className="app">
      <h1>Переносы слов</h1>

      <label className="file-picker">
        Выбрать файл
        <input type="file" accept=".txt,text/plain" onChange={handleFileChange} />
      </label>

      {fileName && <p className="meta">Файл: {fileName}</p>}
      {error && <p className="error">{error}</p>}

      {results.length > 0 && (
        <ul className="results">
          {results.map(({ word, etalon, prediction }, index) => (
            <li key={`${word}-${index}`} className="result">
              <div>
                <span className="label">Слово:</span> {word}
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
