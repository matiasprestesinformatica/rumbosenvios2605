
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function MapaEnviosPage() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Envíos en Tiempo Real</h1>
        <p className="text-muted-foreground">Visualiza la ubicación de tus repartidores y envíos activos.</p>
      </div>

      <Card className="shadow-lg flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="text-primary"/>Mapa Interactivo</CardTitle>
          <CardDescription>Ubicación en tiempo real de los repartidores y el estado de los envíos.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center bg-muted/30 rounded-b-lg">
          {/* Placeholder for map integration (e.g., Google Maps, Leaflet, Mapbox) */}
          <div className="w-full h-full max-h-[70vh] relative">
             <Image 
              src="https://placehold.co/1200x800.png/E0EBF5/4399EB?text=Mapa+de+Seguimiento+de+Envios" 
              alt="Mapa de seguimiento de envíos" 
              layout="fill"
              objectFit="cover"
              className="rounded-md"
              data-ai-hint="city map"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xl font-semibold text-primary-foreground bg-black/50 p-4 rounded-md">Integración de Mapa Próximamente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
