
"use client";

import * as React from 'react';
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarIcon } from 'lucide-react';
import { repartoCreateSchema } from '@/lib/validators';
import type { Repartidor, Envio } from '@/types'; // Ensure Envio has necessary fields for display

export type RepartoFormValues = z.infer<typeof repartoCreateSchema>;

interface RepartoFormProps {
  initialData?: Partial<RepartoFormValues>;
  onSubmit: (values: RepartoFormValues) => Promise<void>;
  submitButtonText?: string;
  isSubmitting?: boolean;
  repartidores: Pick<Repartidor, 'id' | 'nombre_completo'>[];
  enviosPendientes: Pick<Envio, 'id' | 'tracking_number' | 'direccion_destino' | 'cliente_id'>[];
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
  const [selectedEnvios, setSelectedEnvios] = useState<string[]>(initialData?.envios_ids || []);

  const form = useForm<RepartoFormValues>({
    resolver: zodResolver(repartoCreateSchema),
    defaultValues: initialData || {
      nombre_reparto: `Reparto ${new Date().toLocaleDateString('es-AR')}`,
      repartidor_id: '',
      fecha_reparto: new Date().toISOString().split('T')[0], // Default to today
      estatus: 'pendiente_recoleccion',
      envios_ids: [],
    },
  });

  const handleEnvioSelection = (envioId: string) => {
    const newSelectedEnvios = selectedEnvios.includes(envioId)
      ? selectedEnvios.filter(id => id !== envioId)
      : [...selectedEnvios, envioId];
    setSelectedEnvios(newSelectedEnvios);
    form.setValue("envios_ids", newSelectedEnvios, { shouldValidate: true });
  };

  const handleFormSubmit = async (values: RepartoFormValues) => {
    if (selectedEnvios.length === 0) {
      toast({ title: "Validación", description: "Debe seleccionar al menos un envío para el reparto.", variant: "destructive"});
      form.setError("envios_ids", { type: "manual", message: "Debe seleccionar al menos un envío." });
      return;
    }
    await onSubmit({ ...values, envios_ids: selectedEnvios });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nombre_reparto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Reparto (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Reparto Matutino Zona Norte" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="repartidor_id"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Repartidor Asignado</FormLabel>
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
            name="fecha_reparto"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Fecha del Reparto</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormItem>
            <FormLabel>Envíos para Incluir en el Reparto</FormLabel>
            {enviosPendientes.length === 0 && <p className="text-sm text-muted-foreground">No hay envíos pendientes de recolección.</p>}
            <ScrollArea className="h-72 rounded-md border p-4">
                {enviosPendientes.map((envio) => (
                <FormField
                    key={envio.id}
                    control={form.control}
                    name="envios_ids" // This is mainly for Zod validation structure, actual selection is handled by selectedEnvios state
                    render={() => ( // field not directly used for Checkbox array state
                    <FormItem
                        key={envio.id}
                        className="flex flex-row items-start space-x-3 space-y-0 mb-3 p-2 rounded-md hover:bg-muted/50"
                    >
                        <FormControl>
                        <Checkbox
                            checked={selectedEnvios.includes(envio.id)}
                            onCheckedChange={() => handleEnvioSelection(envio.id)}
                        />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                            {envio.tracking_number} - <span className="text-muted-foreground">{envio.direccion_destino}</span>
                        </FormLabel>
                        </div>
                    </FormItem>
                    )}
                />
                ))}
            </ScrollArea>
            <FormMessage>{form.formState.errors.envios_ids?.message}</FormMessage>
        </FormItem>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}

