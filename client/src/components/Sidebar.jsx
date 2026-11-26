import { useState } from 'react'

export default function Sidebar({ documents, selectedId, busy, health, onSelect, onCreate, onDelete, onSeed }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const selected = documents.find((doc) => doc._id === selectedId)

  async function submit(event) {
    event.preventDefault()
    const saved = await onCreate({ title, text })
    if (saved) {
      setTitle('')
      setText('')
    }
  }

  return (
    <aside className="sidebar">
      <div className="side-head">
        <div>
          <p className="kicker">Handbook</p>
          <h2>{documents.length ? `${documents.length} notes` : 'No notes yet'}</h2>
        </div>
        <button className="button ghost" type="button" onClick={onSeed} disabled={busy}>
          Load sample
        </button>
      </div>

      <form className="composer-note" onSubmit={submit}>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Time off" maxLength={80} />
        </label>
        <label>
          Note
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste a policy, a study note, or a short article."
            rows={5}
            maxLength={8000}
          />
        </label>
        <button className="button solid" type="submit" disabled={busy}>
          Add to handbook
        </button>
      </form>

      <ul className="doc-list">
        {documents.map((doc) => (
          <li key={doc._id}>
            <button
              type="button"
              className={doc._id === selectedId ? 'doc active' : 'doc'}
              onClick={() => onSelect(doc._id)}
            >
              <strong>{doc.title}</strong>
              <span>{doc.chunkCount} {doc.chunkCount === 1 ? 'passage' : 'passages'}</span>
            </button>
            <button className="text-button" type="button" onClick={() => onDelete(doc._id)} disabled={busy}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <article className="preview">
          <p className="kicker">Stored note</p>
          <h3>{selected.title}</h3>
          <p>{selected.text}</p>
        </article>
      )}

      <details className="explain">
        <summary>How a question is answered</summary>
        <ol>
          <li>The note is split into short passages.</li>
          <li>Each passage becomes a vector, a list of numbers stored in MongoDB.</li>
          <li>The question becomes a vector the same way.</li>
          <li>Passages that share your words are kept. If several match, the closer vector wins.</li>
          <li>
            {health?.llm
              ? 'A model writes the answer using only those passages.'
              : 'The best matching sentences are quoted. Add an API key later if you want a model to write the answer.'}
          </li>
        </ol>
      </details>
    </aside>
  )
}
