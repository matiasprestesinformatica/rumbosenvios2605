
import * as React from 'react';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import RepartosView from './_components/repartos-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Added for fallback

// Minimal skeleton for fallback
const RepartosPageFallback = () => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Repartos</h1>
        <p className="text-muted-foreground">Planifica y supervisa tus rutas de entrega.</p>
      </div>
      {/* Placeholder for Button, can be a Skeleton component */}
      <div className="h-10 w-36 rounded-md bg-muted animate-pulse" />
    </div>
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Lista de Repartos</CardTitle>
        <CardDescription>
          Cargando...
        </CardDescription>
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
          <div className="h-10 w-full md:w-[250px] lg:w-[300px] rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-full sm:w-auto rounded-md bg-muted animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-muted-foreground mt-2">Cargando repartos...</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function RepartosPage() {
  // This page component itself is now very simple.
  // It delegates the complex logic to RepartosView, wrapped in Suspense.
  return (
    <Suspense fallback={<RepartosPageFallback />}>
      <RepartosView />
    </Suspense>
  );
}
