
"use client";

import type * as React from 'react';
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const estatusRepartidorEnum = z.enum(['disponible', 'en_ruta', 'ocupado', 'inactivo', 'mantenimiento']);

const repartidorFormSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  vehiculo: z.string().optional(),
  contacto: z.string().optional(), // Podría ser teléfono o email
  estatus: estatusRepartidorEnum.default('disponible'),
});

export type RepartidorFormValues = z.infer<typeof repartidorFormSchema>;

interface RepartidorFormProps {
  initialData?: Partial<RepartidorFormValues>;
  onSubmit: (values: RepartidorFormValues) => Promise<void>;
  submitButtonText?: string;
}

export function RepartidorForm({ initialData, onSubmit, submitButtonText = "Guardar Repartidor" }: RepartidorFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RepartidorFormValues>({
    resolver: zodResolver(repartidorFormSchema),
    defaultValues: initialData || {
      nombre: "",
      vehiculo: "",
      contacto: "",
      estatus: 'disponible',
    },
  });

  const handleFormSubmit = async (values: RepartidorFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al guardar el repartidor.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo del Repartidor</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Mario López" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vehiculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehículo Asignado</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Motocicleta Italika XYZ, Placas: ABC-123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contacto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Información de Contacto (Teléfono/Email)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 55 9876 5432 o mario.repartidor@correo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="estatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estatus del Repartidor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estatus" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="en_ruta">En Ruta</SelectItem>
                  <SelectItem value="ocupado">Ocupado (otro motivo)</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="mantenimiento">En Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
