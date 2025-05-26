
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Search, Loader2 } from "lucide-react";
import { EmpresaForm, type EmpresaFormValues } from "@/components/forms/empresa-form";
import { useToast } from "@/hooks/use-toast";
import { addEmpresaAction, getEmpresasAction } from "@/lib/actions/empresas.actions";
import type { Empresa } from "@/types";
import type { EmpresaCreateValues } from "@/lib/validators";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function EmpresasPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  const fetchEmpresas = React.useCallback(async () => {
    setIsLoadingData(true);
    const result = await getEmpresasAction({ page: 1, pageSize: 20, searchTerm });
    if (result.data) {
      setEmpresas(result.data);
    } else {
      toast({
        title: "Error al cargar empresas",
        description: result.error?.message || "No se pudieron cargar las empresas.",
        variant: "destructive",
      });
    }
    setIsLoadingData(false);
  }, [toast, searchTerm]);

  React.useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  const handleAddEmpresa = async (formValues: EmpresaFormValues) => {
    const empresaCreateData: EmpresaCreateValues = {
      nombre: formValues.nombre,
      rfc: formValues.rfc || null,
      direccion_fiscal: formValues.direccion_fiscal || null,
      nombre_responsable: formValues.nombre_responsable || null,
      email_contacto: formValues.email_contacto || null,
      telefono_contacto: formValues.telefono_contacto || null,
      activa: formValues.activa,
    };

    const result = await addEmpresaAction(empresaCreateData);
    if (result.error) {
      toast({
        title: "Error al añadir empresa",
        description: result.error.message,
        variant: "destructive",
      });
      throw new Error(result.error.message);
    } else {
      toast({
        title: "Empresa Añadida",
        description: `La empresa ${result.data?.nombre} ha sido añadida exitosamente.`,
        variant: "success",
      });
      setIsDialogOpen(false);
      fetchEmpresas();
    }
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchEmpresas();
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
            <EmpresaForm onSubmit={handleAddEmpresa} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>Lista de Empresas</CardTitle>
             <form onSubmit={handleSearch} className="relative ml-auto flex-1 md:grow-0 flex gap-2">
              <Input
                type="search"
                placeholder="Buscar empresa..."
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
          <CardDescription>Visualiza y gestiona todas las empresas.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoadingData ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mt-2">Cargando empresas...</p>
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No hay empresas para mostrar {searchTerm && `con el término "${searchTerm}"`}.</p>
              <p className="text-sm text-muted-foreground">Empieza añadiendo una nueva empresa.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>Email Contacto</TableHead>
                  <TableHead>Activa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((empresa) => (
                  <TableRow key={empresa.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{empresa.nombre}</TableCell>
                    <TableCell>{empresa.rfc || '-'}</TableCell>
                    <TableCell>{empresa.email_contacto || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={empresa.activa ? "default" : "outline"}
                       className={
                        empresa.activa ? "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                        "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20"
                      }>
                        {empresa.activa ? "Activa" : "Inactiva"}
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
