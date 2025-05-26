
"use client";

import * as React from 'react';
import { RepartoForm, type RepartoFormValues } from '@/components/forms/reparto-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addRepartoAction } from '@/lib/actions/repartos.actions';
import type { Repartidor, Envio } from '@/types';
import { getRepartidoresAction } from '@/lib/actions/repartidores.actions';
import { getEnviosAction } from '@/lib/actions/envios.actions'; // To get pending shipments

export default function NuevoRepartoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [repartidores, setRepartidores] = React.useState<Pick<Repartidor, 'id' | 'nombre_completo'>[]>([]);
  const [enviosPendientes, setEnviosPendientes] = React.useState<Pick<Envio, 'id' | 'tracking_number' | 'direccion_destino' | 'cliente_id'>[]>([]); // Added cliente_id for potential grouping

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [repartidoresRes, enviosRes] = await Promise.all([
          getRepartidoresAction({ pageSize: 100, estatus: 'disponible' }), // Fetch more if needed
          getEnviosAction({ estatus: 'pendiente_recoleccion', pageSize: 200 }) // Fetch more pending shipments
        ]);

        if (repartidoresRes.data) {
          setRepartidores(repartidoresRes.data.map(r => ({ id: r.id, nombre_completo: r.nombre_completo })));
        } else {
          toast({ title: "Error", description: repartidoresRes.error?.message || "No se pudieron cargar los repartidores.", variant: "destructive" });
        }

        if (enviosRes.data) {
          setEnviosPendientes(enviosRes.data.map(e => ({ id: e.id, tracking_number: e.tracking_number, direccion_destino: e.direccion_destino, cliente_id: e.cliente_id })));
        } else {
          toast({ title: "Error", description: enviosRes.error?.message || "No se pudieron cargar los envíos pendientes.", variant: "destructive" });
        }
      } catch (error) {
         toast({ title: "Error al cargar datos", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleCreateReparto = async (values: RepartoFormValues) => {
    setIsLoading(true);
    try {
      const result = await addRepartoAction(values);
      if (result.error) {
        toast({
          title: 'Error al crear reparto',
          description: result.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reparto Creado',
          description: `El reparto para ${values.fecha_reparto} ha sido creado exitosamente.`,
          variant: 'success',
        });
        router.push('/repartos');
      }
    } catch (error) {
        toast({
          title: 'Error inesperado',
          description: (error as Error).message || "Ocurrió un problema al crear el reparto.",
          variant: 'destructive',
        });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && repartidores.length === 0 && enviosPendientes.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> <p className="ml-2">Cargando datos...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Crear Nuevo Reparto</CardTitle>
          <CardDescription>
            Planifica una nueva ruta de entrega asignando envíos a un repartidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RepartoForm
            onSubmit={handleCreateReparto}
            repartidores={repartidores}
            enviosPendientes={enviosPendientes}
            isSubmitting={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
