
"use client";

import * as React from 'react';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { repartoLoteCreateSchema, type RepartoLoteCreateValues } from "@/lib/validators";
import type { Empresa, Cliente, Repartidor, TipoServicio, RepartoLoteClienteConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Truck, Users, CalendarDays, Sparkles, PackagePlus, VenetianMaskIcon } from "lucide-react";
import { useRouter } from 'next/navigation';

import { getEmpresasForSelectAction } from '@/lib/actions/empresas.actions';
import { getClientesByEmpresaForSelectAction } from '@/lib/actions/clientes.actions';
import { getRepartidoresAction } from '@/lib/actions/repartidores.actions';
import { getTiposServicioForSelectAction } from '@/lib/actions/tipos-servicio.actions';
import { addRepartoLoteAction } from '@/lib/actions/repartos.actions';

export default function NuevoRepartoLotePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingPageData, setIsLoadingPageData] = React.useState(true);

  const [empresas, setEmpresas] = React.useState<Pick<Empresa, 'id' | 'nombre'>[]>([]);
  const [clientesEmpresa, setClientesEmpresa] = React.useState<RepartoLoteClienteConfig[]>([]);
  const [repartidores, setRepartidores] = React.useState<Pick<Repartidor, 'id' | 'nombre_completo'>[]>([]);
  const [tiposServicio, setTiposServicio] = React.useState<Pick<TipoServicio, 'id' | 'nombre'>[]>([]);

  const form = useForm<RepartoLoteCreateValues>({
    resolver: zodResolver(repartoLoteCreateSchema),
    defaultValues: {
      empresa_id: "",
      fecha_reparto: new Date().toISOString().split('T')[0],
      repartidor_id: "",
      nombre_reparto: "",
      hora_inicio_estimada: "09:00",
      hora_fin_estimada: "18:00",
      clientes_config: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "clientes_config",
  });

  const selectedEmpresaId = form.watch("empresa_id");

  React.useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingPageData(true);
      try {
        const [empresasRes, repartidoresRes, tiposServicioRes] = await Promise.all([
          getEmpresasForSelectAction(),
          getRepartidoresAction({ pageSize: 100, estatus: 'disponible' }), // Get available drivers
          getTiposServicioForSelectAction({ activo: true })
        ]);

        if (empresasRes.data) setEmpresas(empresasRes.data);
        else toast({ title: "Error", description: "No se pudieron cargar las empresas.", variant: "destructive" });

        if (repartidoresRes.data) setRepartidores(repartidoresRes.data);
        else toast({ title: "Error", description: "No se pudieron cargar los repartidores.", variant: "destructive" });
        
        if (tiposServicioRes.data) setTiposServicio(tiposServicioRes.data);
        else toast({ title: "Error", description: "No se pudieron cargar los tipos de servicio.", variant: "destructive" });

      } catch (error) {
        toast({ title: "Error al cargar datos iniciales", description: (error as Error).message, variant: "destructive" });
      }
      setIsLoadingPageData(false);
    };
    loadInitialData();
  }, [toast]);

  React.useEffect(() => {
    if (selectedEmpresaId) {
      const loadClientes = async () => {
        const clientesRes = await getClientesByEmpresaForSelectAction(selectedEmpresaId);
        if (clientesRes.data) {
          const clientesParaForm = clientesRes.data.map(c => ({
            cliente_id: c.id,
            nombre_completo: c.nombre_completo, // For display
            direccion_predeterminada: c.direccion_predeterminada, // For display
            seleccionado: false,
            tipo_servicio_id: tiposServicio.length > 0 ? tiposServicio[0].id : null, // Default to first service type
            descripcion_paquete: "Paquete estándar",
            cantidad_paquetes: 1,
            costo_envio_manual: null,
          }));
          setClientesEmpresa(clientesParaForm);
          replace(clientesParaForm); // Update useFieldArray with new clients
        } else {
          toast({ title: "Error", description: "No se pudieron cargar los clientes de la empresa.", variant: "destructive" });
          setClientesEmpresa([]);
          replace([]);
        }
      };
      loadClientes();
    } else {
      setClientesEmpresa([]);
      replace([]);
    }
  }, [selectedEmpresaId, replace, toast, tiposServicio]);

  async function onSubmit(values: RepartoLoteCreateValues) {
    setIsLoading(true);
    try {
      const result = await addRepartoLoteAction(values);
      if (result.data) {
        toast({ title: "Éxito", description: `Reparto por lote "${result.data.nombre_reparto || result.data.id}" creado.`, variant: "success" });
        router.push(`/repartos/${result.data.id}`);
      } else {
        toast({ title: "Error", description: result.error?.message || "No se pudo crear el reparto por lote.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error Inesperado", description: (error as Error).message, variant: "destructive" });
    }
    setIsLoading(false);
  }

  if (isLoadingPageData) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Cargando datos...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <PackagePlus className="h-8 w-8 text-primary" />
          Crear Reparto por Lote (Viaje por Empresa)
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Configuración General del Reparto</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="empresa_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa Origen</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar empresa..." /></SelectTrigger></FormControl>
                      <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha_reparto"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha del Reparto</FormLabel>
                    <DatePicker 
                      date={field.value ? new Date(field.value + "T00:00:00") : undefined} // Ensure UTC interpretation
                      setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="repartidor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repartidor Asignado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar repartidor..." /></SelectTrigger></FormControl>
                      <SelectContent>{repartidores.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre_completo}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="nombre_reparto"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre del Reparto (Opcional)</FormLabel>
                    <FormControl>
                        <Input placeholder={`Ej: Lote ${form.getValues('empresa_id') ? empresas.find(e => e.id === form.getValues('empresa_id'))?.nombre : ''} - ${form.getValues('fecha_reparto')}`} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="hora_inicio_estimada"
                    render={({ field }) => ( <FormItem> <FormLabel>Hora Inicio Estimada</FormLabel> <FormControl><Input type="time" {...field} value={field.value ?? ""} /></FormControl> <FormMessage /> </FormItem> )}
                />
                <FormField
                    control={form.control}
                    name="hora_fin_estimada"
                    render={({ field }) => ( <FormItem> <FormLabel>Hora Fin Estimada</FormLabel> <FormControl><Input type="time" {...field} value={field.value ?? ""} /></FormControl> <FormMessage /> </FormItem> )}
                />
            </CardContent>
          </Card>

          {selectedEmpresaId && (
            <Card>
              <CardHeader>
                <CardTitle>2. Selección de Clientes y Configuración de Envíos</CardTitle>
                <CardDescription>
                  Marca los clientes a incluir y configura los detalles de su envío.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientesEmpresa.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Esta empresa no tiene clientes activos o no se pudieron cargar.</p>
                ) : (
                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="p-4 space-y-3">
                      {fields.map((item, index) => (
                        <Card key={item.id} className="p-4 bg-muted/30">
                          <div className="flex items-start gap-4">
                            <FormField
                              control={form.control}
                              name={`clientes_config.${index}.seleccionado`}
                              render={({ field: checkboxField }) => (
                                <FormItem className="mt-1">
                                  <FormControl>
                                    <Checkbox
                                      checked={checkboxField.value}
                                      onCheckedChange={checkboxField.onChange}
                                      aria-label={`Seleccionar ${item.nombre_completo}`}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="flex-grow space-y-2">
                              <h4 className="font-semibold">{item.nombre_completo}</h4>
                              <p className="text-xs text-muted-foreground">{item.direccion_predeterminada || "Sin dirección predeterminada"}</p>
                              
                              {form.watch(`clientes_config.${index}.seleccionado`) && (
                                <div className="grid sm:grid-cols-2 gap-4 mt-2 pt-2 border-t">
                                  <FormField
                                    control={form.control}
                                    name={`clientes_config.${index}.tipo_servicio_id`}
                                    render={({ field: selectField }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Tipo Servicio</FormLabel>
                                        <Select onValueChange={selectField.onChange} value={selectField.value ?? undefined}>
                                          <FormControl><SelectTrigger><SelectValue placeholder="Servicio..." /></SelectTrigger></FormControl>
                                          <SelectContent>{tiposServicio.map(ts => <SelectItem key={ts.id} value={ts.id}>{ts.nombre}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`clientes_config.${index}.cantidad_paquetes`}
                                    render={({ field: inputField }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Cant. Paq.</FormLabel>
                                        <FormControl><Input type="number" {...inputField} className="h-9" /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`clientes_config.${index}.descripcion_paquete`}
                                    render={({ field: inputField }) => (
                                      <FormItem className="sm:col-span-2">
                                        <FormLabel className="text-xs">Desc. Paquete (Opc.)</FormLabel>
                                        <FormControl><Input {...inputField} placeholder="Ej: Caja documentos" className="h-9" /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`clientes_config.${index}.costo_envio_manual`}
                                    render={({ field: inputField }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Costo Manual (ARS, Opc.)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...inputField} placeholder="Ej: 150.00" className="h-9" /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                 <FormMessage>{form.formState.errors.clientes_config?.message || form.formState.errors.clientes_config?.root?.message}</FormMessage>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || isLoadingPageData || !selectedEmpresaId}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
            Crear Reparto por Lote
          </Button>
        </form>
      </Form>
    </div>
  );
}
