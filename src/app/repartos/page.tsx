
"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Edit, Loader2, Filter, Route as RouteIcon, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRepartosAction } from "@/lib/actions/repartos.actions";
import type { Reparto, EstadoEnvioEnum, Repartidor } from "@/types";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker"; // Assuming you might want this for filtering
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getRepartidoresAction } from "@/lib/actions/repartidores.actions";

const getEstadoRepartoBadge = (estatus: EstadoEnvioEnum) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let className = "";
    let texto = estatus.replace(/_/g, ' ');

    switch (estatus) {
        case 'entregado':
            variant = 'default';
            className = "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20";
            texto = "Completado";
            break;
        case 'en_camino':
        case 'en_recoleccion':
        case 'recolectado':
        case 'llegando_destino':
            variant = 'secondary';
            className = "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
            texto = "En Curso";
            break;
        case 'pendiente_confirmacion':
        case 'pendiente_recoleccion':
            variant = 'outline';
            className = "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20";
            texto = "Pendiente";
            break;
        case 'cancelado':
        case 'fallido':
            variant = 'destructive';
            className = "bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
            break;
        default:
            className = "bg-gray-500/20 text-gray-700 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20";
            break;
    }
    return <Badge variant={variant} className={className}>{texto}</Badge>;
};


const columns: ColumnDef<Reparto>[] = [
  {
    accessorKey: "fecha_reparto",
    header: "Fecha Reparto",
    cell: ({ row }) => new Date(row.original.fecha_reparto + 'T00:00:00').toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' }), // Ensure correct date parsing for display
  },
  {
    accessorKey: "nombre_reparto",
    header: "Nombre Reparto",
    cell: ({ row }) => row.original.nombre_reparto || <span className="text-muted-foreground italic">Sin nombre</span>,
  },
  {
    accessorKey: "repartidor.nombre_completo",
    header: "Repartidor",
    cell: ({ row }) => row.original.repartidor?.nombre_completo || 'N/A',
  },
  {
    accessorKey: "estatus",
    header: "Estado",
    cell: ({ row }) => getEstadoRepartoBadge(row.original.estatus),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/repartos/${row.original.id}`}>
          <RouteIcon className="mr-2 h-4 w-4" />
          Ver Detalles
        </Link>
      </Button>
    ),
  },
];

export default function RepartosPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [repartos, setRepartos] = React.useState<Reparto[]>([]);
  const [repartidores, setRepartidores] = React.useState<Pick<Repartidor, 'id' | 'nombre_completo'>[]>([]);
  const [totalRepartos, setTotalRepartos] = React.useState(0);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const searchTerm = searchParams.get("search") || "";
  const repartidorFilter = searchParams.get("repartidor_id") || "";
  const fechaFilter = searchParams.get("fecha") || "";

  const [currentSearchTerm, setCurrentSearchTerm] = React.useState(searchTerm);
  const [currentRepartidorFilter, setCurrentRepartidorFilter] = React.useState(repartidorFilter);
  const [currentDateFilter, setCurrentDateFilter] = React.useState<Date | undefined>(
    fechaFilter ? new Date(fechaFilter) : undefined
  );
  
  React.useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingData(true);
      try {
        const [repartosRes, repartidoresRes] = await Promise.all([
          getRepartosAction({
            page,
            pageSize,
            searchTerm,
            repartidorId: repartidorFilter || undefined,
            fecha: fechaFilter || undefined
          }),
          getRepartidoresAction({ pageSize: 100 }) // Fetch all or a large number for the filter
        ]);

        if (repartosRes.data) {
          setRepartos(repartosRes.data as Reparto[]);
          setTotalRepartos(repartosRes.count || 0);
        } else {
          toast({ title: "Error al cargar repartos", description: repartosRes.error?.message, variant: "destructive" });
        }

        if (repartidoresRes.data) {
          setRepartidores(repartidoresRes.data.map(r => ({ id: r.id, nombre_completo: r.nombre_completo })));
        } else {
          toast({ title: "Error al cargar repartidores", description: repartidoresRes.error?.message, variant: "destructive" });
        }

      } catch (error) {
         toast({ title: "Error al cargar datos", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchInitialData();
  }, [page, pageSize, searchTerm, repartidorFilter, fechaFilter, toast]);

  const handleFilterChange = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (currentSearchTerm) params.set("search", currentSearchTerm); else params.delete("search");
    if (currentRepartidorFilter) params.set("repartidor_id", currentRepartidorFilter); else params.delete("repartidor_id");
    if (currentDateFilter) params.set("fecha", currentDateFilter.toISOString().split('T')[0]); else params.delete("fecha");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Repartos</h1>
          <p className="text-muted-foreground">Planifica y supervisa tus rutas de entrega.</p>
        </div>
        <Button asChild>
          <Link href="/repartos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" /> Planificar Nuevo Reparto
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Repartos</CardTitle>
          <CardDescription>
            Visualiza, filtra y gestiona todas tus rutas de reparto. Total: {isLoadingData ? <Loader2 className="inline h-4 w-4 animate-spin" /> : totalRepartos}
          </CardDescription>
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por nombre del reparto..."
                    className="w-full rounded-lg bg-background pl-8 md:w-[250px] lg:w-[300px]"
                    value={currentSearchTerm}
                    onChange={(e) => setCurrentSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {(repartidorFilter || fechaFilter) && <span className="ml-1 h-2 w-2 rounded-full bg-primary" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-screen max-w-xs sm:max-w-sm p-4" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Aplicar Filtros</h4>
                     <div className="grid gap-2">
                        <label htmlFor="repartidor-filter" className="text-sm font-medium">Repartidor</label>
                        <Select value={currentRepartidorFilter} onValueChange={setCurrentRepartidorFilter}>
                          <SelectTrigger id="repartidor-filter">
                            <SelectValue placeholder="Todos los repartidores" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos los repartidores</SelectItem>
                            {repartidores.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.nombre_completo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="date-filter" className="text-sm font-medium">Fecha del Reparto</label>
                        <DatePicker
                            date={currentDateFilter}
                            setDate={setCurrentDateFilter}
                            buttonClassName="w-full"
                         />
                      </div>
                      <Button onClick={handleFilterChange} className="w-full">Aplicar Filtros</Button>
                  </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingData && repartos.length === 0 ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mt-2">Cargando repartos...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={repartos}
              pageCount={Math.ceil(totalRepartos / pageSize)}
              currentPage={page}
              pageSize={pageSize}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
