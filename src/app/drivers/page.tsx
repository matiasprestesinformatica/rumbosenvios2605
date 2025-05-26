
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle, Search, Loader2 } from "lucide-react";
import type { Repartidor } from "@/types"; // Changed from Driver to Repartidor
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { getRepartidoresAction } from "@/lib/actions/repartidores.actions";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RepartidorForm, type RepartidorFormValues } from "@/components/forms/repartidor-form";
import { addRepartidorAction } from "@/lib/actions/repartidores.actions";
import type { RepartidorCreateValues } from "@/lib/validators";

export default function DriversPage() {
  const { toast } = useToast();
  const [repartidores, setRepartidores] = React.useState<Repartidor[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const fetchRepartidores = React.useCallback(async () => {
    setIsLoadingData(true);
    const result = await getRepartidoresAction({ page: 1, pageSize: 20, searchTerm });
    if (result.data) {
      setRepartidores(result.data);
    } else {
      toast({
        title: "Error al cargar repartidores",
        description: result.error?.message || "No se pudieron cargar los repartidores.",
        variant: "destructive",
      });
    }
    setIsLoadingData(false);
  }, [toast, searchTerm]);

  React.useEffect(() => {
    fetchRepartidores();
  }, [fetchRepartidores]);

  const handleAddRepartidor = async (formValues: RepartidorFormValues) => {
     const repartidorCreateData: RepartidorCreateValues = {
      nombre_completo: formValues.nombre_completo,
      telefono: formValues.telefono,
      email: formValues.email || null,
      tipo_vehiculo: formValues.tipo_vehiculo || null,
      marca_vehiculo: formValues.marca_vehiculo || null,
      modelo_vehiculo: formValues.modelo_vehiculo || null,
      placa_vehiculo: formValues.placa_vehiculo || null,
      estatus: formValues.estatus,
      activo: formValues.activo,
    };

    const result = await addRepartidorAction(repartidorCreateData);
    if (result.error) {
      toast({
        title: "Error al añadir repartidor",
        description: result.error.message,
        variant: "destructive",
      });
      throw new Error(result.error.message);
    } else {
      toast({
        title: "Repartidor Añadido",
        description: `El repartidor ${result.data?.nombre_completo} ha sido añadido exitosamente.`,
        variant: "success",
      });
      setIsAddDialogOpen(false);
      fetchRepartidores();
    }
  };
  
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchRepartidores();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Repartidores</h1>
          <p className="text-muted-foreground">Administra tu personal de entrega.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Repartidor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Repartidor</DialogTitle>
              <DialogDescription>
                Completa la información para registrar un nuevo repartidor.
              </DialogDescription>
            </DialogHeader>
            <RepartidorForm onSubmit={handleAddRepartidor} onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>Lista de Repartidores</CardTitle>
             <form onSubmit={handleSearch} className="relative ml-auto flex-1 md:grow-0 flex gap-2">
              <Input
                type="search"
                placeholder="Buscar repartidor..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button type="submit" variant="ghost" size="icon" className="absolute left-1.5 top-1.5 h-7 w-7 md:hidden">
                 <Search className="h-4 w-4 text-muted-foreground" />
              </Button>
               <Button type="submit" className="hidden md:inline-flex">
                <Search className="mr-2 h-4 w-4" /> Buscar
              </Button>
            </form>
          </div>
          <CardDescription>Total de repartidores: {isLoadingData ? '...' : repartidores.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mt-2">Cargando repartidores...</p>
            </div>
          ) : repartidores.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No hay repartidores para mostrar {searchTerm && `con el término "${searchTerm}"`}.</p>
            </div>
          ) : (
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
                {repartidores.map((driver) => (
                  <TableRow key={driver.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={driver.foto_perfil_url || `https://placehold.co/100x100.png?text=${driver.nombre_completo.charAt(0)}`} alt={driver.nombre_completo} data-ai-hint="driver avatar" />
                          <AvatarFallback>{driver.nombre_completo.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {driver.nombre_completo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          driver.estatus === "disponible" ? "default" :
                          driver.estatus === "en_ruta" ? "secondary" :
                          "outline"
                        }
                        className={
                          driver.estatus === "disponible" ? "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                          driver.estatus === "en_ruta" ? "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                          driver.estatus === "inactivo" ? "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20" :
                          "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20" // For ocupado_otro, mantenimiento
                        }
                      >
                        {driver.estatus.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{`${driver.marca_vehiculo || ""} ${driver.modelo_vehiculo || ""} (${driver.tipo_vehiculo || 'N/A'})`}</TableCell>
                    <TableCell>{driver.telefono}</TableCell>
                    <TableCell>{driver.direccion || "N/A"}</TableCell> {/* Assuming current_location is mapped to direccion for now */}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
