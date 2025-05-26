
"use client";

import * as React from 'react';
import { EnvioForm, type EnvioFormValues } from '@/components/forms/envio-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addEnvioAction } from '@/lib/actions/envios.actions';
import type { EnvioCreateValues } from '@/lib/validators';
import { Loader2 } from 'lucide-react';

export default function NuevoEnvioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = React.useState(true); // To show loader for form data fetch

  // EnvioForm handles fetching its own select options and sets its loading state
  // This page's loading state is more for the overall page readiness.

  React.useEffect(() => {
    // Simulate or check if EnvioForm internal data loading is complete
    // For now, we'll assume EnvioForm handles its own internal loading display
    // and this page just shows its structure.
    // If EnvioForm had a prop to signal its data readiness, we could use it here.
    setIsLoadingInitialData(false); // Assuming form is ready to be rendered
  }, []);


  const handleCreateEnvio = async (values: EnvioFormValues) => {
    setIsSubmitting(true);
    try {
        // The tracking_number is generated server-side, so we omit it here.
        // Fecha solicitud also defaulted in server action if not provided.
        const valuesForCreate: Omit<EnvioCreateValues, 'tracking_number'> = values as Omit<EnvioCreateValues, 'tracking_number'>;
        
        const result = await addEnvioAction(valuesForCreate);
        if (result.error) {
            toast({
            title: 'Error al crear envío',
            description: result.error.message,
            variant: 'destructive',
            });
        } else {
            toast({
            title: 'Envío Creado',
            description: `El envío con tracking #${result.data?.tracking_number} ha sido creado exitosamente.`,
            variant: 'success',
            });
            router.push('/envios');
        }
    } catch (error) {
        toast({
          title: 'Error inesperado',
          description: (error as Error).message || "Ocurrió un problema al crear el envío.",
          variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isLoadingInitialData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Crear Nuevo Envío</CardTitle>
          <CardDescription>
            Completa la información a continuación para registrar un nuevo envío.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnvioForm
            onSubmit={handleCreateEnvio}
            submitButtonText={isSubmitting ? "Creando Envío..." : "Crear Envío"}
            onSuccess={() => { /* Redirection handled in handleCreateEnvio */ }}
            isEditMode={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
