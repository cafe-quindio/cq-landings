import { Pool } from "pg";
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { cookies } from "next/headers";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function POST(req: Request) {
    try {
        // Obtener el token desde la cookie
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Token requerido" }, { status: 400 });
        }
        const { token: tokenValue, userId } = JSON.parse(token);
        const client = await pool.connect();
        try {
            await client.query(
                `DELETE FROM sessions WHERE token = $1`,
                [tokenValue]
            );
            const res = NextResponse.json({ success: true });
            clearAuthCookie(res);
            return res;
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
    }
} 