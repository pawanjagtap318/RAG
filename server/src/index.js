import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { connectDb } from './db.js'
import { router } from './routes.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use('/api', router)

const port = Number(process.env.PORT) || 5000
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/askbase'

try {
  await connectDb(uri)
} catch (error) {
  console.error(`Could not connect to MongoDB at ${uri}`)
  console.error('Start MongoDB locally, or set MONGO_URI in server/.env to an Atlas connection string.')
  console.error(error.message)
  process.exit(1)
}

app.listen(port, () => {
  console.log(`AskBase API on http://localhost:${port}`)
})
