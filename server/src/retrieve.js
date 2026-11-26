import { cosine, embed, sharedWords } from './embed.js'

// Score every passage, drop ones that share no real words with the question,
// then prefer more shared words and use vector closeness as the tie-break.
// A few hundred passages is small enough to scan in memory.
// A larger app would ask MongoDB (or a vector index) to do this scan.

export function rankChunks(question, chunks, limit = 3) {
  const query = embed(question)

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: cosine(query, chunk.embedding),
      overlap: sharedWords(question, chunk.text)
    }))
    .filter((chunk) => chunk.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.score - a.score)
    .slice(0, limit)
}
