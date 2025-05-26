
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search } from "lucide-react";
import { EmpresaForm, type EmpresaFormValues } from "@/components/forms/empresa-form";
import { useToast } from "@/hooks/use-toast";

export default function EmpresasPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleAddEmpresa = async (values: EmpresaFormValues) => {
    console.log("Nueva empresa:", values);
    // Lógica para guardar la empresa
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast({
          title: "Empresa Añadida",
          description: `La empresa ${values.nombre} ha sido añadida exitosamente.`,
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
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h1>
          <p className="text-muted-foreground">Administra la información de las empresas asociadas.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Empresa</DialogTitle>
              <DialogDescription>
                Completa la información para registrar una nueva empresa.
              </DialogDescription>
            </DialogHeader>
            <EmpresaForm onSubmit={handleAddEmpresa} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Lista de Empresas</CardTitle>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar empresa..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
          </div>
          <CardDescription>Visualiza y gestiona todas las empresas.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for table or list of companies */}
          <div className="text-center py-10">
            <p className="text-muted-foreground">No hay empresas para mostrar.</p>
            <p className="text-sm text-muted-foreground">Empieza añadiendo una nueva empresa o carga las existentes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
