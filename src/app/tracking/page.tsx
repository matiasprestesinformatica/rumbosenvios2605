import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MapPin, PackageSearch, Truck } from "lucide-react";
import type { Order } from "@/types";

const MOCK_ACTIVE_ORDERS: Order[] = [
  { id: "ORD2001", customerName: "Marco Antonio Solis", deliveryAddress: "Estadio Azteca, CDMX", status: "In-Transit", assignedDriverId: "DRV002", deadline: "2024-07-28T17:00:00Z", packageType: "Equipo de Sonido" },
  { id: "ORD2002", customerName: "Julieta Venegas", deliveryAddress: "Auditorio Nacional, CDMX", status: "In-Transit", assignedDriverId: "DRV005", deadline: "2024-07-28T19:30:00Z", packageType: "Instrumentos Musicales" },
  { id: "ORD2003", customerName: "Luis Miguel", deliveryAddress: "Palacio de Bellas Artes, CDMX", status: "Pending", deadline: "2024-07-29T20:00:00Z", packageType: "Vestuario de Lujo" },
];

export default function TrackingPage() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seguimiento en Tiempo Real</h1>
        <p className="text-muted-foreground">Visualiza la ubicación de tus paquetes en el mapa.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 flex-1">
        <Card className="md:col-span-2 shadow-lg h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="text-primary"/>Mapa de Entregas</CardTitle>
            <CardDescription>Ubicación en tiempo real de los repartidores y paquetes.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center bg-muted/30 rounded-b-lg">
            {/* Placeholder for map integration */}
            <div className="w-full h-full max-h-[600px] relative">
               <Image 
                src="https://placehold.co/800x600.png/E0EBF5/4399EB?text=Mapa+de+Seguimiento" 
                alt="Mapa de seguimiento de entregas" 
                layout="fill"
                objectFit="cover"
                className="rounded-md"
                data-ai-hint="map city"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xl font-semibold text-primary-foreground bg-black/50 p-4 rounded-md">Integración de Mapa Próximamente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PackageSearch className="text-primary" />Paquetes Activos</CardTitle>
            <CardDescription>Lista de paquetes actualmente en tránsito o pendientes.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100%-theme(spacing.4))]"> {/* Adjust height as needed */}
              <div className="p-4 space-y-3">
              {MOCK_ACTIVE_ORDERS.map((order) => (
                <div key={order.id} className="p-3 border rounded-lg hover:shadow-md transition-shadow bg-background">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{order.id} - {order.packageType}</h4>
                    <Badge
                      variant={order.status === "In-Transit" ? "secondary" : "outline"}
                       className={
                        order.status === "In-Transit" ? "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                        "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{order.deliveryAddress}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliente: {order.customerName}
                  </p>
                  {order.assignedDriverId && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                       <Truck className="h-3 w-3"/> Repartidor: {order.assignedDriverId}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Límite: {new Date(order.deadline).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
