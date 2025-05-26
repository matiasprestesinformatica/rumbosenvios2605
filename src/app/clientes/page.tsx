
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Search } from "lucide-react";
import { ClienteForm, type ClienteFormValues } from "@/components/forms/cliente-form";
import { useToast } from "@/hooks/use-toast";

export default function ClientesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleAddCliente = async (values: ClienteFormValues) => {
    console.log("Nuevo cliente:", values);
    // Aquí iría la lógica para guardar el cliente en la base de datos
    // Por ahora, simulamos una operación exitosa
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast({
          title: "Cliente Añadido",
          description: `El cliente ${values.nombre} ha sido añadido exitosamente.`,
          variant: "success",
        });
        setIsDialogOpen(false); // Cierra el diálogo después de enviar
        resolve();
      }, 1000);
    });
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
            <ClienteForm onSubmit={handleAddCliente} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Lista de Clientes</CardTitle>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cliente..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
          </div>
          <CardDescription>Visualiza y gestiona todos tus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for table or list of clients */}
          <div className="text-center py-10">
            <p className="text-muted-foreground">No hay clientes para mostrar.</p>
            <p className="text-sm text-muted-foreground">Empieza añadiendo un nuevo cliente o carga los existentes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
