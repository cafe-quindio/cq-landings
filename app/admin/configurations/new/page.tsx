import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfigurationForm from "@/components/configuration-form";
import { requireAuth } from "@/lib/auth";

export default async function NewConfigurationPage() {
  // Verificar autenticación
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Crear Nueva landing page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configuracion de la landing page</CardTitle>
          <CardDescription>Crea una nueva landing page</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigurationForm />
        </CardContent>
      </Card>
    </div>
  );
}
