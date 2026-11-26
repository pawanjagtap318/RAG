import express from 'express'
import { answerWithModel, extractAnswer, llmEnabled } from './answer.js'
import { ingestDocument } from './ingest.js'
import { Chunk, Document } from './models.js'
import { rankChunks } from './retrieve.js'
import { samples } from './sample.js'

export const router = express.Router()

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

router.get('/health', wrap(async (_req, res) => {
  const [documents, chunks] = await Promise.all([
    Document.countDocuments(),
    Chunk.countDocuments()
  ])
  res.json({ ok: true, llm: llmEnabled(), documents, chunks })
}))

router.get('/documents', wrap(async (_req, res) => {
  const documents = await Document.find().sort({ createdAt: -1 }).lean()
  res.json({ documents })
}))

router.post('/documents', wrap(async (req, res) => {
  const title = String(req.body.title || '').trim()
  const text = String(req.body.text || '').trim()

  if (title.length < 2) return res.status(400).json({ error: 'Add a title.' })
  if (text.length < 40) return res.status(400).json({ error: 'Write a little more text so it can be split into passages.' })
  if (text.length > 8000) return res.status(400).json({ error: 'Keep a note under 8,000 characters for this demo.' })

  const document = await ingestDocument({ title, text })
  res.status(201).json({ document })
}))

router.delete('/documents/:id', wrap(async (req, res) => {
  const document = await Document.findByIdAndDelete(req.params.id)
  if (!document) return res.status(404).json({ error: 'Note not found.' })
  await Chunk.deleteMany({ documentId: document._id })
  res.json({ ok: true })
}))

router.post('/seed', wrap(async (_req, res) => {
  const existing = await Document.find({}, 'title').lean()
  const titles = new Set(existing.map((doc) => doc.title))
  let added = 0

  for (const sample of samples) {
    if (titles.has(sample.title)) continue
    await ingestDocument(sample)
    added += 1
  }

  res.json({ added })
}))

router.post('/ask', wrap(async (req, res) => {
  const question = String(req.body.question || '').trim()
  if (question.length < 3) return res.status(400).json({ error: 'Type a question.' })

  const chunks = await Chunk.find().lean()
  if (!chunks.length) {
    return res.status(400).json({ error: 'Add a note first, or load the sample handbook.' })
  }

  // Retrieval: keep the passages that share the question's words,
  // with vector similarity breaking ties.
  const useful = rankChunks(question, chunks, 3)

  const sources = useful.map((chunk) => ({
    title: chunk.title,
    text: chunk.text,
    index: chunk.index,
    score: Number(chunk.score.toFixed(3))
  }))

  if (!sources.length) {
    return res.json({
      answer: 'I could not find that in your notes.',
      mode: 'none',
      model: null,
      sources: [],
      trace: { searched: chunks.length, kept: 0 }
    })
  }

  // 3. Generation: a model writes the answer, or we quote the best sentences.
  let mode = 'notes'
  let model = null
  let answer = null
  let warning = null

  try {
    const generated = await answerWithModel(question, sources)
    if (generated) {
      answer = generated.text
      model = generated.model
      mode = 'llm'
    }
  } catch (error) {
    warning = 'The model request failed, so the answer is quoted from the notes.'
    console.error(error.message)
  }

  if (!answer) answer = extractAnswer(question, sources) || 'I could not find that in your notes.'

  res.json({
    answer,
    mode,
    model,
    warning,
    sources,
    trace: { searched: chunks.length, kept: sources.length }
  })
}))

router.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})
