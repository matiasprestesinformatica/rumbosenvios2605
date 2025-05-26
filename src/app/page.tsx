'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { DeliveryMetric, Order } from "@/types";
import { Package, Truck, CheckCircle, Users, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const MOCK_METRICS: DeliveryMetric[] = [
  { title: "Total de Pedidos Hoy", value: 125, icon: Package, trend: 5, trendDirection: 'up', previousValue: "119" },
  { title: "Entregas Activas", value: 18, icon: Truck, trend: -10, trendDirection: 'down', previousValue: "20" },
  { title: "Entregas Completadas", value: 78, icon: CheckCircle, trend: 12, trendDirection: 'up', previousValue: "69" },
  { title: "Repartidores Disponibles", value: 8, icon: Users, trend: 0, trendDirection: 'up', previousValue: "8" },
];

const MOCK_RECENT_ORDERS: Order[] = [
  { id: "ORD001", customerName: "Ana Pérez", deliveryAddress: "Calle Falsa 123", status: "In-Transit", deadline: "2024-07-28T14:00:00Z", assignedDriverId: "DRV003" },
  { id: "ORD002", customerName: "Luis García", deliveryAddress: "Av. Siempre Viva 742", status: "Pending", deadline: "2024-07-28T16:00:00Z" },
  { id: "ORD003", customerName: "Sofía López", deliveryAddress: "Plaza Mayor 1", status: "Delivered", deadline: "2024-07-27T18:00:00Z", assignedDriverId: "DRV001" },
  { id: "ORD004", customerName: "Carlos Martinez", deliveryAddress: "Paseo de la Reforma 222", status: "Failed", deadline: "2024-07-27T10:00:00Z", assignedDriverId: "DRV002" },
];

const MOCK_CHART_DATA = [
  { date: "Jul 22", deliveries: 65 },
  { date: "Jul 23", deliveries: 72 },
  { date: "Jul 24", deliveries: 60 },
  { date: "Jul 25", deliveries: 80 },
  { date: "Jul 26", deliveries: 75 },
  { date: "Jul 27", deliveries: 90 },
  { date: "Hoy", deliveries: 78 },
];

const chartConfig = {
  deliveries: {
    label: "Entregas",
    color: "hsl(var(--primary))",
  },
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MOCK_METRICS.map((metric) => (
          <Card key={metric.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
              {metric.trend !== undefined && (
                <p className="text-xs text-muted-foreground flex items-center">
                  {metric.trend >= 0 ? (
                    <TrendingUp className={`h-4 w-4 mr-1 ${metric.trend > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                  )}
                  {metric.trend >= 0 ? `+${metric.trend}` : metric.trend}% vs ayer ({metric.previousValue})
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Rendimiento de Entregas (Últimos 7 días)</CardTitle>
            <CardDescription>Visualización del número de entregas completadas.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CHART_DATA} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="deliveries" fill="var(--color-deliveries)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pedidos Recientes</CardTitle>
              <CardDescription>Un vistazo rápido a los últimos pedidos.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="/orders">Ver Todos</a>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_RECENT_ORDERS.slice(0, 4).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          order.status === "Delivered" ? "default" :
                          order.status === "In-Transit" ? "secondary" :
                          order.status === "Pending" ? "outline" :
                          "destructive"
                        }
                        className={
                          order.status === "Delivered" ? "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" :
                          order.status === "In-Transit" ? "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" :
                          order.status === "Pending" ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20" :
                          "" // destructive badge handles its own styling
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="text-amber-500"/>Notificaciones Importantes</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">No hay notificaciones importantes en este momento.</p>
            {/* Example: <p>Entrega ORD005 retrasada. Nueva ETA: 16:30.</p> */}
        </CardContent>
      </Card>

    </div>
  );
}
