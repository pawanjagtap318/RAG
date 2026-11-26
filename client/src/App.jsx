import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import Chat from './components/Chat'
import Sidebar from './components/Sidebar'

export default function App() {
  const [documents, setDocuments] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [health, setHealth] = useState(null)
  const [messages, setMessages] = useState([])
  const [busy, setBusy] = useState(false)
  const [asking, setAsking] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    const [docs, status] = await Promise.all([api.documents(), api.health()])
    setDocuments(docs.documents)
    setHealth(status)
    setSelectedId((current) => current || docs.documents[0]?._id || null)
  }, [])

  useEffect(() => {
    refresh().catch((error) => setNotice(error.message))
  }, [refresh])

  async function run(action) {
    setNotice('')
    setBusy(true)
    try {
      await action()
      await refresh()
      return true
    } catch (error) {
      setNotice(error.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  function addDocument(body) {
    return run(async () => {
      const { document } = await api.createDocument(body)
      setSelectedId(document._id)
    })
  }

  function removeDocument(id) {
    return run(async () => {
      await api.deleteDocument(id)
      setSelectedId((current) => (current === id ? null : current))
    })
  }

  function loadSample() {
    return run(async () => {
      const { added } = await api.seed()
      setNotice(added ? `Added ${added} sample ${added === 1 ? 'note' : 'notes'}.` : 'The sample handbook is already loaded.')
    })
  }

  async function ask(question) {
    const text = question.trim()
    if (!text || busy) return
    setNotice('')
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text }])
    setBusy(true)
    setAsking(true)
    try {
      const result = await api.ask(text)
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', text: result.answer, ...result }
      ])
      if (result.warning) setNotice(result.warning)
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusy(false)
      setAsking(false)
    }
  }

  return (
    <div className="app">
      <header>
        <div className="brand">
          <div className="mark" aria-hidden="true">Ab</div>
          <div>
            <h1>AskBase</h1>
            <p>A mini RAG app. Answers come from your notes.</p>
          </div>
        </div>
        <div className="header-tools">
          <ol className="pipeline">
            <li><span>1</span> Save</li>
            <li><span>2</span> Chunk</li>
            <li><span>3</span> Embed</li>
            <li><span>4</span> Search</li>
            <li><span>5</span> Answer</li>
          </ol>
          <div className={health?.ok ? 'status on' : 'status'}>
            {health?.ok ? (health.llm ? 'Model writer on' : 'Answering from notes') : 'Waiting for API'}
          </div>
        </div>
      </header>

      {notice && <div className="notice">{notice}</div>}

      <main>
        <Sidebar
          documents={documents}
          selectedId={selectedId}
          busy={busy}
          health={health}
          onSelect={setSelectedId}
          onCreate={addDocument}
          onDelete={removeDocument}
          onSeed={loadSample}
        />
        <Chat
          messages={messages}
          busy={busy}
          asking={asking}
          hasNotes={documents.length > 0}
          onAsk={ask}
          onSeed={loadSample}
        />
      </main>
    </div>
  )
}
