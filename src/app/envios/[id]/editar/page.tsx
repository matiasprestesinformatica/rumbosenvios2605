
"use client";

import * as React from 'react';
import { EnvioForm, type EnvioFormValues } from '@/components/forms/envio-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { getEnvioByIdAction, updateEnvioAction } from '@/lib/actions/envios.actions';
import type { Envio } from '@/types';
import type { EnvioUpdateValues } from '@/lib/validators';
import { Loader2 } from 'lucide-react';

export default function EditarEnvioPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const envioId = params.id as string;

  const [envio, setEnvio] = React.useState<Envio | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (envioId) {
      const fetchEnvio = async () => {
        setIsLoading(true);
        const result = await getEnvioByIdAction(envioId);
        if (result.data) {
          setEnvio(result.data);
        } else {
          toast({
            title: 'Error al cargar envío',
            description: result.error?.message || 'No se pudo encontrar el envío especificado.',
            variant: 'destructive',
          });
          router.push('/envios'); // Redirect if not found or error
        }
        setIsLoading(false);
      };
      fetchEnvio();
    }
  }, [envioId, router, toast]);

  const handleUpdateEnvio = async (values: EnvioFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateEnvioAction(envioId, values as EnvioUpdateValues);
      if (result.error) {
        toast({
          title: 'Error al actualizar envío',
          description: result.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Envío Actualizado',
          description: `El envío con tracking #${result.data?.tracking_number} ha sido actualizado.`,
          variant: 'success',
        });
        router.push('/envios');
      }
    } catch (error) {
         toast({
          title: 'Error inesperado',
          description: (error as Error).message || "Ocurrió un problema al actualizar el envío.",
          variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Cargando datos del envío...</p>
      </div>
    );
  }

  if (!envio) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-muted-foreground">No se pudo cargar el envío.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Editar Envío: {envio.tracking_number}</CardTitle>
          <CardDescription>
            Modifica la información del envío.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnvioForm
            initialData={envio}
            onSubmit={handleUpdateEnvio}
            submitButtonText={isSubmitting ? "Actualizando..." : "Actualizar Envío"}
            onSuccess={() => { /* Redirection handled in handleUpdateEnvio */ }}
            isEditMode={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
