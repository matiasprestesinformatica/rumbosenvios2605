"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { suggestDeliveryRoutesServerAction } from '@/lib/actions'; // To be created
import type { SuggestDeliveryRoutesOutput } from '@/ai/flows/suggest-delivery-routes';
import { Loader2, PlusCircle, Trash2, Route as RouteIcon } from 'lucide-react';

const formSchema = z.object({
  currentLocation: z.string().min(1, "La ubicación actual es requerida."),
  destinations: z.array(z.string().min(1, "El destino no puede estar vacío.")).min(1, "Se requiere al menos un destino."),
  trafficConditions: z.string().min(1, "Las condiciones del tráfico son requeridas."),
  weatherConditions: z.string().min(1, "Las condiciones climáticas son requeridas."),
  deliveryDeadlines: z.array(z.string().refine(val => !isNaN(Date.parse(val)), { message: "Fecha inválida. Usar formato ISO." })).min(1, "Se requiere al menos una fecha límite."),
});

type SuggestionFormValues = z.infer<typeof formSchema>;

export default function SuggestionForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestDeliveryRoutesOutput | null>(null);

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentLocation: "",
      destinations: [""],
      trafficConditions: "Normal",
      weatherConditions: "Soleado",
      deliveryDeadlines: [new Date().toISOString().substring(0, 16)], // Default to current datetime-local format
    },
  });

  const { fields: destinationFields, append: appendDestination, remove: removeDestination } = useFieldArray({
    control: form.control,
    name: "destinations",
  });

  const { fields: deadlineFields, append: appendDeadline, remove: removeDeadline } = useFieldArray({
    control: form.control,
    name: "deliveryDeadlines",
  });
  
  async function onSubmit(values: SuggestionFormValues) {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await suggestDeliveryRoutesServerAction(values);
      setSuggestions(result);
      toast({
        title: "Sugerencias Generadas",
        description: "Se han generado nuevas rutas de entrega.",
      });
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast({
        title: "Error al Generar Sugerencias",
        description: (error as Error).message || "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Generar Sugerencias de Ruta</CardTitle>
          <CardDescription>Introduce los detalles para obtener rutas optimizadas por IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación Actual del Vehículo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Bodega Central, Av. Principal 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>Destinos</Label>
                {destinationFields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`destinations.${index}`}
                    render={({ field: itemField }) => (
                      <FormItem className="flex items-center gap-2 mt-1">
                        <FormControl>
                          <Input placeholder={`Destino ${index + 1}`} {...itemField} />
                        </FormControl>
                        {destinationFields.length > 1 && (
                           <Button type="button" variant="ghost" size="icon" onClick={() => removeDestination(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendDestination("")} className="mt-2">
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Destino
                </Button>
              </div>
              
              <div>
                <Label>Fechas Límite de Entrega (ISO)</Label>
                 {deadlineFields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`deliveryDeadlines.${index}`}
                    render={({ field: itemField }) => (
                      <FormItem className="flex items-center gap-2 mt-1">
                        <FormControl>
                          <Input type="datetime-local" placeholder={`Fecha Límite Destino ${index + 1}`} {...itemField} />
                        </FormControl>
                         {deadlineFields.length > 1 && (
                           <Button type="button" variant="ghost" size="icon" onClick={() => removeDeadline(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendDeadline(new Date().toISOString().substring(0,16))} className="mt-2">
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Fecha Límite
                </Button>
                 <p className="text-xs text-muted-foreground mt-1">Asegúrate que el número de fechas límite coincida con el número de destinos.</p>
              </div>


              <FormField
                control={form.control}
                name="trafficConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condiciones del Tráfico</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ej: Tráfico denso en Av. Insurgentes, accidente en Periférico..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weatherConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condiciones Climáticas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ej: Lluvia ligera en zona sur, soleado en el norte..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  "Obtener Sugerencias de Ruta"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="shadow-lg flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">La IA está procesando tu solicitud...</p>
        </Card>
      )}

      {suggestions && !isLoading && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RouteIcon className="text-primary"/>Rutas Sugeridas por IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Rutas Óptimas:</h3>
              {suggestions.suggestedRoutes.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {suggestions.suggestedRoutes.map((route, index) => (
                    <li key={index} className="text-sm">{route}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No se pudieron generar rutas específicas.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Razonamiento de la IA:</h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{suggestions.reasoning}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
