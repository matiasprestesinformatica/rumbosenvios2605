
"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Edit, Loader2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getEnviosAction } from "@/lib/actions/envios.actions";
import type { Envio, Cliente, Repartidor, EstadoEnvioEnum } from "@/types";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { estadoEnvioEnumSchema } from "@/lib/validators";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Definición de columnas para DataTable
const columns: ColumnDef<Envio & { cliente?: Pick<Cliente, 'id' | 'nombre_completo'>, repartidor_asignado?: Pick<Repartidor, 'id' | 'nombre_completo'> }>[] = [
  {
    accessorKey: "tracking_number",
    header: "Tracking #",
  },
  {
    accessorKey: "cliente.nombre_completo",
    header: "Cliente",
    cell: ({ row }) => row.original.cliente?.nombre_completo || 'N/A',
  },
  {
    accessorKey: "direccion_destino",
    header: "Destino",
    cell: ({ row }) => <span className="truncate max-w-xs block">{row.original.direccion_destino}</span>,
  },
  {
    accessorKey: "estatus",
    header: "Estado",
    cell: ({ row }) => {
      const estatus = row.original.estatus;
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      let className = "";

      if (estatus === 'entregado') { variant = 'default'; className = "bg-green-500/20 text-green-700 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"; }
      else if (['en_camino', 'en_recoleccion', 'recolectado', 'llegando_destino'].includes(estatus)) { variant = 'secondary'; className = "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"; }
      else if (['pendiente_confirmacion', 'pendiente_recoleccion'].includes(estatus)) { variant = 'outline'; className = "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20"; }
      else if (['cancelado', 'fallido', 'no_entregado', 'devuelto_origen'].includes(estatus)) { variant = 'destructive'; className = "bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"; }
      
      return <Badge variant={variant} className={className}>{estatus.replace(/_/g, ' ')}</Badge>;
    },
  },
  {
    accessorKey: "repartidor_asignado.nombre_completo",
    header: "Repartidor",
    cell: ({ row }) => row.original.repartidor_asignado?.nombre_completo || 'N/A',
  },
  {
    accessorKey: "fecha_solicitud",
    header: "Fecha Solicitud",
    cell: ({ row }) => new Date(row.original.fecha_solicitud).toLocaleDateString('es-ES'),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="icon">
        <Link href={`/envios/${row.original.id}/editar`}>
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar Envío</span>
        </Link>
      </Button>
    ),
  },
];

const ESTADOS_ENVIO_OPCIONES = estadoEnvioEnumSchema.options.map(value => ({
  value: value,
  label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
}));


export default function EnviosPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [envios, setEnvios] = React.useState<(Envio & { cliente?: Pick<Cliente, 'id' | 'nombre_completo'>, repartidor_asignado?: Pick<Repartidor, 'id' | 'nombre_completo'> })[]>([]);
  const [totalEnvios, setTotalEnvios] = React.useState(0);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const searchTerm = searchParams.get("search") || "";
  const estatusFilter = searchParams.get("estatus") as EstadoEnvioEnum | undefined || "";
  const fechaDesdeFilter = searchParams.get("from") || "";
  const fechaHastaFilter = searchParams.get("to") || "";
  
  const [currentSearchTerm, setCurrentSearchTerm] = React.useState(searchTerm);
  const [currentEstatusFilter, setCurrentEstatusFilter] = React.useState(estatusFilter);
  const [currentDateRange, setCurrentDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(
    fechaDesdeFilter && fechaHastaFilter ? { from: new Date(fechaDesdeFilter), to: new Date(fechaHastaFilter) } : undefined
  );


  const fetchEnvios = React.useCallback(async (currentPage: number, currentLimit: number, search: string, estatus?: EstadoEnvioEnum, from?: string, to?: string) => {
    setIsLoadingData(true);
    const result = await getEnviosAction({ 
      page: currentPage, 
      pageSize: currentLimit, 
      searchTerm: search,
      estatus: estatus,
      fechaInicio: from,
      fechaFin: to
    });
    if (result.data) {
      setEnvios(result.data as (Envio & { cliente?: Pick<Cliente, 'id' | 'nombre_completo'>, repartidor_asignado?: Pick<Repartidor, 'id' | 'nombre_completo'> })[]);
      setTotalEnvios(result.count || 0);
    } else {
      toast({
        title: "Error al cargar envíos",
        description: result.error?.message || "No se pudieron cargar los envíos.",
        variant: "destructive",
      });
      setEnvios([]);
      setTotalEnvios(0);
    }
    setIsLoadingData(false);
  }, [toast]);

  React.useEffect(() => {
    fetchEnvios(page, pageSize, searchTerm, estatusFilter || undefined, fechaDesdeFilter, fechaHastaFilter);
  }, [page, pageSize, searchTerm, estatusFilter, fechaDesdeFilter, fechaHastaFilter, fetchEnvios]);
  
  const handleFilterChange = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Reset to first page on new filter
    if (currentSearchTerm) params.set("search", currentSearchTerm); else params.delete("search");
    if (currentEstatusFilter) params.set("estatus", currentEstatusFilter); else params.delete("estatus");
    if (currentDateRange?.from) params.set("from", currentDateRange.from.toISOString().split('T')[0]); else params.delete("from");
    if (currentDateRange?.to) params.set("to", currentDateRange.to.toISOString().split('T')[0]); else params.delete("to");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Envíos</h1>
          <p className="text-muted-foreground">Administra todos los envíos y pedidos.</p>
        </div>
        <Button asChild>
          <Link href="/envios/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Envío
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Envíos</CardTitle>
          <CardDescription>
            Visualiza, filtra y gestiona todos tus envíos. Total: {isLoadingData ? <Loader2 className="inline h-4 w-4 animate-spin" /> : totalEnvios}
          </CardDescription>
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por tracking, dirección..."
                    className="w-full rounded-lg bg-background pl-8 md:w-[250px] lg:w-[350px]"
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
                  {(estatusFilter || (fechaDesdeFilter && fechaHastaFilter)) && <span className="ml-1 h-2 w-2 rounded-full bg-primary" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-screen max-w-xs sm:max-w-sm md:max-w-md p-4" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Aplicar Filtros</h4>
                     <div className="grid gap-2">
                        <label htmlFor="estatus-filter" className="text-sm font-medium">Estado del Envío</label>
                        <Select value={currentEstatusFilter} onValueChange={(value) => setCurrentEstatusFilter(value as EstadoEnvioEnum)}>
                          <SelectTrigger id="estatus-filter">
                            <SelectValue placeholder="Todos los estados" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos los estados</SelectItem>
                            {ESTADOS_ENVIO_OPCIONES.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="date-range-filter" className="text-sm font-medium">Rango de Fechas (Solicitud)</label>
                        <DateRangePicker
                          id="date-range-filter"
                          initialDateFrom={fechaDesdeFilter ? new Date(fechaDesdeFilter) : undefined}
                          initialDateTo={fechaHastaFilter ? new Date(fechaHastaFilter) : undefined}
                          onUpdate={(range) => setCurrentDateRange(range.range)}
                          align="start"
                          className="w-full"
                        />
                      </div>
                      <Button onClick={handleFilterChange} className="w-full">Aplicar Filtros</Button>
                  </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingData && envios.length === 0 ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mt-2">Cargando envíos...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={envios}
              pageCount={Math.ceil(totalEnvios / pageSize)}
              currentPage={page}
              pageSize={pageSize}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    