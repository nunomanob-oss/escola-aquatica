import "dotenv/config"
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.DATABASE_URL

if (!url) {
  throw new Error('DATABASE_URL não está definida. Copia .env.example para .env.')
}

// Uma única ligação partilhada pelo servidor (dev e produção).
const client = postgres(url, { max: 10 })

export const db = drizzle(client, { schema })
export { schema }
