import { contentTokens } from './embed.js'

function sentencesOf(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

// No API key: quote the sentences inside the retrieved passages that share the most words
// with the question. The answer is still grounded in the notes.
export function extractAnswer(question, sources) {
  const wanted = new Set(contentTokens(question))
  const ranked = []

  sources.forEach((source, rank) => {
    sentencesOf(source.text).forEach((sentence) => {
      const overlap = contentTokens(sentence).filter((token) => wanted.has(token)).length
      if (overlap > 0) ranked.push({ sentence, overlap, rank })
    })
  })

  ranked.sort((a, b) => b.overlap - a.overlap || a.rank - b.rank)
  if (!ranked.length) return null

  const bestRank = ranked[0].rank
  return ranked
    .filter((item) => item.rank === bestRank)
    .slice(0, 2)
    .map((item) => item.sentence)
    .join(' ')
}

function provider() {
  if (process.env.OPENAI_API_KEY) {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      key: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    }
  }
  if (process.env.GROQ_API_KEY) {
    return {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b'
    }
  }
  return null
}

export function llmEnabled() {
  return Boolean(provider())
}

// Optional generation step. The model only sees the passages retrieval already picked.
export async function answerWithModel(question, sources) {
  const selected = provider()
  if (!selected) return null

  const passages = sources
    .map((source, index) => `[${index + 1}] ${source.title}\n${source.text}`)
    .join('\n\n')

  const response = await fetch(selected.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${selected.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: selected.model,
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        {
          role: 'system',
          content:
            'You answer questions about a company handbook. Use only the passages in the user message. If they do not contain the answer, say you could not find it in the notes. Write one to three plain sentences.'
        },
        {
          role: 'user',
          content: `Passages:\n${passages}\n\nQuestion: ${question}`
        }
      ]
    })
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail.slice(0, 240) || 'The model request failed')
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('The model returned an empty answer')
  return { text, model: selected.model }
}
