import { notFound } from "next/navigation";
import { getConfigurationWithButtons } from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfigurationForm from "@/components/configuration-form";
import { requireAuth } from "@/lib/auth";

export default async function EditConfigurationPage({
  params,
}: {
  params: { id: string };
}) {
  // Verificar autenticación
  const user = await requireAuth();

  const { id } = params;

  // Obtener configuración con sus botones
  const configuration = await getConfigurationWithButtons(id);

  if (!configuration) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Editar Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Configuración</CardTitle>
          <CardDescription>
            Edita tu configuración de landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigurationForm configuration={configuration} />
        </CardContent>
      </Card>
    </div>
  );
}
