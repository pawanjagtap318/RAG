import { chunkText } from './chunk.js'
import { embed } from './embed.js'
import { Chunk, Document } from './models.js'

export async function ingestDocument({ title, text }) {
  const pieces = chunkText(text)
  const doc = await Document.create({
    title,
    text,
    chunkCount: pieces.length
  })

  await Chunk.insertMany(
    pieces.map((piece, index) => ({
      documentId: doc._id,
      title,
      text: piece,
      index,
      embedding: embed(piece)
    }))
  )

  return doc
}
