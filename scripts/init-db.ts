const { Pool } = require("pg")
const bcrypt = require("bcryptjs")

async function initializeDatabase() {
  console.log("Iniciando configuración de la base de datos...")

  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_O4EaTSXg9Ads@ep-morning-haze-a4spmrpy-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    const client = await pool.connect()

    try {
      console.log("Creando tablas...")

      // Crear tabla de usuarios
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)

      // Crear tabla de sesiones
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)

      // Crear tabla configurations
      await client.query(`
        CREATE TABLE IF NOT EXISTS configurations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          background_image_url TEXT,
          menu_button_link TEXT,
          menu_button_text TEXT,
          show_menu_button BOOLEAN NOT NULL DEFAULT false,
          wifi_config_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)

      // Crear tabla custom_buttons
      await client.query(`
        CREATE TABLE IF NOT EXISTS custom_buttons (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          configuration_id UUID NOT NULL,
          button_text TEXT NOT NULL,
          button_url TEXT NOT NULL,
          display_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT custom_buttons_configuration_id_fkey FOREIGN KEY (configuration_id) REFERENCES configurations(id) ON DELETE CASCADE
        )
      `)

      // Crear índices
      await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_configurations_name ON configurations(name)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_custom_buttons_configuration_id ON custom_buttons(configuration_id)`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_custom_buttons_display_order ON custom_buttons(display_order)`)

      console.log("Tablas creadas correctamente")

      // Verificar si ya existe un usuario administrador
      const checkResult = await client.query(
        `
        SELECT * FROM users WHERE email = $1 AND role = 'admin'
      `,
        ["admin@example.com"],
      )

      if (checkResult.rows.length === 0) {
        console.log("Creando usuario administrador...")

        // Generar hash de la contraseña
        const passwordHash = await bcrypt.hash("admin123", 10)

        // Insertar usuario administrador
        await client.query(
          `
          INSERT INTO users (email, password_hash, name, role)
          VALUES ($1, $2, $3, $4)
        `,
          ["admin@example.com", passwordHash, "Administrador", "admin"],
        )

        console.log("Usuario administrador creado exitosamente")
      } else {
        console.log("El usuario administrador ya existe")
      }
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
  } finally {
    await pool.end()
  }

  console.log("Configuración de la base de datos completada")
}

// Ejecutar la función
initializeDatabase()
