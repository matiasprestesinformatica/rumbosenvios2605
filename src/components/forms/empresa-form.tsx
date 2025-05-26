
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

const empresaFormSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre de la empresa debe tener al menos 2 caracteres." }),
  rfc: z.string().optional(),
  direccion_fiscal: z.string().optional(), // Mapea a direccion_fiscal
  nombre_responsable: z.string().optional(), // Mapea a nombre_responsable
  email_contacto: z.string().email({ message: "Por favor, introduce un email de contacto válido." }).optional().or(z.literal('')), // Mapea a email_contacto
  telefono_contacto: z.string().optional().nullable(), // Añadido
  activa: z.boolean().default(true),
});

export type EmpresaFormValues = z.infer<typeof empresaFormSchema>;

interface EmpresaFormProps {
  initialData?: Partial<EmpresaFormValues>;
  onSubmit: (values: EmpresaFormValues) => Promise<void>;
  submitButtonText?: string;
  onSuccess?: () => void;
}

export function EmpresaForm({ initialData, onSubmit, submitButtonText = "Guardar Empresa", onSuccess }: EmpresaFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaFormSchema),
    defaultValues: initialData || {
      nombre: "",
      rfc: "",
      direccion_fiscal: "",
      nombre_responsable: "",
      email_contacto: "",
      telefono_contacto: "",
      activa: true,
    },
  });

  const handleFormSubmit = async (values: EmpresaFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Hubo un problema al guardar la empresa.",
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
              <FormLabel>Nombre de la Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Acme Corp S.A. de C.V." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rfc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RFC</FormLabel>
              <FormControl>
                <Input placeholder="Ej: XAXX010101000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="direccion_fiscal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección Fiscal</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Calle Falsa 123, Colonia Centro" {...field} />
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
          name="nombre_responsable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Responsable/Contacto</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Ana López" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email_contacto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email del Contacto</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ej: ana.lopez@empresa.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="telefono_contacto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono del Contacto</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 55 0000 0000" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="activa"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Empresa Activa</FormLabel>
                <FormDescription>
                  Indica si la empresa está actualmente activa en el sistema.
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
