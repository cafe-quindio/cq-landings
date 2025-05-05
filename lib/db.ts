import { Pool } from "pg"

// Creamos un pool de conexiones para reutilizarlas
let pool: Pool

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  }
  return pool
}

export async function sql<T>(query: string, params: any[] = []): Promise<T[]> {
  const client = await getPool().connect()
  try {
    const result = await client.query(query, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
