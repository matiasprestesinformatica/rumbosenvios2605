
"use client";
import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getRepartoByIdAction, updateRepartoEstadoAction, updateParadaEstadoAction, reorderParadasAction } from '@/lib/actions/repartos.actions';
import type { Reparto, ParadaReparto, EstadoEnvioEnum } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CalendarDays, User, Truck, MapPin, ClipboardList, AlertTriangle, Sparkles, MoveVertical, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import Image from 'next/image';
import { estadoEnvioEnumSchema } from '@/lib/validators';

const getEstadoBadge = (estatus: EstadoEnvioEnum | undefined, tipo: 'reparto' | 'parada') => {
    if (!estatus) return <Badge variant="outline">Desconocido</Badge>;

    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let className = "text-xs";
    let texto = estatus.replace(/_/g, ' ');
    let IconComponent: React.ElementType | null = Hourglass;

    switch (estatus) {
        case 'entregado':
            variant = 'default';
            className += " bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20";
            texto = tipo === 'reparto' ? "Completado" : "Entregado";
            IconComponent = CheckCircle;
            break;
        case 'en_camino':
        case 'en_recoleccion':
        case 'recolectado':
        case 'llegando_destino':
            variant = 'secondary';
            className += " bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
            texto = tipo === 'reparto' ? "En Curso" : "En Camino";
            IconComponent = Truck;
            break;
        case 'pendiente_confirmacion':
        case 'pendiente_recoleccion':
            variant = 'outline';
            className += " bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20";
            texto = "Pendiente";
            IconComponent = Hourglass;
            break;
        case 'cancelado':
        case 'fallido':
        case 'no_entregado':
            variant = 'destructive';
            className += " bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
            IconComponent = XCircle;
            break;
        default:
            className += " bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20";
            IconComponent = AlertTriangle;
            break;
    }
    return <Badge variant={variant} className={className}><IconComponent className="h-3 w-3 mr-1.5" />{texto}</Badge>;
};


export default function DetalleRepartoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const repartoId = params.id as string;

  const [reparto, setReparto] = React.useState<Reparto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [isUpdatingParada, setIsUpdatingParada] = React.useState<string | null>(null); // Store parada_id being updated
  const [paradas, setParadas] = React.useState<ParadaReparto[]>([]);


  const fetchReparto = React.useCallback(async () => {
    if (!repartoId) return;
    setIsLoading(true);
    const result = await getRepartoByIdAction(repartoId);
    if (result.data) {
      setReparto(result.data);
      setParadas(result.data.paradas_reparto || []);
    } else {
      toast({ title: 'Error', description: result.error?.message || "No se pudo cargar el reparto.", variant: 'destructive' });
      router.push('/repartos');
    }
    setIsLoading(false);
  }, [repartoId, router, toast]);

  React.useEffect(() => {
    fetchReparto();
  }, [fetchReparto]);

  const handleUpdateRepartoStatus = async (nuevoEstatus: EstadoEnvioEnum) => {
    if (!reparto) return;
    setIsUpdatingStatus(true);
    const result = await updateRepartoEstadoAction(reparto.id, nuevoEstatus);
    if (result.data) {
      setReparto(prev => prev ? { ...prev, estatus: result.data!.estatus } : null);
      toast({ title: 'Estado Actualizado', description: `El reparto ahora está ${nuevoEstatus.replace(/_/g, ' ')}.`, variant: 'success' });
    } else {
      toast({ title: 'Error', description: result.error?.message || "No se pudo actualizar el estado.", variant: 'destructive' });
    }
    setIsUpdatingStatus(false);
  };

  const handleUpdateParadaStatus = async (paradaId: string, nuevoEstatus: EstadoEnvioEnum) => {
    setIsUpdatingParada(paradaId);
    const result = await updateParadaEstadoAction(paradaId, nuevoEstatus);
    if (result.data) {
      setParadas(prevParadas => prevParadas.map(p => p.id === paradaId ? { ...p, estatus_parada: result.data!.estatus_parada } : p));
      // Optionally, refresh the whole reparto to get updated envio statuses if they change based on parada status
      await fetchReparto(); // This ensures envio statuses are also up-to-date
      toast({ title: 'Estado de Parada Actualizado', variant: 'success' });
    } else {
      toast({ title: 'Error', description: result.error?.message || "No se pudo actualizar estado de la parada.", variant: 'destructive' });
    }
    setIsUpdatingParada(null);
  };
  
  // Placeholder for drag-and-drop reordering logic
  const handleReorderParadas = async (paradaId: string, direction: 'up' | 'down') => {
    const currentIndex = paradas.findIndex(p => p.id === paradaId);
    if (currentIndex === -1) return;

    const newParadas = [...paradas];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= newParadas.length) return; // Cannot move outside bounds

    // Swap elements
    [newParadas[currentIndex], newParadas[targetIndex]] = [newParadas[targetIndex], newParadas[currentIndex]];
    
    // Update sequence numbers
    const paradasConNuevaSecuencia = newParadas.map((p, index) => ({
      parada_id: p.id,
      nueva_secuencia: index + 1,
    }));

    // Optimistically update UI
    setParadas(newParadas.map((p, index) => ({ ...p, secuencia_parada: index + 1 })));
    
    const result = await reorderParadasAction(repartoId, paradasConNuevaSecuencia);
    if (result.error) {
        toast({ title: 'Error al Reordenar', description: result.error.message, variant: 'destructive' });
        // Revert UI on error
        fetchReparto();
    } else {
        toast({ title: 'Paradas Reordenadas', variant: 'success' });
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Cargando detalles del reparto...</p></div>;
  }

  if (!reparto) {
    return <div className="text-center py-10"><AlertTriangle className="mx-auto h-12 w-12 text-destructive" /><p className="mt-4 text-xl">Reparto no encontrado.</p><Button onClick={() => router.push('/repartos')} className="mt-4">Volver a Repartos</Button></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              Reparto: {reparto.nombre_reparto || reparto.id}
            </CardTitle>
            <CardDescription>Detalles y gestión de la ruta de entrega.</CardDescription>
          </div>
          <div className="mt-4 sm:mt-0">
            {getEstadoBadge(reparto.estatus, 'reparto')}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-muted-foreground" /> <strong>Fecha:</strong> {new Date(reparto.fecha_reparto + 'T00:00:00').toLocaleDateString('es-AR')}</div>
            <div className="flex items-center gap-2"><User className="h-5 w-5 text-muted-foreground" /> <strong>Repartidor:</strong> {reparto.repartidor?.nombre_completo || 'N/A'}</div>
            <div className="flex items-center gap-2"><Hourglass className="h-5 w-5 text-muted-foreground" /> <strong>Horario Est.:</strong> {reparto.hora_inicio_estimada || 'N/A'} - {reparto.hora_fin_estimada || 'N/A'}</div>
          </div>

          {reparto.notas && <div className="p-3 bg-muted/50 rounded-md"><p className="text-sm text-muted-foreground"><strong>Notas del Reparto:</strong> {reparto.notas}</p></div>}

          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <Select
                value={reparto.estatus}
                onValueChange={(value) => handleUpdateRepartoStatus(value as EstadoEnvioEnum)}
                disabled={isUpdatingStatus}
            >
                <SelectTrigger className="w-full sm:w-[220px]" id="reparto-status-select">
                <SelectValue placeholder="Cambiar estado del reparto..." />
                </SelectTrigger>
                <SelectContent>
                {estadoEnvioEnumSchema.options.map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                ))}
                </SelectContent>
            </Select>
             <Button variant="outline" className="w-full sm:w-auto" disabled>
                <Sparkles className="mr-2 h-4 w-4" /> Optimizar Ruta (IA) - Próximamente
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" />Paradas del Reparto ({paradas.length})</CardTitle>
          <CardDescription>Secuencia de entregas y recolecciones.</CardDescription>
        </CardHeader>
        <CardContent>
          {paradas.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Este reparto no tiene paradas asignadas.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Sec.</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tracking / Info</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado Parada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paradas.map((parada, index) => (
                  <TableRow key={parada.id}>
                    <TableCell className="font-medium">{parada.secuencia_parada}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleReorderParadas(parada.id, 'up')} disabled={index === 0 || isUpdatingParada === parada.id}>
                            <MoveVertical className="h-4 w-4 transform -rotate-90" /> <span className="sr-only">Mover Arriba</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleReorderParadas(parada.id, 'down')} disabled={index === paradas.length - 1 || isUpdatingParada === parada.id}>
                           <MoveVertical className="h-4 w-4 transform rotate-90" /> <span className="sr-only">Mover Abajo</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="whitespace-nowrap">{parada.tipo_parada.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>
                        {parada.envio ? (
                            <>
                                {parada.envio.tracking_number}
                                <p className="text-xs text-muted-foreground">{parada.envio.cliente?.nombre_completo || 'Cliente no especificado'}</p>
                            </>
                        ) : (
                            <span className="text-muted-foreground italic">Parada de logística</span>
                        )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{parada.direccion_parada}</TableCell>
                    <TableCell>{parada.nombre_contacto_parada} <br/> <span className="text-xs text-muted-foreground">{parada.telefono_contacto_parada}</span></TableCell>
                    <TableCell>
                        <Select
                            value={parada.estatus_parada}
                            onValueChange={(value) => handleUpdateParadaStatus(parada.id, value as EstadoEnvioEnum)}
                            disabled={isUpdatingParada === parada.id}
                        >
                            <SelectTrigger className="h-9 text-xs w-full min-w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                            {estadoEnvioEnumSchema.options.map(s => (
                                <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-6 w-6 text-primary" />Mapa de la Ruta</CardTitle>
            <CardDescription>Visualización de la ruta de entrega.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center bg-muted/30 rounded-b-lg">
            <div className="text-center">
                <Image src="https://placehold.co/600x400.png/E0EBF5/4399EB?text=Integracion+de+Mapa+Proximamente" alt="Mapa placeholder" width={600} height={400} className="rounded-md" data-ai-hint="map route"/>
                <p className="mt-2 text-muted-foreground">La visualización del mapa estará disponible aquí.</p>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
