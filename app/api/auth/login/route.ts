import { Pool } from "pg";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/auth";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
        }
        const client = await pool.connect();
        try {
            const result = await client.query(
                "SELECT * FROM users WHERE email = $1",
                [email]
            );
            if (result.rows.length === 0) {
                return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
            }
            const user = result.rows[0];
            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) {
                return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
            }
            // Crear token de sesión
            const token = randomUUID();
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 días
            await client.query(
                `INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
                [user.id, token, expiresAt]
            );
            // No devolver el hash
            delete user.password_hash;
            const res = NextResponse.json({ user, token });
            setAuthCookie(res, token, user.id);
            return res;
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
    }
} 