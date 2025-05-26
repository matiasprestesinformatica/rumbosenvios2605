
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string;
  children?: NavItem[];
};

// Placeholder types - expand as needed for your application
export type Cliente = {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
};

export type Empresa = {
  id: string;
  nombre: string;
  rfc?: string;
  direccion?: string;
  contactoNombre?: string;
  contactoEmail?: string;
};

export type Repartidor = {
  id: string;
  nombre: string;
  vehiculo?: string;
  estatus: 'disponible' | 'en_ruta' | 'inactivo';
  ubicacionActual?: { lat: number; lng: number };
};

export type Envio = {
  id: string;
  clienteId?: string;
  empresaId?: string;
  origen: string;
  destino: string;
  estatus: 'pendiente' | 'en_transito' | 'entregado' | 'fallido' | 'cancelado';
  repartidorAsignadoId?: string;
  fechaCreacion: string;
  fechaEntregaEstimada?: string;
  fechaEntregaReal?: string;
  detallesPaquete?: string;
};

export type Reparto = { // Could be a "delivery leg" or a collection of envios for one driver run
  id: string;
  repartidorId: string;
  envioIds: string[];
  fechaAsignacion: string;
  estatus: 'planificado' | 'en_curso' | 'completado' | 'cancelado';
  rutaEstimada?: any; // GeoJSON or similar
};

// You can add more specific types as your application grows.
