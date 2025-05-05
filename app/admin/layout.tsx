import type React from "react";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, PlusCircle, LayoutDashboard, UserPlus } from "lucide-react";
import LogoutButton from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">cafe quindio </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona tus landing page
          </p>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/configurations/new">
            <Button variant="ghost" className="w-full justify-start">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Configuración
            </Button>
          </Link>
          <Link href="/admin/users/new">
            <Button variant="ghost" className="w-full justify-start">
              <UserPlus className="mr-2 h-4 w-4" />
              usuarios
            </Button>
          </Link>
          <LogoutButton />
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">Panel de Administración</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
