
"use client";

import type * as React from 'react';
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const clienteFormSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un email válido." }).optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  activo: z.boolean().default(true),
});

export type ClienteFormValues = z.infer<typeof clienteFormSchema>;

interface ClienteFormProps {
  initialData?: Partial<ClienteFormValues>;
  onSubmit: (values: ClienteFormValues) => Promise<void>;
  submitButtonText?: string;
}

export function ClienteForm({ initialData, onSubmit, submitButtonText = "Guardar Cliente" }: ClienteFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: initialData || {
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      activo: true,
    },
  });

  const handleFormSubmit = async (values: ClienteFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al guardar el cliente.",
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
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Juan Pérez" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ej: juan.perez@correo.com" {...field} />
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
                <Input placeholder="Ej: 55 1234 5678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Av. Siempre Viva 742" {...field} />
              </FormControl>
              <FormDescription>
                Para autocompletado de dirección, considera integrar un servicio como Google Places API.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Estado Activo</FormLabel>
                <FormDescription>
                  Indica si el cliente está actualmente activo en el sistema.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
