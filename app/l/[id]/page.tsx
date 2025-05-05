import { notFound } from "next/navigation";
import { getConfigurationWithButtons } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Wifi, Menu } from "lucide-react";

export default async function LandingPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // Obtener configuración con sus botones
  const configuration = await getConfigurationWithButtons(id);

  if (!configuration) {
    notFound();
  }

  // Ordenar botones por display_order
  const activeButtons = configuration.custom_buttons
    .filter((button) => button.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const backgroundStyle = configuration.background_image_url
    ? {
        backgroundImage: `url(${configuration.background_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-900"
      style={backgroundStyle}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {configuration.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {configuration.entity_type}
          </p>
        </div>

        <div className="space-y-3">
          {configuration.show_menu_button && configuration.menu_button_link && (
            <a
              href={configuration.menu_button_link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button variant="default" size="lg" className="w-full">
                <Menu className="mr-2 h-4 w-4" />
                {configuration.menu_button_text || "Ver Menú"}
              </Button>
            </a>
          )}

          {configuration.wifi_config_url && (
            <a href={configuration.wifi_config_url} className="w-full">
              <Button variant="outline" size="lg" className="w-full">
                <Wifi className="mr-2 h-4 w-4" />
                Conectar a Wi-Fi
              </Button>
            </a>
          )}

          {activeButtons.map((button) => (
            <a
              key={button.id}
              href={button.button_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button variant="secondary" size="lg" className="w-full">
                {button.button_text}
              </Button>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
