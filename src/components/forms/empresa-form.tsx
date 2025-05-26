
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
import { empresaCreateSchema } from '@/lib/validators';

export type EmpresaFormValues = z.infer<typeof empresaCreateSchema>;

interface EmpresaFormProps {
  initialData?: Partial<EmpresaFormValues>;
  onSubmit: (values: EmpresaFormValues) => Promise<void>;
  submitButtonText?: string;
  onSuccess?: () => void;
}

export function EmpresaForm({ initialData, onSubmit, submitButtonText = "Guardar Empresa", onSuccess }: EmpresaFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (key) {
      setApiKey(key);
    } else {
      console.warn("Google Maps API Key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) no está configurada.");
    }
  }, []);

  const form = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaCreateSchema),
    defaultValues: initialData || {
      nombre: "",
      rfc: "",
      direccion_fiscal: "",
      latitud: null,
      longitud: null,
      nombre_responsable: "",
      email_contacto: "",
      telefono_contacto: "",
      activa: true,
      razon_social: null,
      sitio_web: null,
      logo_url: null,
      notas: null,
    },
  });

  const handleGeocode = async () => {
    const address = form.getValues("direccion_fiscal");
    if (!address) {
      toast({ title: "Geocodificación", description: "Por favor, introduce una dirección fiscal.", variant: "destructive" });
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
        form.setValue("direccion_fiscal", result.formattedAddress, { shouldValidate: true });
        form.setValue("latitud", result.lat, { shouldValidate: true });
        form.setValue("longitud", result.lng, { shouldValidate: true });
        toast({ title: "Geocodificación Exitosa", description: `Dirección verificada: ${result.formattedAddress}`, variant: "success" });
      }
    } catch (error) {
      toast({ title: "Error de Geocodificación", description: (error as Error).message, variant: "destructive" });
      form.setValue("latitud", null);
      form.setValue("longitud", null);
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'direccion_fiscal' && !value.direccion_fiscal) {
        if (form.getValues('latitud') !== null || form.getValues('longitud') !== null) {
          form.setValue('latitud', null);
          form.setValue('longitud', null);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleFormSubmit = async (values: EmpresaFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
      if (onSuccess) onSuccess();
    } catch (error) {
      // Error toasting handled by the calling action
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
              <FormLabel>RFC (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: XAXX010101000" {...field} value={field.value ?? ""} />
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
              <FormLabel>Dirección Fiscal (Opcional)</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="Ej: Calle Falsa 123, Colonia Centro" {...field} value={field.value ?? ""} />
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
        <FormField
          control={form.control}
          name="nombre_responsable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Responsable/Contacto (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Ana López" {...field} value={field.value ?? ""} />
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
              <FormLabel>Email del Contacto (Opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ej: ana.lopez@empresa.com" {...field} value={field.value ?? ""} />
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
              <FormLabel>Teléfono del Contacto (Opcional)</FormLabel>
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
        <Button type="submit" className="w-full" disabled={isLoading || isGeocoding}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
