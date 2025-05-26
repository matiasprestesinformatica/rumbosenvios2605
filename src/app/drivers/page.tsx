import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import type { Driver } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const MOCK_DRIVERS: Driver[] = [
  { id: "DRV001", name: "Carlos Rodríguez", status: "Available", vehicle: "Motocicleta Honda CB190R", contact: "+52 55 1234 5678", currentLocation: "Zona Centro" },
  { id: "DRV002", name: "Laura Gómez", status: "On Delivery", vehicle: "Bicicleta Eléctrica Specialized", contact: "+52 55 8765 4321", currentLocation: "Colonia Roma" },
  { id: "DRV003", name: "Pedro Martínez", status: "Offline", vehicle: "Motocicleta Italika FT150", contact: "+52 55 2345 6789", currentLocation: "Desconocido" },
  { id: "DRV004", name: "Sofía Hernández", status: "Available", vehicle: "Motocicleta Bajaj Pulsar NS200", contact: "+52 55 9876 5432", currentLocation: "Polanco" },
  { id: "DRV005", name: "Miguel Ángel López", status: "On Delivery", vehicle: "Automóvil Nissan March", contact: "+52 55 3456 7890", currentLocation: "Condesa" },
];

export default function DriversPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Repartidores</h1>
          <p className="text-muted-foreground">Administra tu personal de entrega.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Repartidor
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Lista de Repartidores</CardTitle>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar repartidor..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
          </div>
          <CardDescription>Total de repartidores: {MOCK_DRIVERS.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ubicación Actual</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DRIVERS.map((driver) => (
                <TableRow key={driver.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://placehold.co/100x100.png?text=${driver.name.charAt(0)}`} alt={driver.name} data-ai-hint="driver avatar" />
                        <AvatarFallback>{driver.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {driver.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        driver.status === "Available" ? "default" :
                        driver.status === "On Delivery" ? "secondary" :
                        "outline"
                      }
                      className={
                        driver.status === "Available" ? "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                        driver.status === "On Delivery" ? "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                        "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20"
                      }
                    >
                      {driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{driver.vehicle}</TableCell>
                  <TableCell>{driver.contact}</TableCell>
                  <TableCell>{driver.currentLocation || "N/A"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
