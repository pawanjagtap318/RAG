import { useEffect, useRef, useState } from 'react'
const EXAMPLES = [
  'How many vacation days do I get?',
  'How do I reset my laptop password?',
  'Can I bring a dog to the office?'
]

function highlight(text, question) {
  const words = [...new Set(
    question
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
  )]
  if (!words.length) return text

  const pattern = new RegExp(`\\b(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi')
  const parts = text.split(pattern)

  return parts.map((part, index) =>
    words.some((word) => word.toLowerCase() === part.toLowerCase())
      ? <mark key={index}>{part}</mark>
      : <span key={index}>{part}</span>
  )
}

export default function Chat({ messages, busy, asking, hasNotes, onAsk, onSeed }) {
  const [question, setQuestion] = useState('')
  const thread = useRef(null)

  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  function submit(event) {
    event.preventDefault()
    const next = question
    setQuestion('')
    onAsk(next)
  }

  return (
    <section className="chat">
      <div className="thread" ref={thread}>
        {messages.length === 0 && (
          <div className="hero">
            <p className="kicker">Try the loop</p>
            <h2>Ask the handbook.</h2>
            <p>
              Load three short company notes, then ask a question. You will see the passages
              that were retrieved before the answer.
            </p>
            {!hasNotes && (
              <button className="button solid" type="button" onClick={onSeed} disabled={busy}>
                Load sample handbook
              </button>
            )}
            <div className="chips">
              {EXAMPLES.map((example) => (
                <button key={example} type="button" disabled={!hasNotes || busy} onClick={() => onAsk(example)}>
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          if (message.role === 'user') {
            return <div className="bubble user" key={message.id}>{message.text}</div>
          }

          const question = [...messages.slice(0, index)].reverse().find((item) => item.role === 'user')?.text || ''
          const topScore = message.sources?.[0]?.score || 1

          return (
            <article className="bubble assistant" key={message.id}>
              <p className="answer">{message.text}</p>
              <p className="meta">
                {message.mode === 'llm' && `Written by ${message.model} from the passages below.`}
                {message.mode === 'notes' && 'Quoted from the closest passages.'}
                {message.mode === 'none' && 'Nothing in the notes matched.'}
                {message.trace && ` Searched ${message.trace.searched}, kept ${message.trace.kept}.`}
              </p>
              {message.sources?.length > 0 && (
                <ul className="sources">
                  {message.sources.map((source) => (
                    <li key={`${source.title}-${source.index}`}>
                      <header>
                        <strong>{source.title}</strong>
                        <span className="score" title="Cosine similarity. Higher means closer.">
                          <span className="track">
                            <i style={{ width: `${Math.max(12, (source.score / topScore) * 100)}%` }} />
                          </span>
                          <em>{source.score.toFixed(2)}</em>
                        </span>
                      </header>
                      <p>{highlight(source.text, question)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          )
        })}

        {asking && <p className="pending">Searching passages…</p>}
      </div>

      <form className="ask" onSubmit={submit}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={hasNotes ? 'Ask something your notes can answer' : 'Load the sample handbook first'}
          disabled={!hasNotes || busy}
          maxLength={400}
        />
        <button className="button solid" type="submit" disabled={!hasNotes || busy || question.trim().length < 3}>
          Ask
        </button>
      </form>
    </section>
  )
}
