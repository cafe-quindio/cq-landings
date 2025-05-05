"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { sql, transaction } from "@/lib/db"
import type { Configuration, CustomButton } from "@/types"

// Esquemas de validación
const CustomButtonSchema = z.object({
  id: z.string().optional(),
  button_text: z.string().min(1, "El texto del botón es obligatorio"),
  button_url: z.string().url("Debe ser una URL válida"),
  display_order: z.number().int(),
  is_active: z.boolean().default(true),
})

const ConfigurationSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  entity_type: z.string().min(1, "El tipo de entidad es obligatorio"),
  background_image_url: z.string().url("Debe ser una URL válida").nullable().optional(),
  show_menu_button: z.boolean().default(false),
  menu_button_text: z.string().nullable().optional(),
  menu_button_link: z.string().url("Debe ser una URL válida").nullable().optional(),
  wifi_config_url: z.string().url("Debe ser una URL válida").nullable().optional(),
  custom_buttons: z.array(CustomButtonSchema).default([]),
})

export type ConfigurationFormData = z.infer<typeof ConfigurationSchema>

export type ConfigurationWithButtons = Configuration & {
  custom_buttons: CustomButton[]
}

export async function createConfiguration(formData: FormData) {
  try {
    // Parsear y validar datos del formulario
    const rawData = Object.fromEntries(formData.entries())

    // Manejar botones personalizados (vienen como una cadena JSON)
    const customButtonsJson = formData.get("custom_buttons") as string
    const customButtons = customButtonsJson ? JSON.parse(customButtonsJson) : []

    // Convertir valores de checkbox
    const showMenuButton = formData.get("show_menu_button") === "on"

    const data = {
      name: formData.get("name") as string,
      entity_type: formData.get("entity_type") as string,
      background_image_url: (formData.get("background_image_url") as string) || null,
      show_menu_button: showMenuButton,
      menu_button_text: (formData.get("menu_button_text") as string) || null,
      menu_button_link: (formData.get("menu_button_link") as string) || null,
      wifi_config_url: (formData.get("wifi_config_url") as string) || null,
      custom_buttons: customButtons,
    }

    // Validar datos
    const validatedData = ConfigurationSchema.parse(data)

    // Insertar configuración usando una transacción
    await transaction(async (client) => {
      // Insertar configuración
      const configResult = await client.query(
        `INSERT INTO configurations 
        (name, entity_type, background_image_url, show_menu_button, menu_button_text, menu_button_link, wifi_config_url) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id`,
        [
          validatedData.name,
          validatedData.entity_type,
          validatedData.background_image_url,
          validatedData.show_menu_button,
          validatedData.menu_button_text,
          validatedData.menu_button_link,
          validatedData.wifi_config_url,
        ],
      )

      const configId = configResult.rows[0].id

      // Insertar botones personalizados
      if (validatedData.custom_buttons.length > 0) {
        for (const [index, button] of validatedData.custom_buttons.entries()) {
          await client.query(
            `INSERT INTO custom_buttons 
            (configuration_id, button_text, button_url, display_order, is_active) 
            VALUES ($1, $2, $3, $4, $5)`,
            [configId, button.button_text, button.button_url, button.display_order || index, button.is_active],
          )
        }
      }

      return configId
    })

    revalidatePath("/admin/dashboard")
    redirect("/admin/dashboard")
  } catch (error: any) {
    console.error("Error al crear la configuración:", error)
    throw new Error(error.message || "Error al crear la configuración")
  }
}

export async function updateConfiguration(id: string, formData: FormData) {
  try {
    // Parsear y validar datos del formulario
    const rawData = Object.fromEntries(formData.entries())

    // Manejar botones personalizados (vienen como una cadena JSON)
    const customButtonsJson = formData.get("custom_buttons") as string
    const customButtons = customButtonsJson ? JSON.parse(customButtonsJson) : []

    // Convertir valores de checkbox
    const showMenuButton = formData.get("show_menu_button") === "on"

    const data = {
      name: formData.get("name") as string,
      entity_type: formData.get("entity_type") as string,
      background_image_url: (formData.get("background_image_url") as string) || null,
      show_menu_button: showMenuButton,
      menu_button_text: (formData.get("menu_button_text") as string) || null,
      menu_button_link: (formData.get("menu_button_link") as string) || null,
      wifi_config_url: (formData.get("wifi_config_url") as string) || null,
      custom_buttons: customButtons,
    }

    // Validar datos
    const validatedData = ConfigurationSchema.parse(data)

    // Actualizar configuración usando una transacción
    await transaction(async (client) => {
      // Actualizar configuración
      await client.query(
        `UPDATE configurations 
        SET name = $1, entity_type = $2, background_image_url = $3, 
            show_menu_button = $4, menu_button_text = $5, menu_button_link = $6, 
            wifi_config_url = $7, updated_at = NOW() 
        WHERE id = $8`,
        [
          validatedData.name,
          validatedData.entity_type,
          validatedData.background_image_url,
          validatedData.show_menu_button,
          validatedData.menu_button_text,
          validatedData.menu_button_link,
          validatedData.wifi_config_url,
          id,
        ],
      )

      // Eliminar botones existentes
      await client.query(`DELETE FROM custom_buttons WHERE configuration_id = $1`, [id])

      // Insertar botones actualizados
      if (validatedData.custom_buttons.length > 0) {
        for (const [index, button] of validatedData.custom_buttons.entries()) {
          await client.query(
            `INSERT INTO custom_buttons 
            (configuration_id, button_text, button_url, display_order, is_active) 
            VALUES ($1, $2, $3, $4, $5)`,
            [id, button.button_text, button.button_url, button.display_order || index, button.is_active],
          )
        }
      }
    })

    revalidatePath("/admin/dashboard")
    revalidatePath(`/admin/configurations/${id}/edit`)
    redirect("/admin/dashboard")
  } catch (error: any) {
    console.error("Error al actualizar la configuración:", error)
    throw new Error(error.message || "Error al actualizar la configuración")
  }
}

export async function deleteConfiguration(id: string) {
  try {
    // Eliminar configuración (los botones se eliminarán automáticamente por la restricción ON DELETE CASCADE)
    await sql(`DELETE FROM configurations WHERE id = $1`, [id])

    revalidatePath("/admin/dashboard")
  } catch (error: any) {
    console.error("Error al eliminar la configuración:", error)
    throw new Error(error.message || "Error al eliminar la configuración")
  }
}

export async function getConfigurations(): Promise<Configuration[]> {
  try {
    const configurations = await sql<Configuration>(`SELECT * FROM configurations ORDER BY created_at DESC`)
    return configurations
  } catch (error: any) {
    console.error("Error al obtener las configuraciones:", error)
    throw new Error(error.message || "Error al obtener las configuraciones")
  }
}

export async function getConfigurationWithButtons(id: string): Promise<ConfigurationWithButtons | null> {
  try {
    const configurations = await sql<Configuration>(`SELECT * FROM configurations WHERE id = $1`, [id])

    if (configurations.length === 0) {
      return null
    }

    const configuration = configurations[0]

    const buttons = await sql<CustomButton>(
      `SELECT * FROM custom_buttons WHERE configuration_id = $1 ORDER BY display_order ASC`,
      [id],
    )

    return {
      ...configuration,
      custom_buttons: buttons,
    }
  } catch (error: any) {
    console.error("Error al obtener la configuración:", error)
    throw new Error(error.message || "Error al obtener la configuración")
  }
}
