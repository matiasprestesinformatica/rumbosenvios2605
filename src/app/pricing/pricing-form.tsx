"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PricedItem } from "@/types";
import { Calculator, DollarSign } from 'lucide-react';

const pricingSchema = z.object({
  packageType: z.enum(['document', 'small-parcel', 'medium-parcel', 'large-parcel'], {
    required_error: "El tipo de paquete es requerido.",
  }),
  distance: z.coerce.number().min(0.1, "La distancia debe ser mayor a 0.").max(1000, "La distancia máxima es 1000 km."),
  deliverySpeed: z.enum(['standard', 'express', 'overnight'], {
    required_error: "La velocidad de entrega es requerida.",
  }),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

// Simple pricing logic (can be expanded)
const BASE_RATES = {
  document: 50,
  'small-parcel': 80,
  'medium-parcel': 120,
  'large-parcel': 200,
};

const PER_KM_RATES = {
  document: 2,
  'small-parcel': 3,
  'medium-parcel': 5,
  'large-parcel': 8,
};

const SPEED_MULTIPLIERS = {
  standard: 1,
  express: 1.5,
  overnight: 2,
};

function calculatePrice(values: PricingFormValues): number {
  const baseRate = BASE_RATES[values.packageType];
  const distanceCost = PER_KM_RATES[values.packageType] * values.distance;
  const speedMultiplier = SPEED_MULTIPLIERS[values.deliverySpeed];
  
  const subTotal = (baseRate + distanceCost) * speedMultiplier;
  // Add a minimum price, e.g., $30
  return Math.max(subTotal, 30); 
}

export default function PricingForm() {
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      distance: 10,
    },
  });

  function onSubmit(values: PricingFormValues) {
    const price = calculatePrice(values);
    setEstimatedPrice(price);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calculator className="text-primary"/>Calculadora de Precios</CardTitle>
          <CardDescription>Estima el costo de tu envío.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Paquete</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo de paquete" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="document">Documento (hasta 0.5kg)</SelectItem>
                        <SelectItem value="small-parcel">Paquete Pequeño (hasta 2kg)</SelectItem>
                        <SelectItem value="medium-parcel">Paquete Mediano (hasta 5kg)</SelectItem>
                        <SelectItem value="large-parcel">Paquete Grande (hasta 10kg)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="distance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distancia (km)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliverySpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Velocidad de Entrega</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una velocidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Estándar (3-5 días)</SelectItem>
                        <SelectItem value="express">Express (1-2 días)</SelectItem>
                        <SelectItem value="overnight">Día Siguiente (antes de las 10 AM)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Calcular Precio</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {estimatedPrice !== null && (
        <Card className="shadow-lg sticky top-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="text-green-500"/>Precio Estimado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-bold text-primary">
              ${estimatedPrice.toFixed(2)} <span className="text-lg font-normal text-muted-foreground">MXN</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Esta es una estimación. El precio final puede variar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
