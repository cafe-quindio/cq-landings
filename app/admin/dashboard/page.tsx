import Link from "next/link";
import { getConfigurations } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, QrCode, PlusCircle } from "lucide-react";
import DeleteConfigurationButton from "@/components/delete-configuration-button";
import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  await requireAuth();
  // Obtener configuraciones
  const configurations = await getConfigurations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuraciones</h1>
        <Link href="/admin/configurations/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nueva
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Configuraciones</CardTitle>
          <CardDescription>
            Administra tus configuraciones de landing pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configurations.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">
                No se encontraron configuraciones
              </p>
              <Link href="/admin/configurations/new">
                <Button variant="link">Crea tu primera configuración</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configurations.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>{config.entity_type}</TableCell>
                    <TableCell>
                      {new Date(config.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/l/${config.id}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <QrCode className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                          </Button>
                        </Link>
                        <Link href={`/admin/configurations/${config.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                        </Link>
                        <DeleteConfigurationButton id={config.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
