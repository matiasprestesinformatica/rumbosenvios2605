"use client"; // Required for useToast and potential form interactions

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Search, Sparkles } from "lucide-react";
import type { Order, Driver } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { prioritizeDeliveryScheduleServerAction } from "@/lib/actions"; // Assuming this will be created

const MOCK_ORDERS: Order[] = [
  { id: "ORD1001", customerName: "Elena Vasquez", deliveryAddress: "Av. Insurgentes Sur 100, CDMX", status: "Pending", deadline: "2024-07-29T10:00:00Z", packageType: "Documento", urgency: "high" },
  { id: "ORD1002", customerName: "Juan Carlos Rios", deliveryAddress: "Calle Madero 55, Guadalajara", status: "In-Transit", assignedDriverId: "DRV001", deadline: "2024-07-28T15:30:00Z", packageType: "Paquete Pequeño", urgency: "medium" },
  { id: "ORD1003", customerName: "Beatriz Solano", deliveryAddress: "Paseo de la Reforma 500, CDMX", status: "Delivered", assignedDriverId: "DRV002", deadline: "2024-07-27T12:00:00Z", packageType: "Paquete Mediano", urgency: "low" },
  { id: "ORD1004", customerName: "Ricardo Lara", deliveryAddress: "Av. Chapultepec 20, Monterrey", status: "Pending", deadline: "2024-07-29T18:00:00Z", packageType: "Paquete Grande", urgency: "medium" },
  { id: "ORD1005", customerName: "Fernanda Ochoa", deliveryAddress: "Calle 5 de Mayo 10, Puebla", status: "Cancelled", deadline: "2024-07-28T09:00:00Z", packageType: "Documento", urgency: "high" },
];

const MOCK_DRIVERS_FOR_PRIORITIZATION: Driver[] = [
  { id: "DRV001", name: "Carlos Rodríguez", status: "Available", vehicle: "Motocicleta", contact: "", currentLocation: "Central", availabilityStart: "2024-07-28T08:00:00Z", availabilityEnd: "2024-07-28T20:00:00Z" },
  { id: "DRV002", name: "Laura Gómez", status: "Available", vehicle: "Bicicleta", contact: "", currentLocation: "Norte", availabilityStart: "2024-07-28T09:00:00Z", availabilityEnd: "2024-07-28T18:00:00Z" },
];


export default function OrdersPage() {
  const { toast } = useToast();
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [prioritizedOrders, setPrioritizedOrders] = useState<Order[] | null>(null);

  const handlePrioritizeWithAi = async () => {
    setIsLoadingAi(true);
    try {
      const ordersToPrioritize = MOCK_ORDERS.filter(o => o.status === 'Pending' || o.status === 'In-Transit');
      const result = await prioritizeDeliveryScheduleServerAction({
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
      });
      
      // Update local MOCK_ORDERS based on AI result (simplified)
      const updatedOrders = MOCK_ORDERS.map(order => {
        const aiOrderInfo = result.find(aiO => aiO.deliveryId === order.id);
        if (aiOrderInfo) {
          return { ...order, assignedDriverId: aiOrderInfo.assignedDriverId, status: "In-Transit" as Order["status"]}; // Example update
        }
        return order;
      });
      setPrioritizedOrders(updatedOrders);

      toast({
        title: "Pedidos Priorizados por IA",
        description: `Se ${result.length} pedidos han sido analizados y priorizados.`,
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
                        order.status === "Delivered" ? "default" :
                        order.status === "In-Transit" ? "secondary" :
                        order.status === "Pending" ? "outline" :
                        order.status === "Cancelled" ? "destructive" : // Specific destructive style
                        "destructive" // Default for 'Failed'
                      }
                      className={
                        order.status === "Delivered" ? "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                        order.status === "In-Transit" ? "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                        order.status === "Pending" ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20" :
                        order.status === "Cancelled" ? "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20" :
                        "" // destructive for Failed handles its own style
                      }
                    >
                      {order.status}
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
