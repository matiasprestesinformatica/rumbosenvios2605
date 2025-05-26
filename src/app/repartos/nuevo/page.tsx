
"use client";

import * as React from 'react';
import { RepartoForm, type RepartoFormValues } from '@/components/forms/reparto-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addRepartoAction } from '@/lib/actions/repartos.actions';
import type { Repartidor, Envio, Cliente } from '@/types';
import { getRepartidoresAction } from '@/lib/actions/repartidores.actions';
import { getEnviosPendientesForSelectAction } from '@/lib/actions/envios.actions';
import { Loader2, Route } from 'lucide-react';

interface EnvioParaSeleccion extends Pick<Envio, 'id' | 'tracking_number' | 'direccion_destino' | 'empresa_origen_id'> {
    cliente?: Pick<Cliente, 'nombre_completo'> | null;
}

export default function NuevoRepartoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const [repartidores, setRepartidores] = React.useState<Pick<Repartidor, 'id' | 'nombre_completo'>[]>([]);
  const [enviosPendientes, setEnviosPendientes] = React.useState<EnvioParaSeleccion[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const [repartidoresRes, enviosRes] = await Promise.all([
          getRepartidoresAction({ pageSize: 100, estatus: 'disponible' }),
          getEnviosPendientesForSelectAction({ pageSize: 200 })
        ]);

        if (repartidoresRes.data) {
          setRepartidores(repartidoresRes.data.map(r => ({ id: r.id, nombre_completo: r.nombre_completo })));
        } else {
          toast({ title: "Error", description: repartidoresRes.error?.message || "No se pudieron cargar los repartidores.", variant: "destructive" });
        }

        if (enviosRes.data) {
          setEnviosPendientes(enviosRes.data as EnvioParaSeleccion[]);
        } else {
          toast({ title: "Error", description: enviosRes.error?.message || "No se pudieron cargar los envíos pendientes.", variant: "destructive" });
        }
      } catch (error) {
         toast({ title: "Error al cargar datos iniciales", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, []); // Removed toast from dependency array

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
          title: 'Reparto Creado Exitosamente',
          description: `El reparto "${result.data?.nombre_reparto || result.data?.id}" ha sido creado.`,
          variant: 'success',
        });
        router.push('/repartos');
      }
    } catch (error) {
        toast({
          title: 'Error Inesperado',
          description: (error as Error).message || "Ocurrió un problema al crear el reparto.",
          variant: 'destructive',
        });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Cargando datos para nuevo reparto...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-6 w-6 text-primary" />
            Planificar Nuevo Reparto
          </CardTitle>
          <CardDescription>
            Asigna envíos pendientes a un repartidor para una fecha específica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RepartoForm
            onSubmit={handleCreateReparto}
            repartidores={repartidores}
            enviosPendientes={enviosPendientes}
            isSubmitting={isLoading}
            submitButtonText="Crear Reparto y Asignar Envíos"
          />
        </CardContent>
      </Card>
    </div>
  );
}
