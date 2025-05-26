
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
import { estadoRepartidorEnumSchema, tipoVehiculoEnumSchema } from '@/lib/validators'; // Import enums

const repartidorFormSchema = z.object({
  nombre_completo: z.string().min(2, { message: "El nombre completo debe tener al menos 2 caracteres." }),
  telefono: z.string().min(8, "Teléfono inválido."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  tipo_vehiculo: tipoVehiculoEnumSchema.optional().nullable(),
  marca_vehiculo: z.string().optional(),
  modelo_vehiculo: z.string().optional(),
  placa_vehiculo: z.string().optional(),
  estatus: estadoRepartidorEnumSchema.default('inactivo'),
  activo: z.boolean().default(true),
});

export type RepartidorFormValues = z.infer<typeof repartidorFormSchema>;

interface RepartidorFormProps {
  initialData?: Partial<RepartidorFormValues>;
  onSubmit: (values: RepartidorFormValues) => Promise<void>;
  submitButtonText?: string;
  onSuccess?: () => void;
}

export function RepartidorForm({ initialData, onSubmit, submitButtonText = "Guardar Repartidor", onSuccess }: RepartidorFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RepartidorFormValues>({
    resolver: zodResolver(repartidorFormSchema),
    defaultValues: initialData || {
      nombre_completo: "",
      telefono: "",
      email: "",
      tipo_vehiculo: undefined,
      marca_vehiculo: "",
      modelo_vehiculo: "",
      placa_vehiculo: "",
      estatus: 'inactivo',
      activo: true,
    },
  });

  const handleFormSubmit = async (values: RepartidorFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Hubo un problema al guardar el repartidor.",
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
          name="nombre_completo"
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
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 55 9876 5432" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ej: mario.repartidor@correo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tipo_vehiculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Vehículo (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de vehículo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="moto">Moto</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="bicicleta">Bicicleta</SelectItem>
                  <SelectItem value="utilitario_pequeno">Utilitario Pequeño</SelectItem>
                  <SelectItem value="utilitario_grande">Utilitario Grande</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="marca_vehiculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca del Vehículo (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Honda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="modelo_vehiculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo del Vehículo (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Cargo 150" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="placa_vehiculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa del Vehículo (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: XYZ-123" {...field} />
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
                  <SelectItem value="ocupado_otro">Ocupado (otro motivo)</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
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
