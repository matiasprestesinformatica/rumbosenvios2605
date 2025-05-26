
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string;
  children?: NavItem[];
};

// Database Enums
export type EstadoEnvioEnum =
  | 'pendiente_confirmacion'
  | 'pendiente_recoleccion'
  | 'en_recoleccion'
  | 'recolectado'
  | 'en_camino'
  | 'llegando_destino'
  | 'entregado'
  | 'no_entregado'
  | 'devuelto_origen'
  | 'cancelado'
  | 'fallido';

export type TipoParadaEnum =
  | 'recoleccion_empresa'
  | 'entrega_cliente'
  | 'punto_logistico'
  | 'devolucion_origen';

export type TipoCalculadoraServicioEnum =
  | 'express_moto'
  | 'express_auto'
  | 'programado_24h'
  | 'lowcost_72h'
  | 'personalizado';

export type EstadoRepartidorEnum =
  | 'disponible'
  | 'en_ruta'
  | 'ocupado_otro'
  | 'inactivo'
  | 'en_mantenimiento';

export type TipoVehiculoEnum =
  | 'moto'
  | 'auto'
  | 'bicicleta'
  | 'utilitario_pequeno'
  | 'utilitario_grande';

// Database Tables
export interface Empresa {
  id: string; // UUID
  nombre: string;
  razon_social?: string | null;
  rfc?: string | null;
  direccion_fiscal?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  telefono_contacto?: string | null;
  email_contacto?: string | null;
  nombre_responsable?: string | null;
  sitio_web?: string | null;
  logo_url?: string | null;
  activa: boolean;
  notas?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Cliente {
  id: string; // UUID
  nombre_completo: string;
  email?: string | null;
  telefono?: string | null;
  direccion_predeterminada?: string | null;
  latitud_predeterminada?: number | null;
  longitud_predeterminada?: number | null;
  empresa_id?: string | null; // UUID, FK to empresas
  fecha_nacimiento?: string | null; // DATE
  notas_internas?: string | null;
  activo: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Repartidor {
  id: string; // UUID
  user_id?: string | null; // UUID, FK to auth.users
  nombre_completo: string;
  telefono: string;
  email?: string | null;
  fecha_nacimiento?: string | null; // DATE
  direccion?: string | null;
  tipo_vehiculo?: TipoVehiculoEnum | null;
  marca_vehiculo?: string | null;
  modelo_vehiculo?: string | null;
  anio_vehiculo?: number | null;
  placa_vehiculo?: string | null;
  numero_licencia?: string | null;
  fecha_vencimiento_licencia?: string | null; // DATE
  estatus: EstadoRepartidorEnum;
  foto_perfil_url?: string | null;
  current_location?: string | null; // Placeholder, idealmente GEOMETRY
  promedio_calificacion?: number | null; // NUMERIC(3,2)
  activo: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface TipoPaquete {
  id: string; // UUID
  nombre: string;
  descripcion?: string | null;
  peso_max_kg?: number | null; // NUMERIC(5,2)
  largo_max_cm?: number | null;
  ancho_max_cm?: number | null;
  alto_max_cm?: number | null;
  requiere_refrigeracion?: boolean;
  es_fragil?: boolean;
  activo: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface TipoServicio {
  id: string; // UUID
  nombre: string;
  descripcion?: string | null;
  tiempo_entrega_estimado_horas_min?: number | null;
  tiempo_entrega_estimado_horas_max?: number | null;
  disponible_fin_semana?: boolean;
  disponible_feriados?: boolean;
  activo: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Envio {
  id: string; // UUID
  cliente_id: string; // UUID, FK to clientes
  empresa_origen_id?: string | null; // UUID, FK to empresas
  direccion_origen: string;
  referencia_origen?: string | null;
  latitud_origen?: number | null; // NUMERIC(10,7)
  longitud_origen?: number | null; // NUMERIC(10,7)
  contacto_origen_nombre: string;
  contacto_origen_telefono: string;
  direccion_destino: string;
  referencia_destino?: string | null;
  latitud_destino?: number | null; // NUMERIC(10,7)
  longitud_destino?: number | null; // NUMERIC(10,7)
  tipo_paquete_id?: string | null; // UUID, FK to tipos_paquete
  tipo_servicio_id: string; // UUID, FK to tipos_servicio
  descripcion_paquete?: string | null;
  cantidad_paquetes?: number;
  peso_total_estimado_kg?: number | null; // NUMERIC(6,2)
  dimensiones_paquete_cm?: string | null;
  instrucciones_especiales?: string | null;
  valor_declarado?: number | null; // NUMERIC(10,2)
  requiere_cobro_destino?: boolean;
  monto_cobro_destino?: number | null; // NUMERIC(10,2)
  fecha_solicitud: string; // TIMESTAMPTZ
  fecha_recoleccion_programada_inicio?: string | null; // TIMESTAMPTZ
  fecha_recoleccion_programada_fin?: string | null; // TIMESTAMPTZ
  fecha_entrega_estimada_inicio?: string | null; // TIMESTAMPTZ
  fecha_entrega_estimada_fin?: string | null; // TIMESTAMPTZ
  fecha_entrega_real?: string | null; // TIMESTAMPTZ
  estatus: EstadoEnvioEnum;
  repartidor_asignado_id?: string | null; // UUID, FK to repartidores
  tracking_number: string;
  costo_envio?: number | null; // NUMERIC(10,2)
  costo_seguro?: number | null; // NUMERIC(10,2)
  costo_adicional?: number | null; // NUMERIC(10,2)
  costo_total?: number | null; // Generated NUMERIC(10,2)
  notas_internas?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  // For UI interaction, not directly in DB but useful
  timeWindowStart?: string;
  timeWindowEnd?: string;
  packageType?: string; // Simplified type from form
  urgency?: 'high' | 'medium' | 'low'; // Simplified urgency
  cliente?: Pick<Cliente, 'id' | 'nombre_completo' | 'email'>; // For joins
  empresa_origen?: Pick<Empresa, 'id' | 'nombre'>; // For joins
  tipo_paquete?: Pick<TipoPaquete, 'id' | 'nombre'>; // For joins
  tipo_servicio?: Pick<TipoServicio, 'id' | 'nombre'>; // For joins
  repartidor_asignado?: Pick<Repartidor, 'id' | 'nombre_completo'>; // For joins
}

export interface Reparto {
  id: string; // UUID
  nombre_reparto?: string | null;
  repartidor_id: string; // UUID, FK to repartidores
  fecha_reparto: string; // DATE string (YYYY-MM-DD)
  estatus: EstadoEnvioEnum; // Or a specific reparto_status_enum
  hora_inicio_estimada?: string | null; // TIME
  hora_fin_estimada?: string | null; // TIME
  distancia_total_estimada_km?: number | null; // NUMERIC(6,2)
  vehiculo_utilizado?: string | null;
  notas?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  repartidor?: Pick<Repartidor, 'id' | 'nombre_completo'>; // For joins
  paradas_reparto?: ParadaReparto[]; // For joins
}

export interface ParadaReparto {
  id: string; // UUID
  reparto_id: string; // UUID, FK to repartos
  envio_id?: string | null; // UUID, FK to envios
  secuencia_parada: number;
  tipo_parada: TipoParadaEnum;
  direccion_parada: string;
  referencia_parada?: string | null;
  latitud_parada?: number | null; // NUMERIC(10,7)
  longitud_parada?: number | null; // NUMERIC(10,7)
  nombre_contacto_parada?: string | null;
  telefono_contacto_parada?: string | null;
  notas_parada?: string | null;
  hora_estimada_llegada?: string | null; // TIME string HH:MM
  hora_real_llegada?: string | null; // TIMESTAMPTZ
  hora_real_salida?: string | null; // TIMESTAMPTZ
  estatus_parada: EstadoEnvioEnum; // Or a specific parada_status_enum
  foto_entrega_url?: string | null;
  firma_receptor_url?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  envio?: Pick<Envio, 'id' | 'tracking_number' | 'direccion_destino' | 'cliente_id' | 'estatus'> & { cliente?: Pick<Cliente, 'nombre_completo'> }; // For joins
}


export interface TarifaDistanciaCalculadora {
  id: string; // UUID
  tipo_servicio_id?: string | null; // UUID, FK to tipos_servicio
  tipo_calculadora_servicio: TipoCalculadoraServicioEnum;
  zona_geo?: string | null;
  distancia_min_km: number; // NUMERIC(6,2)
  distancia_max_km: number; // NUMERIC(6,2)
  tarifa_base: number; // NUMERIC(10,2)
  tarifa_km_adicional?: number | null; // NUMERIC(8,2)
  peso_max_kg_adicional?: number | null; // NUMERIC(5,2)
  tarifa_kg_adicional?: number | null; // NUMERIC(8,2)
  activo: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  tipo_servicio?: Pick<TipoServicio, 'id' | 'nombre'>; // For joins
}

// Generic type for CRUD operations
export type DbResult<T> = { data: T | null; error: Error | null };
export type DbResultList<T> = { data: T[] | null; error: Error | null; count?: number | null };


// For pricing form, not directly a DB table but used in UI
export interface PricedItem {
  id: string;
  name: string;
  price: number;
}


// From orders/page.tsx - needs to be compatible with Envios
export type Order = Pick<Envio,
  'id' |
  'cliente_id' |
  'direccion_destino' |
  'estatus' |
  'repartidor_asignado_id' |
  'fecha_entrega_estimada_fin' | // Using this for 'deadline'
  'tipo_paquete_id' | // Used for packageType indirectly
  'urgency' // This is a UI concept, not directly in DB as 'urgency'
> & {
  customerName: string; // Map from cliente.nombre_completo
  deliveryAddress: string; // Alias for direccion_destino
  deadline: string; // Alias for fecha_entrega_estimada_fin
  packageType?: string; // Simplified from tipo_paquete.nombre
  timeWindowStart?: string; // UI state
  // Added for AI prioritization flow
  timeWindowEnd?: string;
};


// From drivers/page.tsx
export type Driver = Pick<Repartidor,
  'id' |
  'nombre_completo' |
  'estatus' |
  'tipo_vehiculo' | // used for vehicle description
  'telefono' | // used for contact
  'direccion' // Using this for currentLocation as it's more likely to exist
> & {
  name?: string; // alias for nombre_completo
  vehicle?: string; // simplified from tipo_vehiculo, marca, modelo
  contact?: string; // alias for telefono
  currentLocation?: string; // Derived from direccion
  availabilityStart?: string; // For AI prioritization
  availabilityEnd?: string; // For AI prioritization
};

// AI Suggestion Types
export type DeliveryOptionSuggestion = {
  optionName: string;
  description: string;
  estimatedTime?: string;
  iconHint?: 'Truck' | 'Bike' | 'Zap' | 'Package';
};

export type AISuggestions = {
  suggestions: DeliveryOptionSuggestion[];
  disclaimer?: string;
};
