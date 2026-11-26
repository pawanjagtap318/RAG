import { extractAnswer } from './answer.js'
import { chunkText } from './chunk.js'
import { embed } from './embed.js'
import { rankChunks } from './retrieve.js'
import { samples } from './sample.js'

const chunks = samples.flatMap((sample) =>
  chunkText(sample.text).map((text, index) => ({
    title: sample.title,
    text,
    index,
    embedding: embed(text)
  }))
)

const questions = [
  'How many vacation days do I get?',
  'How do I reset my laptop password?',
  'Can I bring a dog to the office?',
  'What time does the office open?',
  'What is the staff wifi name?',
  'What is the CEO salary?'
]

console.log(`Passages: ${chunks.length}`)

for (const question of questions) {
  const useful = rankChunks(question, chunks, 3)
  const top = useful[0]
  const answer = top
    ? extractAnswer(question, useful)
    : 'I could not find that in your notes.'

  console.log(`\nQ: ${question}`)
  if (!top) {
    console.log(`   ${answer}`)
    continue
  }
  console.log(`   ${top.title}  similarity ${top.score.toFixed(3)}  shared words ${top.overlap}`)
  console.log(`   ${top.text}`)
  console.log(`   A: ${answer}`)
}
