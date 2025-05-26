
"use client";

import * as React from 'react';
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ListChecks, User, CalendarIcon, Info } from 'lucide-react';
import { repartoCreateSchema } from '@/lib/validators';
import type { Repartidor, Envio, Cliente } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export type RepartoFormValues = z.infer<typeof repartoCreateSchema>;

interface EnvioParaSeleccion extends Pick<Envio, 'id' | 'tracking_number' | 'direccion_destino' | 'empresa_origen_id'> {
    cliente?: Pick<Cliente, 'nombre_completo'> | null;
}

interface RepartoFormProps {
  initialData?: Partial<RepartoFormValues>;
  onSubmit: (values: RepartoFormValues) => Promise<void>;
  submitButtonText?: string;
  isSubmitting?: boolean;
  repartidores: Pick<Repartidor, 'id' | 'nombre_completo'>[];
  enviosPendientes: EnvioParaSeleccion[];
}

export function RepartoForm({
  initialData,
  onSubmit,
  submitButtonText = "Crear Reparto",
  isSubmitting = false,
  repartidores,
  enviosPendientes
}: RepartoFormProps) {
  const { toast } = useToast();

  const form = useForm<RepartoFormValues>({
    resolver: zodResolver(repartoCreateSchema),
    defaultValues: initialData || {
      nombre_reparto: `Reparto ${new Date().toLocaleDateString('es-AR')}`,
      repartidor_id: '',
      fecha_reparto: new Date().toISOString().split('T')[0], // Default to today
      estatus: 'pendiente_recoleccion',
      envios_ids: [],
      hora_inicio_estimada: "09:00",
      hora_fin_estimada: "18:00",
    },
  });

  const handleFormSubmit = async (values: RepartoFormValues) => {
    if (!values.envios_ids || values.envios_ids.length === 0) {
      form.setError("envios_ids", { type: "manual", message: "Debe seleccionar al menos un envío." });
      toast({ title: "Validación", description: "Por favor, seleccione al menos un envío para el reparto.", variant: "destructive"});
      return;
    }
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="nombre_reparto"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre del Reparto (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Reparto Matutino Zona Centro" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="fecha_reparto"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        Fecha del Reparto
                    </FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
            <FormField
            control={form.control}
            name="repartidor_id"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Repartidor Asignado
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona un repartidor" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {repartidores.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.nombre_completo}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="hora_inicio_estimada"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Hora Inicio Estimada</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="hora_fin_estimada"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Hora Fin Estimada</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" />
                    Seleccionar Envíos Pendientes
                </CardTitle>
                <FormDescription>
                    Selecciona los envíos que se incluirán en esta ruta de reparto.
                </FormDescription>
            </CardHeader>
            <CardContent>
                <FormField
                control={form.control}
                name="envios_ids"
                render={() => ( // We directly use controller for updating array value
                    <FormItem>
                    {enviosPendientes.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No hay envíos pendientes de recolección.</p>
                    ) : (
                        <ScrollArea className="h-72 rounded-md border">
                        <div className="p-4 space-y-1">
                            {enviosPendientes.map((envio) => (
                            <Controller
                                key={envio.id}
                                name="envios_ids"
                                control={form.control}
                                render={({ field }) => (
                                <FormItem
                                    className="flex flex-row items-center space-x-3 space-y-0 p-2.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        const currentValues = field.value || [];
                                        const newValues = currentValues.includes(envio.id)
                                        ? currentValues.filter(id => id !== envio.id)
                                        : [...currentValues, envio.id];
                                        field.onChange(newValues);
                                    }}
                                >
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(envio.id)}
                                        onCheckedChange={(checked) => {
                                            const currentValues = field.value || [];
                                            return checked
                                            ? field.onChange([...currentValues, envio.id])
                                            : field.onChange(currentValues.filter(id => id !== envio.id));
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal flex-grow cursor-pointer">
                                    <div className="flex justify-between items-center">
                                        <span>
                                            {envio.tracking_number} - <span className="text-muted-foreground">{envio.direccion_destino}</span>
                                        </span>
                                        {envio.cliente?.nombre_completo && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-4 w-4 text-muted-foreground/70 hover:text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Cliente: {envio.cliente.nombre_completo}</p>
                                                        {envio.empresa_origen_id && <p>Retiro en empresa</p>}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    </FormLabel>
                                </FormItem>
                                )}
                            />
                            ))}
                        </div>
                        </ScrollArea>
                    )}
                    <FormMessage className="mt-2">{form.formState.errors.envios_ids?.message}</FormMessage>
                    </FormItem>
                )}
                />
            </CardContent>
        </Card>


        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
