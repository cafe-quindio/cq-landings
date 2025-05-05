import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from "jose"

// Constantes para JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

// Función para verificar JWT y extraer userId
async function verifyJWT(token: string): Promise<{ valid: boolean, userId?: string }> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return { valid: true, userId: payload.sub as string }
  } catch (error) {
    return { valid: false }
  }
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const token = req.cookies.get("auth_token")?.value
    if (!token) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    const { token: tokenValue, userId } = JSON.parse(token)
    console.log("token middleware", token)
    // const { valid, userId } = await verifyJWT(token)
    if (!tokenValue) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    // Ya no se valida la sesión en la base de datos aquí
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
