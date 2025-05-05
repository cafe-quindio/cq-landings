export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      configurations: {
        Row: {
          background_image_url: string | null
          created_at: string
          entity_type: string
          id: string
          menu_button_link: string | null
          menu_button_text: string | null
          name: string
          show_menu_button: boolean
          updated_at: string
          wifi_config_url: string | null
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          entity_type: string
          id?: string
          menu_button_link?: string | null
          menu_button_text?: string | null
          name: string
          show_menu_button?: boolean
          updated_at?: string
          wifi_config_url?: string | null
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          entity_type: string
          id?: string
          menu_button_link?: string | null
          menu_button_text?: string | null
          name: string
          show_menu_button?: boolean
          updated_at?: string
          wifi_config_url?: string | null
        }
        Relationships: []
      }
      custom_buttons: {
        Row: {
          button_text: string
          button_url: string
          configuration_id: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          button_text: string
          button_url: string
          configuration_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          button_text: string
          button_url: string
          configuration_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_buttons_configuration_id_fkey"
            columns: ["configuration_id"]
            referencedRelation: "configurations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
