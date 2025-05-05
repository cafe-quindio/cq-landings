import { cookies } from "next/headers"
import type { NextRequest, NextResponse } from "next/server"
import { redirect } from "next/navigation"
import * as bcrypt from "bcryptjs"
import * as jose from "jose"
import { sql } from "./db"
import type { User, Session } from "@/types"

// Constantes para JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
const JWT_EXPIRY = "7d" // 7 días

// Función para crear un token JWT
export async function createJWT(userId: string): Promise<string> {
  return await new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET)
}

// Función para verificar un token JWT
export async function verifyJWT(token: string): Promise<jose.JWTVerifyResult | null> {
  try {
    return await jose.jwtVerify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Función para registrar un nuevo usuario
export async function registerUser(email: string, password: string, name?: string): Promise<User> {
  // Verificar si el usuario ya existe
  const existingUsers = await sql<User>(`SELECT * FROM users WHERE email = $1`, [email])
  if (existingUsers.length > 0) {
    throw new Error("El usuario ya existe")
  }

  // Generar hash de la contraseña
  const passwordHash = await bcrypt.hash(password, 10)

  // Insertar el nuevo usuario
  const users = await sql<User>(`INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *`, [
    email,
    passwordHash,
    name || null,
  ])

  return users[0]
}

// Función para iniciar sesión
export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  // Buscar el usuario por email
  const users = await sql<User>(`SELECT * FROM users WHERE email = $1`, [email])
  if (users.length === 0) {
    throw new Error("Credenciales inválidas")
  }

  const user = users[0]

  // Verificar la contraseña
  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    throw new Error("Credenciales inválidas")
  }

  // Crear token JWT
  const token = await createJWT(user.id)

  // Guardar la sesión en la base de datos
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 días

  await sql(`INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`, [user.id, token, expiresAt])

  return { user, token }
}

// Función para cerrar sesión
export async function logoutUser(token: string): Promise<void> {
  await sql(`DELETE FROM sessions WHERE token = $1`, [token])
}

// Función para obtener el usuario actual desde una cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value
  console.log("token getCurrentUser", token)
  if (!token) {
    return null
  }

  const { token: tokenValue, userId } = JSON.parse(token)



  // Verificar si la sesión existe en la base de datos
  const sessions = await sql<Session>(
    `SELECT * FROM sessions WHERE user_id = $1 AND token = $2 AND expires_at > NOW()`,
    [userId, tokenValue],
  )

  if (sessions.length === 0) {
    return null
  }

  // Obtener el usuario
  const users = await sql<User>(`SELECT * FROM users WHERE id = $1`, [userId])
  if (users.length === 0) {
    return null
  }

  return users[0]
}

// Función para requerir autenticación
export async function requireAuth() {
  const user = await getCurrentUser()
  console.log(user)

  if (!user) {
    redirect("/login")
  }

  return user
}

// Middleware para manejar la autenticación
export async function authMiddleware(req: NextRequest): Promise<boolean> {
  // Obtener el token de la cookie
  const token = req.cookies.get("auth_token")?.value

  if (!token) {
    return false
  }

  try {
    // Verificar el token
    const verifyResult = await verifyJWT(token)
    if (!verifyResult) {
      return false
    }

    const userId = verifyResult.payload.sub as string

    // Crear una conexión a la base de datos para el middleware
    // Nota: No podemos usar el pool directamente en el middleware
    const { Pool } = require("pg")
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    })

    const client = await pool.connect()
    try {
      // Verificar si la sesión existe en la base de datos
      const result = await client.query(
        `SELECT * FROM sessions WHERE user_id = $1 AND token = $2 AND expires_at > NOW()`,
        [userId, token],
      )

      return result.rows.length > 0
    } finally {
      client.release()
      // No cerramos el pool para evitar problemas con conexiones futuras
    }
  } catch (error) {
    console.error("Error en authMiddleware:", error)
    return false
  }
}

// Función para establecer la cookie de autenticación
export function setAuthCookie(res: NextResponse, token: string, userId: string): NextResponse {
  res.cookies.set({
    name: "auth_token",
    value: JSON.stringify({ token, userId }),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  })

  return res
}

// Función para eliminar la cookie de autenticación
export function clearAuthCookie(res: NextResponse): NextResponse {
  res.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return res
}
