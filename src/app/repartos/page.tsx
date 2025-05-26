
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";

export default function RepartosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Repartos</h1>
          <p className="text-muted-foreground">Planifica y supervisa las rutas de entrega.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Planificar Reparto
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Lista de Repartos</CardTitle>
            <div className="relative ml-auto flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar reparto..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
          </div>
          <CardDescription>Visualiza y gestiona todas las rutas de reparto.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for table or list of delivery runs */}
          <div className="text-center py-10">
            <p className="text-muted-foreground">No hay repartos planificados para mostrar.</p>
            <p className="text-sm text-muted-foreground">Empieza planificando un nuevo reparto.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
