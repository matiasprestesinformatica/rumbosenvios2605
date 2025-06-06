
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Sparkles, Package as PackageIcon, Zap as ZapIcon, Bike as BikeIcon, Truck as TruckIcon } from 'lucide-react';
import { geocodeAddressClientSide, isWithinMarDelPlata } from '@/lib/maps-utils';
import { envioCreateSchema, envioUpdateSchema, type EnvioCreateValues, type EnvioUpdateValues, estadoEnvioEnumSchema } from '@/lib/validators';
import type { Cliente, TipoPaquete, TipoServicio, Envio } from '@/types';
import { getClientesForSelectAction } from '@/lib/actions/clientes.actions';
import { getTiposPaqueteForSelectAction } from '@/lib/actions/tipos-paquete.actions';
import { getTiposServicioForSelectAction } from '@/lib/actions/tipos-servicio.actions';
import { suggestDeliveryOptions, type SuggestDeliveryOptionsInput, type SuggestDeliveryOptionsOutput } from '@/ai/flows/suggest-delivery-options';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type EnvioFormValues = z.infer<typeof envioCreateSchema> | z.infer<typeof envioUpdateSchema>;


interface EnvioFormProps {
  initialData?: Partial<Envio>;
  onSubmit: (values: EnvioFormValues) => Promise<void>;
  submitButtonText?: string;
  onSuccess?: () => void;
  isEditMode?: boolean;
}

async function suggestDeliveryOptionsAction(input: SuggestDeliveryOptionsInput): Promise<SuggestDeliveryOptionsOutput> {
  try {
    const result = await suggestDeliveryOptions(input);
    return result;
  } catch (error) {
    console.error('Error in suggestDeliveryOptionsAction:', error);
    throw new Error(`AI service error: ${(error as Error).message}`);
  }
}


export function EnvioForm({ initialData, onSubmit, submitButtonText, onSuccess, isEditMode = false }: EnvioFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isGeocodingOrigin, setIsGeocodingOrigin] = useState(false);
  const [isGeocodingDest, setIsGeocodingDest] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const [clientes, setClientes] = useState<Pick<Cliente, 'id' | 'nombre_completo'>[]>([]);
  const [tiposPaquete, setTiposPaquete] = useState<Pick<TipoPaquete, 'id' | 'nombre'>[]>([]);
  const [tiposServicio, setTiposServicio] = useState<Pick<TipoServicio, 'id' | 'nombre'>[]>([]);

  const [isAiSuggestionsModalOpen, setIsAiSuggestionsModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestDeliveryOptionsOutput | null>(null);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);

  const formSchema = isEditMode ? envioUpdateSchema : envioCreateSchema;

  const form = useForm<EnvioFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente_id: '',
      direccion_origen: '',
      contacto_origen_nombre: '',
      contacto_origen_telefono: '',
      direccion_destino: '',
      contacto_destino_nombre: '',
      contacto_destino_telefono: '',
      tipo_servicio_id: '',
      cantidad_paquetes: 1,
      requiere_cobro_destino: false,
      estatus: 'pendiente_confirmacion',
      ...(initialData && isEditMode ? {
        ...initialData,
        fecha_solicitud: initialData.fecha_solicitud ? new Date(initialData.fecha_solicitud).toISOString().substring(0,16) : undefined,
        fecha_recoleccion_programada_inicio: initialData.fecha_recoleccion_programada_inicio ? new Date(initialData.fecha_recoleccion_programada_inicio).toISOString().substring(0,16) : null,
        fecha_recoleccion_programada_fin: initialData.fecha_recoleccion_programada_fin ? new Date(initialData.fecha_recoleccion_programada_fin).toISOString().substring(0,16) : null,
        fecha_entrega_estimada_inicio: initialData.fecha_entrega_estimada_inicio ? new Date(initialData.fecha_entrega_estimada_inicio).toISOString().substring(0,16) : null,
        fecha_entrega_estimada_fin: initialData.fecha_entrega_estimada_fin ? new Date(initialData.fecha_entrega_estimada_fin).toISOString().substring(0,16) : null,
        peso_total_estimado_kg: initialData.peso_total_estimado_kg ?? null,
        valor_declarado: initialData.valor_declarado ?? null,
        monto_cobro_destino: initialData.monto_cobro_destino ?? null,
        costo_envio: initialData.costo_envio ?? null,
        costo_seguro: initialData.costo_seguro ?? null,
        costo_adicional: initialData.costo_adicional ?? null,
      } : {
        fecha_solicitud: new Date().toISOString().substring(0,16),
        peso_total_estimado_kg: null,
        valor_declarado: null,
        monto_cobro_destino: null,
        costo_envio: null,
        costo_seguro: null,
        costo_adicional: null,
      }),
    } as EnvioFormValues,
  });
  
  useEffect(() => {
    if(isEditMode && initialData) {
      const transformedInitialData = {
        ...initialData,
        fecha_solicitud: initialData.fecha_solicitud ? new Date(initialData.fecha_solicitud).toISOString().substring(0,16) : undefined,
        fecha_recoleccion_programada_inicio: initialData.fecha_recoleccion_programada_inicio ? new Date(initialData.fecha_recoleccion_programada_inicio).toISOString().substring(0,16) : null,
        fecha_recoleccion_programada_fin: initialData.fecha_recoleccion_programada_fin ? new Date(initialData.fecha_recoleccion_programada_fin).toISOString().substring(0,16) : null,
        fecha_entrega_estimada_inicio: initialData.fecha_entrega_estimada_inicio ? new Date(initialData.fecha_entrega_estimada_inicio).toISOString().substring(0,16) : null,
        fecha_entrega_estimada_fin: initialData.fecha_entrega_estimada_fin ? new Date(initialData.fecha_entrega_estimada_fin).toISOString().substring(0,16) : null,
        peso_total_estimado_kg: initialData.peso_total_estimado_kg ?? null,
        valor_declarado: initialData.valor_declarado ?? null,
        monto_cobro_destino: initialData.monto_cobro_destino ?? null,
        costo_envio: initialData.costo_envio ?? null,
        costo_seguro: initialData.costo_seguro ?? null,
        costo_adicional: initialData.costo_adicional ?? null,
      };
      form.reset(transformedInitialData as EnvioFormValues);
    }
  }, [initialData, isEditMode, form]);


  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (key) setApiKey(key);
    else console.warn("Google Maps API Key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) no está configurada en variables de entorno.");

    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const [clientesRes, paquetesRes, serviciosRes] = await Promise.all([
          getClientesForSelectAction(),
          getTiposPaqueteForSelectAction({ activo: true }),
          getTiposServicioForSelectAction({ activo: true }),
        ]);
        if (clientesRes.data) setClientes(clientesRes.data); 
        else toast({ title: "Error", description: clientesRes.error?.message || "No se pudieron cargar clientes.", variant: "destructive" });
        
        if (paquetesRes.data) setTiposPaquete(paquetesRes.data); 
        else toast({ title: "Error", description: paquetesRes.error?.message || "No se pudieron cargar tipos de paquete.", variant: "destructive" });
        
        if (serviciosRes.data) setTiposServicio(serviciosRes.data); 
        else toast({ title: "Error", description: serviciosRes.error?.message || "No se pudieron cargar tipos de servicio.", variant: "destructive" });
      
      } catch (error) {
         toast({ title: "Error al cargar datos iniciales", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleGeocode = async (addressField: 'direccion_origen' | 'direccion_destino', latField: 'latitud_origen' | 'latitud_destino', lngField: 'longitud_origen' | 'longitud_destino') => {
    const address = form.getValues(addressField);
    if (!address) {
      toast({ title: "Geocodificación", description: "Por favor, introduce una dirección.", variant: "destructive" });
      return;
    }
    if (!apiKey) {
      toast({ title: "Error de Configuración", description: "La API Key de Google Maps no está disponible.", variant: "destructive" });
      return;
    }

    const setIsGeocoding = addressField === 'direccion_origen' ? setIsGeocodingOrigin : setIsGeocodingDest;
    setIsGeocoding(true);
    try {
      const result = await geocodeAddressClientSide(address, apiKey);
      if (result) {
        if (!isWithinMarDelPlata(result.lat, result.lng)) {
          toast({ title: "Dirección Fuera de Zona", description: "La dirección geocodificada está fuera de Mar del Plata. Por favor, ingrese una dirección válida dentro de la ciudad.", variant: "warning" });
          form.setValue(latField, null as any); 
          form.setValue(lngField, null as any);
        } else {
          form.setValue(addressField, result.formattedAddress, { shouldValidate: true });
          form.setValue(latField, result.lat as any, { shouldValidate: true });
          form.setValue(lngField, result.lng as any, { shouldValidate: true });
          toast({ title: "Geocodificación Exitosa", description: `Dirección verificada: ${result.formattedAddress}`, variant: "success" });
        }
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      const isZeroResults = errorMessage === "No se encontraron resultados para la dirección proporcionada.";
      toast({
        title: isZeroResults ? "Dirección no Encontrada" : "Error de Geocodificación",
        description: errorMessage,
        variant: isZeroResults ? "default" : "destructive",
      });
      form.setValue(latField, null as any);
      form.setValue(lngField, null as any);
    } finally {
      setIsGeocoding(false);
    }
  };
  
  const handleAddressChange = useCallback((fieldName: 'direccion_origen' | 'direccion_destino') => {
    const latField = fieldName === 'direccion_origen' ? 'latitud_origen' : 'latitud_destino';
    const lngField = fieldName === 'direccion_origen' ? 'longitud_origen' : 'longitud_destino';
    if (form.getValues(latField) !== null || form.getValues(lngField) !== null) {
        form.setValue(latField, null as any);
        form.setValue(lngField, null as any);
    }
  }, [form]);


  const handleFormSubmit = async (values: EnvioFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
      if (onSuccess) onSuccess();
    } catch (error) {
      // Error already toasted by the page calling this onSubmit
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAiSuggestions = async () => {
    const packageDesc = form.getValues("descripcion_paquete") || "Paquete estándar";
    const peso = form.getValues("peso_total_estimado_kg");
    const dimensiones = form.getValues("dimensiones_paquete_cm");
    let fullDescription = packageDesc;
    if (peso) fullDescription += `, ${peso}kg`;
    if (dimensiones) fullDescription += `, ${dimensiones}`;

    const input: SuggestDeliveryOptionsInput = {
      packageDescription: fullDescription,
      originAddress: form.getValues("direccion_origen"),
      destinationAddress: form.getValues("direccion_destino"),
      desiredSpeed: 'any',
    };

    setIsLoadingAiSuggestions(true);
    setAiSuggestions(null);
    setIsAiSuggestionsModalOpen(true);
    try {
      const result = await suggestDeliveryOptionsAction(input);
      setAiSuggestions(result);
    } catch (error) {
      toast({
        title: "Error al obtener sugerencias IA",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const getIconForSuggestion = (iconHint?: string) => {
    switch (iconHint) {
      case 'Truck': return <TruckIcon className="h-5 w-5 text-muted-foreground" />;
      case 'Bike': return <BikeIcon className="h-5 w-5 text-muted-foreground" />;
      case 'Zap': return <ZapIcon className="h-5 w-5 text-muted-foreground" />;
      case 'Package':
      default: return <PackageIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isDataLoading && !isEditMode) { // Show loader only on initial load for new form or while initialData is loading for edit
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando datos del formulario...</p>
      </div>
    );
  }


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Información del Cliente y Origen</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="cliente_id" render={({ field }) => (<FormItem><FormLabel>Cliente</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger></FormControl><SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre_completo}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="direccion_origen" render={({ field }) => (<FormItem><FormLabel>Dirección de Origen</FormLabel><div className="flex items-center gap-2"><FormControl><Input placeholder="Ej: Av. Colón 1234, Mar del Plata" {...field} onChange={(e) => {field.onChange(e); handleAddressChange('direccion_origen');}}/></FormControl><Button type="button" variant="outline" size="icon" onClick={() => handleGeocode('direccion_origen', 'latitud_origen', 'longitud_origen')} disabled={isGeocodingOrigin || !apiKey}>{isGeocodingOrigin ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}</Button></div><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contacto_origen_nombre" render={({ field }) => (<FormItem><FormLabel>Nombre Contacto Origen</FormLabel><FormControl><Input placeholder="Nombre de quien entrega" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contacto_origen_telefono" render={({ field }) => (<FormItem><FormLabel>Teléfono Contacto Origen</FormLabel><FormControl><Input placeholder="Teléfono de quien entrega" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Información de Destino y Paquete</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="direccion_destino" render={({ field }) => (<FormItem><FormLabel>Dirección de Destino</FormLabel><div className="flex items-center gap-2"><FormControl><Input placeholder="Ej: Av. Luro 5678, Mar del Plata" {...field} onChange={(e) => {field.onChange(e); handleAddressChange('direccion_destino');}}/></FormControl><Button type="button" variant="outline" size="icon" onClick={() => handleGeocode('direccion_destino', 'latitud_destino', 'longitud_destino')} disabled={isGeocodingDest || !apiKey}>{isGeocodingDest ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}</Button></div><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contacto_destino_nombre" render={({ field }) => (<FormItem><FormLabel>Nombre Contacto Destino</FormLabel><FormControl><Input placeholder="Nombre de quien recibe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contacto_destino_telefono" render={({ field }) => (<FormItem><FormLabel>Teléfono Contacto Destino</FormLabel><FormControl><Input placeholder="Teléfono de quien recibe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="tipo_paquete_id" render={({ field }) => (<FormItem><FormLabel>Tipo de Paquete (Opcional)</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo de paquete" /></SelectTrigger></FormControl><SelectContent>{tiposPaquete.map(tp => <SelectItem key={tp.id} value={tp.id}>{tp.nombre}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="descripcion_paquete" render={({ field }) => (<FormItem><FormLabel>Descripción del Paquete (Opcional)</FormLabel><FormControl><Textarea placeholder="Ej: Caja con documentos importantes" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="peso_total_estimado_kg" render={({ field }) => (<FormItem><FormLabel>Peso (kg, opc.)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="Ej: 1.5" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="cantidad_paquetes" render={({ field }) => (<FormItem><FormLabel>Cantidad</FormLabel><FormControl><Input type="number" step="1" placeholder="1" {...field} value={field.value ?? 1} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><div className="flex justify-between items-center"><CardTitle>Detalles del Servicio y Costos</CardTitle><Button type="button" variant="outline" onClick={handleOpenAiSuggestions} disabled={isLoadingAiSuggestions || isLoading}><Sparkles className="mr-2 h-4 w-4" />{isLoadingAiSuggestions ? "Analizando..." : "Sugerencias IA"}</Button></div></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField control={form.control} name="tipo_servicio_id" render={({ field }) => (<FormItem><FormLabel>Tipo de Servicio</FormLabel><Select onValueChange={field.onChange} value={field.value || undefined}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tipo de servicio" /></SelectTrigger></FormControl><SelectContent>{tiposServicio.map(ts => <SelectItem key={ts.id} value={ts.id}>{ts.nombre}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="valor_declarado" render={({ field }) => (<FormItem><FormLabel>Valor Declarado (ARS, opc.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Ej: 5000" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="requiere_cobro_destino" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>¿Requiere Cobro en Destino?</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                {form.watch("requiere_cobro_destino") && (<FormField control={form.control} name="monto_cobro_destino" render={({ field }) => (<FormItem><FormLabel>Monto a Cobrar (ARS)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Ej: 150.50" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />)}
              </div>
              <div className="space-y-4">
                 <FormField control={form.control} name="costo_envio" render={({ field }) => (<FormItem><FormLabel>Costo del Envío (ARS, opc.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Ej: 350.00" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormDescription>Dejar en blanco para cálculo automático posterior.</FormDescription><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="instrucciones_especiales" render={({ field }) => (<FormItem><FormLabel>Instrucciones Especiales (Opcional)</FormLabel><FormControl><Textarea placeholder="Ej: Entregar en recepción, preguntar por Ana." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </CardContent>
          </Card>
          
          {isEditMode && (
             <FormField
                control={form.control}
                name="estatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado del Envío</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {estadoEnvioEnumSchema.options.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
          )}

          <Button type="submit" className="w-full" disabled={isLoading || isGeocodingOrigin || isGeocodingDest || isDataLoading}>
            {(isLoading || isDataLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText || (isEditMode ? "Actualizar Envío" : "Crear Envío")}
          </Button>
        </form>
      </Form>

      <Dialog open={isAiSuggestionsModalOpen} onOpenChange={setIsAiSuggestionsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="text-primary h-5 w-5" />Sugerencias de Envío IA</DialogTitle>
            <DialogDescription>
              Basado en la información proporcionada, estas son algunas opciones de servicio que podrían ajustarse:
            </DialogDescription>
          </DialogHeader>
          {isLoadingAiSuggestions ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-2">Buscando sugerencias...</p>
            </div>
          ) : aiSuggestions && aiSuggestions.suggestions.length > 0 ? (
            <div className="space-y-4 py-4">
              {aiSuggestions.suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3 mb-1">
                    {getIconForSuggestion(suggestion.iconHint)}
                    <h4 className="font-semibold text-md">{suggestion.optionName}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground ml-8">{suggestion.description}</p>
                  {suggestion.estimatedTime && (
                    <p className="text-xs text-muted-foreground/80 ml-8 mt-1">Tiempo estimado: {suggestion.estimatedTime}</p>
                  )}
                </div>
              ))}
              {aiSuggestions.disclaimer && (
                <p className="text-xs text-center text-muted-foreground pt-2">{aiSuggestions.disclaimer}</p>
              )}
            </div>
          ) : (
            <p className="py-10 text-center text-muted-foreground">No se pudieron generar sugerencias en este momento.</p>
          )}
          <DialogFooter>
            <Button onClick={() => setIsAiSuggestionsModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
