
"use client"; // Required for useToast and potential form interactions

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Search, Sparkles } from "lucide-react";
import type { Order, Driver, Envio } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { prioritizeDeliverySchedule } from '@/ai/flows/prioritize-delivery-schedule'; // Direct import
import type { PrioritizeDeliveryScheduleInput, PrioritizeDeliveryScheduleOutput } from '@/ai/flows/prioritize-delivery-schedule';


// Server action to wrap the Genkit flow call
async function prioritizeDeliveryScheduleAction(input: PrioritizeDeliveryScheduleInput): Promise<PrioritizeDeliveryScheduleOutput> {
  try {
    const result = await prioritizeDeliverySchedule(input); // Call the Genkit flow directly
    if (!result || !Array.isArray(result)) {
      return [];
    }
    return result;
  } catch (error) {
    console.error('Error in prioritizeDeliveryScheduleAction:', error);
    throw new Error(`AI service error: ${(error as Error).message}`);
  }
}

const MOCK_ORDERS: Order[] = [
  { id: "ORD1001", customerName: "Elena Vasquez", deliveryAddress: "Av. Insurgentes Sur 100, CDMX", status: "pendiente_confirmacion", deadline: "2024-07-29T10:00:00Z", packageType: "Documento", urgency: "high", cliente_id: "uuid-cliente-1", direccion_destino:"Av. Insurgentes Sur 100, CDMX", estatus: "pendiente_confirmacion", fecha_entrega_estimada_fin: "2024-07-29T10:00:00Z", tipo_paquete_id: "uuid-tipo-paquete-doc" },
  { id: "ORD1002", customerName: "Juan Carlos Rios", deliveryAddress: "Calle Madero 55, Guadalajara", status: "en_camino", assignedDriverId: "DRV001", deadline: "2024-07-28T15:30:00Z", packageType: "Paquete Pequeño", urgency: "medium", cliente_id: "uuid-cliente-2", direccion_destino: "Calle Madero 55, Guadalajara", estatus: "en_camino", repartidor_asignado_id: "DRV001", fecha_entrega_estimada_fin: "2024-07-28T15:30:00Z", tipo_paquete_id: "uuid-tipo-paquete-peq" },
  { id: "ORD1003", customerName: "Beatriz Solano", deliveryAddress: "Paseo de la Reforma 500, CDMX", status: "entregado", assignedDriverId: "DRV002", deadline: "2024-07-27T12:00:00Z", packageType: "Paquete Mediano", urgency: "low", cliente_id: "uuid-cliente-3", direccion_destino: "Paseo de la Reforma 500, CDMX", estatus: "entregado", repartidor_asignado_id: "DRV002", fecha_entrega_estimada_fin: "2024-07-27T12:00:00Z", tipo_paquete_id: "uuid-tipo-paquete-med" },
  { id: "ORD1004", customerName: "Ricardo Lara", deliveryAddress: "Av. Chapultepec 20, Monterrey", status: "pendiente_confirmacion", deadline: "2024-07-29T18:00:00Z", packageType: "Paquete Grande", urgency: "medium", cliente_id: "uuid-cliente-4", direccion_destino: "Av. Chapultepec 20, Monterrey", estatus: "pendiente_confirmacion", fecha_entrega_estimada_fin: "2024-07-29T18:00:00Z", tipo_paquete_id: "uuid-tipo-paquete-gra" },
  { id: "ORD1005", customerName: "Fernanda Ochoa", deliveryAddress: "Calle 5 de Mayo 10, Puebla", status: "cancelado", deadline: "2024-07-28T09:00:00Z", packageType: "Documento", urgency: "high", cliente_id: "uuid-cliente-5", direccion_destino: "Calle 5 de Mayo 10, Puebla", estatus: "cancelado", fecha_entrega_estimada_fin: "2024-07-28T09:00:00Z", tipo_paquete_id: "uuid-tipo-paquete-doc" },
];

const MOCK_DRIVERS_FOR_PRIORITIZATION: Driver[] = [
  { id: "DRV001", name: "Carlos Rodríguez", status: "disponible", vehicle: "Motocicleta", contact: "", currentLocation: "Central", availabilityStart: "2024-07-28T08:00:00Z", availabilityEnd: "2024-07-28T20:00:00Z", nombre_completo: "Carlos Rodríguez", estatus: "disponible", tipo_vehiculo: "moto", telefono: ""  },
  { id: "DRV002", name: "Laura Gómez", status: "disponible", vehicle: "Bicicleta", contact: "", currentLocation: "Norte", availabilityStart: "2024-07-28T09:00:00Z", availabilityEnd: "2024-07-28T18:00:00Z", nombre_completo: "Laura Gómez", estatus: "disponible", tipo_vehiculo:"bicicleta", telefono: "" },
];


export default function OrdersPage() {
  const { toast } = useToast();
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [prioritizedOrders, setPrioritizedOrders] = useState<Order[] | null>(null);

  const handlePrioritizeWithAi = async () => {
    setIsLoadingAi(true);
    try {
      const ordersToPrioritize = MOCK_ORDERS.filter(o => o.status === 'pendiente_confirmacion' || o.status === 'en_camino' || o.status === 'pendiente_recoleccion');
      
      const aiInput: PrioritizeDeliveryScheduleInput = {
        deliveries: ordersToPrioritize.map(o => ({
          deliveryId: o.id,
          address: o.deliveryAddress,
          urgency: o.urgency || 'medium',
          packageType: o.packageType || 'Desconocido',
          timeWindowStart: o.timeWindowStart || new Date().toISOString(),
          timeWindowEnd: o.deadline,
        })),
        drivers: MOCK_DRIVERS_FOR_PRIORITIZATION.map(d => ({
          driverId: d.id,
          currentLocation: d.currentLocation || 'Desconocida',
          availabilityStart: d.availabilityStart || new Date().toISOString(),
          availabilityEnd: d.availabilityEnd || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() , // 8 hours from now
        })),
        currentConditions: "Tráfico moderado, clima soleado."
      };

      const result = await prioritizeDeliveryScheduleAction(aiInput);
      
      const updatedOrders = MOCK_ORDERS.map(order => {
        const aiOrderInfo = result.find(aiO => aiO.deliveryId === order.id);
        if (aiOrderInfo) {
          return { ...order, assignedDriverId: aiOrderInfo.assignedDriverId, status: "en_camino" as Order["estatus"]}; 
        }
        return order;
      });
      setPrioritizedOrders(updatedOrders);

      toast({
        title: "Pedidos Priorizados por IA",
        description: `${result.length} pedidos han sido analizados y priorizados.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error prioritizing with AI:", error);
      toast({
        title: "Error de Priorización",
        description: "No se pudo priorizar los pedidos con IA. Intenta de nuevo.",
        variant: "destructive",
      });
    }
    setIsLoadingAi(false);
  };
  
  const displayOrders = prioritizedOrders || MOCK_ORDERS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">Visualiza y administra todos los pedidos.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrioritizeWithAi} disabled={isLoadingAi}>
            <Sparkles className="mr-2 h-4 w-4" /> {isLoadingAi ? "Priorizando..." : "Priorizar con IA"}
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Pedido
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Lista de Pedidos</CardTitle>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar pedido..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
          </div>
          <CardDescription>Total de pedidos: {displayOrders.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Repartidor</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="max-w-xs truncate">{order.deliveryAddress}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.estatus === "entregado" ? "default" :
                        order.estatus === "en_camino" || order.estatus === "en_recoleccion" || order.estatus === "recolectado" ? "secondary" :
                        order.estatus === "pendiente_confirmacion" || order.estatus === "pendiente_recoleccion" ? "outline" :
                        order.estatus === "cancelado" ? "destructive" : 
                        "destructive" 
                      }
                      className={
                        order.estatus === "entregado" ? "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                        order.estatus === "en_camino" || order.estatus === "en_recoleccion" || order.estatus === "recolectado" || order.estatus === "llegando_destino" ? "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                        order.estatus === "pendiente_confirmacion" || order.estatus === "pendiente_recoleccion" ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20" :
                        order.estatus === "cancelado" ? "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20" :
                        "" 
                      }
                    >
                      {order.estatus.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.assignedDriverId || "N/A"}</TableCell>
                  <TableCell>{new Date(order.deadline).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuItem>Editar Pedido</DropdownMenuItem>
                        <DropdownMenuItem>Asignar Repartidor</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Cancelar Pedido</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
