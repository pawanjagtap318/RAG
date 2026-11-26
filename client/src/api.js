async function request(path, options = {}) {
  let response
  try {
    response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
  } catch {
    throw new Error('The API is not running. Start MongoDB, then run npm run dev.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  health: () => request('/api/health'),
  documents: () => request('/api/documents'),
  createDocument: (body) => request('/api/documents', { method: 'POST', body: JSON.stringify(body) }),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: 'DELETE' }),
  seed: () => request('/api/seed', { method: 'POST' }),
  ask: (question) => request('/api/ask', { method: 'POST', body: JSON.stringify({ question }) })
}
