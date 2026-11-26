// Split a note into short passages.
// A blank line starts a new passage. A very long paragraph is split on a sentence
// so one topic does not get buried inside a whole page.

const SIZE = 420

export function chunkText(text, size = SIZE) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  return paragraphs.flatMap((paragraph) => splitLong(paragraph, size))
}

function splitLong(paragraph, size) {
  if (paragraph.length <= size) return [paragraph]

  const chunks = []
  let start = 0

  while (start < paragraph.length) {
    let end = Math.min(start + size, paragraph.length)
    if (end < paragraph.length) {
      const window = paragraph.slice(start, end)
      const breakAt = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '))
      if (breakAt > size * 0.4) end = start + breakAt + 1
    }

    const piece = paragraph.slice(start, end).trim()
    if (piece) chunks.push(piece)
    if (end >= paragraph.length) break
    start = end
  }

  return chunks
}
