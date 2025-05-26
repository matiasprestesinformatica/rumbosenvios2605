
"use client";

import * as React from "react";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Package, ListFilter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EnvioParaMapa, RepartoParaFiltroMapa, EstadoEnvioEnum, MapaEnviosFilterType } from "@/types";
import { getEnviosForMapAction } from "@/lib/actions/envios.actions";
import { getRepartosForMapFilterAction } from "@/lib/actions/repartos.actions";
import { Badge } from "@/components/ui/badge";

const getEstadoEnvioBadgeColor = (estatus: EstadoEnvioEnum): string => {
  switch (estatus) {
    case 'pendiente_confirmacion':
    case 'pendiente_recoleccion':
      return 'bg-yellow-500/80 hover:bg-yellow-500'; // Amarillo
    case 'en_recoleccion':
    case 'recolectado':
      return 'bg-orange-500/80 hover:bg-orange-500'; // Naranja
    case 'en_camino':
    case 'llegando_destino':
      return 'bg-blue-500/80 hover:bg-blue-500'; // Azul
    case 'entregado':
      return 'bg-green-500/80 hover:bg-green-500'; // Verde
    case 'no_entregado':
    case 'devuelto_origen':
    case 'fallido':
    case 'cancelado':
      return 'bg-red-500/80 hover:bg-red-500'; // Rojo
    default:
      return 'bg-gray-500/80 hover:bg-gray-500'; // Gris
  }
};

export default function MapaEnviosPage() {
  const { toast } = useToast();
  const [repartosFilterList, setRepartosFilterList] = React.useState<RepartoParaFiltroMapa[]>([]);
  const [envios, setEnvios] = React.useState<EnvioParaMapa[]>([]);
  const [selectedFilter, setSelectedFilter] = React.useState<string>("todos_activos"); // 'todos_activos', 'pendientes_asignacion', or reparto_id
  const [isLoadingFilters, setIsLoadingFilters] = React.useState(true);
  const [isLoadingEnvios, setIsLoadingEnvios] = React.useState(true);
  const [googleMapsApiKey, setGoogleMapsApiKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Client-side check for API Key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      setGoogleMapsApiKey(apiKey);
    } else {
      toast({
        title: "API Key de Google Maps no configurada",
        description: "El mapa no se mostrará. Por favor, configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.",
        variant: "destructive",
        duration: 10000,
      });
    }

    const fetchFilters = async () => {
      setIsLoadingFilters(true);
      const result = await getRepartosForMapFilterAction();
      if (result.data) {
        setRepartosFilterList(result.data);
      } else {
        toast({
          title: "Error al cargar filtros de reparto",
          description: result.error?.message || "No se pudieron cargar los repartos.",
          variant: "destructive",
        });
      }
      setIsLoadingFilters(false);
    };
    fetchFilters();
  }, [toast]);

  React.useEffect(() => {
    const fetchEnvios = async () => {
      setIsLoadingEnvios(true);
      let filterToApply: MapaEnviosFilterType;
      if (selectedFilter === "todos_activos") {
        filterToApply = { type: 'todos_activos' };
      } else if (selectedFilter === "pendientes_asignacion") {
        filterToApply = { type: 'pendientes_asignacion' };
      } else {
        filterToApply = { type: 'reparto', id: selectedFilter };
      }

      const result = await getEnviosForMapAction(filterToApply);
      if (result.data) {
        setEnvios(result.data);
      } else {
        toast({
          title: "Error al cargar envíos para el mapa",
          description: result.error?.message || "No se pudieron cargar los envíos.",
          variant: "destructive",
        });
        setEnvios([]);
      }
      setIsLoadingEnvios(false);
    };
    fetchEnvios();
  }, [selectedFilter, toast]);

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
  };

  const filterOptions = [
    { value: "todos_activos", label: "Todos los Envíos Activos" },
    { value: "pendientes_asignacion", label: "Envíos Pendientes de Asignación" },
    ...repartosFilterList.map(r => ({
      value: r.id,
      label: `Reparto: ${r.nombre_reparto || new Date(r.fecha_reparto + 'T00:00:00').toLocaleDateString()} (${r.id.substring(0,4)})`
    }))
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mapa de Envíos</h1>
          <p className="text-muted-foreground">Visualiza la ubicación de los envíos y filtra por reparto.</p>
        </div>
        <div className="w-full md:w-auto min-w-[250px]">
          {isLoadingFilters ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando filtros...
            </div>
          ) : (
            <Select onValueChange={handleFilterChange} value={selectedFilter}>
              <SelectTrigger className="w-full">
                <ListFilter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Seleccionar filtro..." />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Card className="shadow-lg flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="text-primary"/>Visualización de Envíos</CardTitle>
          <CardDescription>
            {selectedFilter === 'todos_activos' && 'Mostrando todos los envíos activos con coordenadas.'}
            {selectedFilter === 'pendientes_asignacion' && 'Mostrando envíos pendientes de asignación con coordenadas.'}
            {repartosFilterList.find(r => r.id === selectedFilter) && 
              `Mostrando envíos para el reparto: ${repartosFilterList.find(r => r.id === selectedFilter)?.nombre_reparto || new Date(repartosFilterList.find(r => r.id === selectedFilter)!.fecha_reparto + 'T00:00:00').toLocaleDateString()}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center bg-muted/10 rounded-b-lg p-0 md:p-2">
          {googleMapsApiKey ? (
            <div className="w-full h-[500px] md:h-full relative bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
              {/* Placeholder for Google Maps iframe or component */}
              {/* For a real map, replace this with your Google Maps component passing envios and apiKey */}
              <Image
                src={`https://maps.googleapis.com/maps/api/staticmap?center=-38.0055,-57.5426&zoom=12&size=1200x800&maptype=roadmap&key=${googleMapsApiKey}${envios.filter(e => e.latitud_destino && e.longitud_destino).map(e => `&markers=color:${getEstadoEnvioBadgeColor(e.estatus).substring(3)}%7Clabel:${e.tracking_number.substring(0,1)}%7C${e.latitud_destino},${e.longitud_destino}`).join('')}`}
                alt="Mapa de seguimiento de envíos (Placeholder con Google Static Maps)"
                layout="fill"
                objectFit="cover"
                className="rounded-md"
                data-ai-hint="city map deliveries"
                unoptimized // Good for external URLs that might change often based on params
              />
              <div className="absolute bottom-2 left-2 bg-background/80 p-2 rounded shadow text-xs">
                Mapa es una representación estática. Se requiere integración completa para interactividad.
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MapPin className="h-16 w-16 text-destructive mb-4" />
                <p className="text-lg font-semibold">API Key de Google Maps no disponible</p>
                <p className="text-muted-foreground">
                  Por favor, configura la variable de entorno `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` para mostrar el mapa.
                </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoadingEnvios ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Cargando envíos...</p>
        </div>
      ) : envios.length > 0 ? (
        <Card className="shadow-lg mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="text-primary"/>Detalle de Envíos en Mapa ({envios.length})</CardTitle>
            <CardDescription>Lista de envíos actualmente visibles en el mapa.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {envios.map(envio => (
                <div key={envio.id} className="p-3 border rounded-lg bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-1">
                     <span
                      className={cn("w-3 h-3 rounded-full inline-block mr-1 shrink-0", getEstadoEnvioBadgeColor(envio.estatus))}
                      title={`Estado: ${envio.estatus.replace(/_/g, ' ')}`}
                    />
                    <h4 className="font-semibold truncate text-sm">{envio.tracking_number}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground truncate" title={envio.direccion_destino}>
                    <MapPin className="inline h-3 w-3 mr-1" /> {envio.direccion_destino}
                  </p>
                  <p className="text-xs text-muted-foreground">Cliente: {envio.cliente?.nombre_completo || 'N/A'}</p>
                   <Badge variant="outline" className="mt-1 text-xs">{envio.estatus.replace(/_/g, ' ')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          No hay envíos para mostrar con el filtro seleccionado.
        </div>
      )}
    </div>
  );
}
