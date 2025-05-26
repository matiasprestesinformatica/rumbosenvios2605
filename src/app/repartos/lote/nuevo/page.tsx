
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Construction } from "lucide-react";

export default function NuevoRepartoLotePage() {
  return (
    <div className="flex flex-col gap-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Construction className="h-8 w-8 text-primary" />
            Crear Reparto por Lote
        </h1>
        <p className="text-muted-foreground">
          Funcionalidad para crear múltiples envíos y un reparto masivo desde una empresa.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>En Desarrollo</CardTitle>
          <CardDescription>
            Esta sección para la creación de repartos por lote está actualmente en desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center py-12">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <p className="text-lg font-semibold">Funcionalidad Próximamente</p>
          <p className="text-muted-foreground max-w-md">
            Estamos trabajando para traerte una forma eficiente de crear repartos por lote. 
            Podrás seleccionar una empresa, listar sus clientes, definir tipos de servicio o precios
            y generar todos los envíos y el reparto automáticamente.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => window.history.back()}>
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
