# AskBase

A small MERN app that shows how RAG works: save a note, split it into passages, store a vector for each passage, and answer a question from the closest ones.

The handbook is fictional (Northwind), so you can demo it without bringing your own documents.

## Explain it in one minute

RAG means the model does not answer from memory alone. It **retrieves** relevant text first, then **generates** an answer from that text.

1. **Save.** A note is stored in MongoDB.
2. **Chunk.** `server/src/chunk.js` cuts the note into short passages. A short passage is easier to match than a whole page.
3. **Embed.** `server/src/embed.js` turns each passage into a vector (a list of 384 numbers). The question is turned into a vector the same way.
4. **Search.** `server/src/retrieve.js` keeps passages that share words with the question. If several do, the closer vector wins.
5. **Answer.** `server/src/answer.js` quotes the best sentences. If you add an API key, a model writes the answer and is only allowed to use those passages.

The screen shows the passages under every answer, with a similarity score, so the retrieval step is visible.

## Run it

You need Node 18+ and MongoDB.

```powershell
# from this folder
copy server\.env.example server\.env
npm run setup
npm run dev
```

Open http://localhost:5173 and click **Load sample handbook**.

MongoDB can be local (`mongodb://127.0.0.1:27017/askbase`) or an Atlas URI in `server/.env`.

Check retrieval without the database:

```powershell
npm run check
```

## Questions to demo

- How many vacation days do I get?
- How do I reset my laptop password?
- Can I bring a dog to the office?
- What time does the office open?
- What is the staff wifi name?

A question that is not in the notes, such as "What is the CEO's salary?", should come back as not found.

## Optional model

Retrieval already works with no key. To let Gemini write a direct answer using the retrieved passages, add your Gemini API key to `server/.env` and restart the API:

```
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

Get an API key from Google AI Studio. The key stays on the server; do not put it in the client code.

OpenAI and Groq are also supported as alternatives:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

or

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b
```

The header changes from "Answering from notes" to "Model writer on". The passages are still retrieved first. The model only receives those passages. Gemini is used first when its key is configured; otherwise the app checks OpenAI, then Groq.

## Files

| File | Job |
| --- | --- |
| `server/src/routes.js` | HTTP API. The `/ask` handler is the whole RAG loop. |
| `server/src/ingest.js` | Save a note, chunk it, embed it. |
| `server/src/chunk.js` | Split text. |
| `server/src/embed.js` | Text to vector, and cosine similarity. |
| `server/src/retrieve.js` | Rank passages. |
| `server/src/answer.js` | Generate an answer with Gemini, OpenAI, or Groq; quote sentences without a key. |
| `client/src/App.jsx` | React screen. |

The vectors are feature hashes (words and word-pairs scattered into a fixed list of numbers). That is a real retrieval method, and it runs offline. `embed()` is the only function you would replace with a hosted embedding model later. If you change it, delete the old notes so every vector stays the same length.

# RAG
>>>>>>> a990a1c770a15f2c4ced80b051fcff0d6457db47
