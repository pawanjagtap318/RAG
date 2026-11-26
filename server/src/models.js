import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  chunkCount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
})

const chunkSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  index: { type: Number, required: true },
  embedding: { type: [Number], required: true }
})

export const Document = mongoose.model('Document', documentSchema)
export const Chunk = mongoose.model('Chunk', chunkSchema)
