export interface User {
  id: string
  email: string
  password_hash: string
  name: string | null
  role: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
}

export interface Configuration {
  id: string
  name: string
  entity_type: string
  background_image_url: string | null
  show_menu_button: boolean
  menu_button_text: string | null
  menu_button_link: string | null
  wifi_config_url: string | null
  created_at: string
  updated_at: string
}

export interface CustomButton {
  id: string
  configuration_id: string
  button_text: string
  button_url: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ConfigurationWithButtons extends Configuration {
  custom_buttons: CustomButton[]
}
