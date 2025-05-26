
"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin } from 'lucide-react';
import { geocodeAddressClientSide } from '@/lib/maps-utils';
import { clienteCreateSchema } from '@/lib/validators'; // Using create schema for form values

// Form values should align with the create schema if lat/lng are set by geocoding
export type ClienteFormValues = z.infer<typeof clienteCreateSchema>;

interface ClienteFormProps {
  initialData?: Partial<ClienteFormValues>;
  onSubmit: (values: ClienteFormValues) => Promise<void>;
  submitButtonText?: string;
  onSuccess?: () => void;
}

export function ClienteForm({ initialData, onSubmit, submitButtonText = "Guardar Cliente", onSuccess }: ClienteFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Fetch API key on client mount
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (key) {
      setApiKey(key);
    } else {
      console.warn("Google Maps API Key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) no está configurada.");
    }
  }, []);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteCreateSchema),
    defaultValues: initialData || {
      nombre_completo: "",
      email: "",
      telefono: "",
      direccion_predeterminada: "",
      latitud_predeterminada: null,
      longitud_predeterminada: null,
      activo: true,
      empresa_id: null,
      fecha_nacimiento: null,
      notas_internas: null,
    },
  });

  const handleGeocode = async () => {
    const address = form.getValues("direccion_predeterminada");
    if (!address) {
      toast({ title: "Geocodificación", description: "Por favor, introduce una dirección.", variant: "destructive" });
      return;
    }
    if (!apiKey) {
      toast({ title: "Error de Configuración", description: "La API Key de Google Maps no está disponible.", variant: "destructive" });
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await geocodeAddressClientSide(address, apiKey);
      if (result) {
        form.setValue("direccion_predeterminada", result.formattedAddress, { shouldValidate: true });
        form.setValue("latitud_predeterminada", result.lat, { shouldValidate: true });
        form.setValue("longitud_predeterminada", result.lng, { shouldValidate: true });
        toast({ title: "Geocodificación Exitosa", description: `Dirección verificada: ${result.formattedAddress}`, variant: "success" });
      }
    } catch (error) {
      toast({ title: "Error de Geocodificación", description: (error as Error).message, variant: "destructive" });
      form.setValue("latitud_predeterminada", null);
      form.setValue("longitud_predeterminada", null);
    } finally {
      setIsGeocoding(false);
    }
  };
  
  // Clear lat/lng if address is manually cleared after successful geocoding
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'direccion_predeterminada' && !value.direccion_predeterminada) {
        if (form.getValues('latitud_predeterminada') !== null || form.getValues('longitud_predeterminada') !== null) {
          form.setValue('latitud_predeterminada', null);
          form.setValue('longitud_predeterminada', null);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  const handleFormSubmit = async (values: ClienteFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
      if (onSuccess) onSuccess();
    } catch (error) {
      // Error should be toasted by the calling page action
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
              <FormLabel>Email (Opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ej: juan.perez@correo.com" {...field} value={field.value ?? ""} />
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
              <FormLabel>Teléfono (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 55 1234 5678" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="direccion_predeterminada"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección Predeterminada (Opcional)</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="Ej: Av. Siempre Viva 742, Springfield" {...field} value={field.value ?? ""} />
                </FormControl>
                <Button type="button" variant="outline" size="icon" onClick={handleGeocode} disabled={isGeocoding || !apiKey}>
                  {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  <span className="sr-only">Verificar Dirección</span>
                </Button>
              </div>
              <FormDescription>
                Ingresa la dirección y usa el botón para geocodificar.
                {!apiKey && <span className="text-destructive"> La API Key de Google no está configurada.</span>}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         {/* Hidden fields for lat/lng if needed for display, but form.setValue works without them */}
         {/* <Input type="hidden" {...form.register("latitud_predeterminada")} /> */}
         {/* <Input type="hidden" {...form.register("longitud_predeterminada")} /> */}
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
        <Button type="submit" className="w-full" disabled={isLoading || isGeocoding}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
