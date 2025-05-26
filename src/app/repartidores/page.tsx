
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search } from "lucide-react";
import { RepartidorForm, type RepartidorFormValues } from "@/components/forms/repartidor-form";
import { useToast } from "@/hooks/use-toast";

export default function RepartidoresPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleAddRepartidor = async (values: RepartidorFormValues) => {
    console.log("Nuevo repartidor:", values);
    // Lógica para guardar el repartidor
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast({
          title: "Repartidor Añadido",
          description: `El repartidor ${values.nombre} ha sido añadido exitosamente.`,
          variant: "success",
        });
        setIsDialogOpen(false);
        resolve();
      }, 1000);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Repartidores</h1>
          <p className="text-muted-foreground">Administra tu personal de entrega.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <RepartidorForm onSubmit={handleAddRepartidor} />
          </DialogContent>
        </Dialog>
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
          <CardDescription>Visualiza y gestiona todos tus repartidores.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for table or list of drivers */}
          <div className="text-center py-10">
            <p className="text-muted-foreground">No hay repartidores para mostrar.</p>
            <p className="text-sm text-muted-foreground">Empieza añadiendo un nuevo repartidor o carga los existentes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
