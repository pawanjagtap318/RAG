// Turn text into a vector: a fixed list of numbers.
// Similar passages point in a similar direction, so cosine similarity can rank them.
//
// This uses feature hashing (a hashed bag of words and word-pairs).
// It needs no API key and no model download, which keeps the demo easy to run.
// Retrieval only calls embed(). A hosted embedding model can replace this body later.
// If you change it, delete old chunks first — every vector must be the same length.

const DIM = 384

const STOP = new Set(`
  a an the is are was were be been being do does did doing
  to of in on for and or if at by as so but not no nor
  my i you your we our they them their it its this that
  how what when where who why can could should would will
  with from into about than then too very just also have has had
  get got me am
`.split(/\s+/).filter(Boolean))

function hashString(value) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function stem(word) {
  if (STOP.has(word)) return word
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3)
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

export function tokenize(text) {
  const lower = text.toLowerCase()
  const words = lower.split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !STOP.has(word))
  const joined = lower
    .split(/[^a-z0-9-]+/)
    .filter((part) => part.includes('-'))
    .map((part) => part.replace(/-/g, ''))
    .filter((word) => word.length > 2 && !STOP.has(word))

  return [...words, ...joined].map(stem).filter((word) => word.length > 2 && !STOP.has(word))
}

export function contentTokens(text) {
  return tokenize(text).filter((token) => !STOP.has(token) && token.length > 2)
}

export function sharedWords(left, right) {
  const vocabulary = new Set(contentTokens(right))
  return contentTokens(left).filter((token) => vocabulary.has(token)).length
}

export function embed(text) {
  const tokens = tokenize(text)
  const vector = new Array(DIM).fill(0)

  const add = (token, weight) => {
    const hash = hashString(token)
    const index = hash % DIM
    const sign = (hash & 1) === 0 ? 1 : -1
    vector[index] += sign * weight
  }

  tokens.forEach((token) => add(token, 1))
  for (let i = 0; i < tokens.length - 1; i++) {
    add(`${tokens[i]}_${tokens[i + 1]}`, 1.5)
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map((value) => value / norm)
}

export function cosine(a, b) {
  let dot = 0
  const length = Math.min(a.length, b.length)
  for (let i = 0; i < length; i++) dot += a[i] * b[i]
  return dot
}
