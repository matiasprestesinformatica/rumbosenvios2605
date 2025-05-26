
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search, Loader2 } from "lucide-react";
import { ClienteForm, type ClienteFormValues } from "@/components/forms/cliente-form";
import { useToast } from "@/hooks/use-toast";
import { addClienteAction, getClientesAction } from "@/lib/actions/clientes.actions";
import type { Cliente } from "@/types";
import type { ClienteCreateValues } from "@/lib/validators";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ClientesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  const fetchClientes = React.useCallback(async () => {
    setIsLoadingData(true);
    const result = await getClientesAction({ page: 1, pageSize: 20, searchTerm }); // Fetch initial data, adjust pageSize as needed
    if (result.data) {
      setClientes(result.data);
    } else {
      toast({
        title: "Error al cargar clientes",
        description: result.error?.message || "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
    }
    setIsLoadingData(false);
  }, [toast, searchTerm]);

  React.useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleAddCliente = async (formValues: ClienteFormValues) => {
    const clienteCreateData: ClienteCreateValues = {
      nombre_completo: formValues.nombre_completo,
      email: formValues.email || null,
      telefono: formValues.telefono || null,
      direccion_predeterminada: formValues.direccion || null,
      activo: formValues.activo,
    };

    const result = await addClienteAction(clienteCreateData);
    if (result.error) {
      toast({
        title: "Error al añadir cliente",
        description: result.error.message,
        variant: "destructive",
      });
      throw new Error(result.error.message); // Propagate error to form
    } else {
      toast({
        title: "Cliente Añadido",
        description: `El cliente ${result.data?.nombre_completo} ha sido añadido exitosamente.`,
        variant: "success",
      });
      setIsDialogOpen(false);
      fetchClientes(); // Refetch clients to update the list
    }
  };
  
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchClientes();
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Administra la información de tus clientes.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
              <DialogDescription>
                Completa la información para registrar un nuevo cliente.
              </DialogDescription>
            </DialogHeader>
            <ClienteForm onSubmit={handleAddCliente} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>Lista de Clientes</CardTitle>
            <form onSubmit={handleSearch} className="relative ml-auto flex-1 md:grow-0 flex gap-2">
              <Input
                type="search"
                placeholder="Buscar cliente..."
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
          <CardDescription>Visualiza y gestiona todos tus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mt-2">Cargando clientes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No hay clientes para mostrar {searchTerm && `con el término "${searchTerm}"`}.</p>
              <p className="text-sm text-muted-foreground">Empieza añadiendo un nuevo cliente.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Activo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{cliente.nombre_completo}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>{cliente.telefono || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={cliente.activo ? "default" : "outline"}
                       className={
                        cliente.activo ? "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                        "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20"
                      }>
                        {cliente.activo ? "Activo" : "Inactivo"}
                      </Badge>
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
