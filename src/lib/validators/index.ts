
import { z } from 'zod';

// ENUMs for reuse
export const estadoEnvioEnumSchema = z.enum([
  'pendiente_confirmacion',
  'pendiente_recoleccion',
  'en_recoleccion',
  'recolectado',
  'en_camino',
  'llegando_destino',
  'entregado',
  'no_entregado',
  'devuelto_origen',
  'cancelado',
  'fallido',
]);

export const tipoParadaEnumSchema = z.enum([
  'recoleccion_empresa',
  'entrega_cliente',
  'punto_logistico',
  'devolucion_origen',
]);

export const tipoCalculadoraServicioEnumSchema = z.enum([
  'express_moto',
  'express_auto',
  'programado_24h',
  'lowcost_72h',
  'personalizado',
]);

export const estadoRepartidorEnumSchema = z.enum([
  'disponible',
  'en_ruta',
  'ocupado_otro',
  'inactivo',
  'en_mantenimiento',
]);

export const tipoVehiculoEnumSchema = z.enum([
  'moto',
  'auto',
  'bicicleta',
  'utilitario_pequeno',
  'utilitario_grande',
]);

// Validators for Empresa
const baseEmpresaSchemaObject = z.object({
  nombre: z.string().min(2, "El nombre es requerido."),
  razon_social: z.string().optional().nullable(),
  rfc: z.string().max(13).optional().nullable(),
  direccion_fiscal: z.string().optional().nullable(),
  latitud: z.number().optional().nullable(),
  longitud: z.number().optional().nullable(),
  telefono_contacto: z.string().optional().nullable(),
  email_contacto: z.string().email("Email inválido.").optional().nullable(),
  nombre_responsable: z.string().optional().nullable(),
  sitio_web: z.string().url("URL inválida.").optional().nullable(),
  logo_url: z.string().url("URL inválida.").optional().nullable(),
  activa: z.boolean().default(true),
  notas: z.string().optional().nullable(),
});
export const empresaCreateSchema = baseEmpresaSchemaObject;
export type EmpresaCreateValues = z.infer<typeof empresaCreateSchema>;

export const empresaUpdateSchema = baseEmpresaSchemaObject.partial();
export type EmpresaUpdateValues = z.infer<typeof empresaUpdateSchema>;


// Validators for Cliente
const baseClienteSchemaObject = z.object({
  nombre_completo: z.string().min(2, "El nombre completo es requerido."),
  email: z.string().email("Email inválido.").optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion_predeterminada: z.string().optional().nullable(),
  latitud_predeterminada: z.number().optional().nullable(),
  longitud_predeterminada: z.number().optional().nullable(),
  empresa_id: z.string().uuid("ID de empresa inválido.").optional().nullable(),
  fecha_nacimiento: z.string().optional().nullable().refine(val => val ? !isNaN(Date.parse(val)) : true, { message: "Fecha inválida" }),
  notas_internas: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});
export const clienteCreateSchema = baseClienteSchemaObject;
export type ClienteCreateValues = z.infer<typeof clienteCreateSchema>;

export const clienteUpdateSchema = baseClienteSchemaObject.partial();
export type ClienteUpdateValues = z.infer<typeof clienteUpdateSchema>;


// Validators for Repartidor
const baseRepartidorSchemaObject = z.object({
  user_id: z.string().uuid("ID de usuario inválido.").optional().nullable(),
  nombre_completo: z.string().min(2, "El nombre completo es requerido."),
  telefono: z.string().min(8, "Teléfono inválido.").refine(val => /^[0-9+\-\s()]*$/.test(val), { message: "Teléfono contiene caracteres inválidos."}),
  email: z.string().email("Email inválido.").optional().nullable().or(z.literal('')),
  fecha_nacimiento: z.string().optional().nullable().refine(val => val ? !isNaN(Date.parse(val)) : true, { message: "Fecha inválida" }),
  direccion: z.string().optional().nullable(),
  tipo_vehiculo: tipoVehiculoEnumSchema.optional().nullable(),
  marca_vehiculo: z.string().optional().nullable(),
  modelo_vehiculo: z.string().optional().nullable(),
  anio_vehiculo: z.number().int().optional().nullable(),
  placa_vehiculo: z.string().optional().nullable(),
  numero_licencia: z.string().optional().nullable(),
  fecha_vencimiento_licencia: z.string().optional().nullable().refine(val => val ? !isNaN(Date.parse(val)) : true, { message: "Fecha inválida" }),
  estatus: estadoRepartidorEnumSchema.default('inactivo'),
  foto_perfil_url: z.string().url("URL inválida.").optional().nullable(),
  activo: z.boolean().default(true),
});
export const repartidorCreateSchema = baseRepartidorSchemaObject;
export type RepartidorCreateValues = z.infer<typeof repartidorCreateSchema>;

export const repartidorUpdateSchema = baseRepartidorSchemaObject.partial();
export type RepartidorUpdateValues = z.infer<typeof repartidorUpdateSchema>;


// Validators for TipoPaquete
const baseTipoPaqueteSchemaObject = z.object({
  nombre: z.string().min(2, "El nombre es requerido."),
  descripcion: z.string().optional().nullable(),
  peso_max_kg: z.number().positive("El peso debe ser positivo.").optional().nullable(),
  largo_max_cm: z.number().int().positive("Debe ser positivo.").optional().nullable(),
  ancho_max_cm: z.number().int().positive("Debe ser positivo.").optional().nullable(),
  alto_max_cm: z.number().int().positive("Debe ser positivo.").optional().nullable(),
  requiere_refrigeracion: z.boolean().default(false),
  es_fragil: z.boolean().default(false),
  activo: z.boolean().default(true),
});
export const tipoPaqueteCreateSchema = baseTipoPaqueteSchemaObject;
export type TipoPaqueteCreateValues = z.infer<typeof tipoPaqueteCreateSchema>;

export const tipoPaqueteUpdateSchema = baseTipoPaqueteSchemaObject.partial();
export type TipoPaqueteUpdateValues = z.infer<typeof tipoPaqueteUpdateSchema>;


// Validators for TipoServicio
const baseTipoServicioSchemaObject = z.object({
  nombre: z.string().min(2, "El nombre es requerido."),
  descripcion: z.string().optional().nullable(),
  tiempo_entrega_estimado_horas_min: z.number().int().positive("Debe ser positivo.").optional().nullable(),
  tiempo_entrega_estimado_horas_max: z.number().int().positive("Debe ser positivo.").optional().nullable(),
  disponible_fin_semana: z.boolean().default(false),
  disponible_feriados: z.boolean().default(false),
  activo: z.boolean().default(true),
});

export const tipoServicioCreateSchema = baseTipoServicioSchemaObject.refine(data => {
  if (data.tiempo_entrega_estimado_horas_min && data.tiempo_entrega_estimado_horas_max) {
      return data.tiempo_entrega_estimado_horas_min <= data.tiempo_entrega_estimado_horas_max;
  }
  return true;
}, { message: "El tiempo mínimo no puede ser mayor al máximo.", path: ["tiempo_entrega_estimado_horas_min"] });
export type TipoServicioCreateValues = z.infer<typeof tipoServicioCreateSchema>;

export const tipoServicioUpdateSchema = baseTipoServicioSchemaObject.partial().refine(data => {
  if (data.tiempo_entrega_estimado_horas_min !== undefined && data.tiempo_entrega_estimado_horas_max !== undefined && data.tiempo_entrega_estimado_horas_min !== null && data.tiempo_entrega_estimado_horas_max !== null) {
      return data.tiempo_entrega_estimado_horas_min <= data.tiempo_entrega_estimado_horas_max;
  }
  return true;
}, { message: "El tiempo mínimo no puede ser mayor al máximo.", path: ["tiempo_entrega_estimado_horas_min"] });
export type TipoServicioUpdateValues = z.infer<typeof tipoServicioUpdateSchema>;


// Validators for Envio
const baseEnvioSchemaObject = z.object({
  cliente_id: z.string().uuid("ID de cliente inválido."),
  empresa_origen_id: z.string().uuid("ID de empresa inválido.").optional().nullable(),
  direccion_origen: z.string().min(5, "Dirección de origen requerida."),
  referencia_origen: z.string().optional().nullable(),
  latitud_origen: z.number().optional().nullable(),
  longitud_origen: z.number().optional().nullable(),
  contacto_origen_nombre: z.string().min(2, "Nombre de contacto origen requerido."),
  contacto_origen_telefono: z.string().min(8, "Teléfono de contacto origen requerido.").refine(val => /^[0-9+\-\s()]*$/.test(val), { message: "Teléfono origen contiene caracteres inválidos."}),
  direccion_destino: z.string().min(5, "Dirección de destino requerida."),
  referencia_destino: z.string().optional().nullable(),
  latitud_destino: z.number().optional().nullable(),
  longitud_destino: z.number().optional().nullable(),
  tipo_paquete_id: z.string().uuid("ID de tipo de paquete inválido.").optional().nullable(),
  tipo_servicio_id: z.string().uuid("ID de tipo de servicio inválido."),
  descripcion_paquete: z.string().optional().nullable(),
  cantidad_paquetes: z.coerce.number().int().positive("Cantidad debe ser positiva.").default(1),
  peso_total_estimado_kg: z.coerce.number().positive("Peso debe ser positivo.").optional().nullable(),
  dimensiones_paquete_cm: z.string().optional().nullable(), // Ej: "30x20x10"
  instrucciones_especiales: z.string().optional().nullable(),
  valor_declarado: z.coerce.number().nonnegative("Valor debe ser no negativo.").default(0).optional().nullable(),
  requiere_cobro_destino: z.boolean().default(false),
  monto_cobro_destino: z.coerce.number().nonnegative("Monto debe ser no negativo.").optional().nullable(),
  fecha_solicitud: z.string().datetime({ message: "Fecha de solicitud inválida." }).optional(),
  fecha_recoleccion_programada_inicio: z.string().datetime({ message: "Fecha y hora de recolección inválida." }).optional().nullable(),
  fecha_recoleccion_programada_fin: z.string().datetime({ message: "Fecha y hora de recolección inválida." }).optional().nullable(),
  fecha_entrega_estimada_inicio: z.string().datetime({ message: "Fecha y hora de entrega inválida." }).optional().nullable(),
  fecha_entrega_estimada_fin: z.string().datetime({ message: "Fecha y hora de entrega inválida." }).optional().nullable(),
  estatus: estadoEnvioEnumSchema.default('pendiente_confirmacion'),
  repartidor_asignado_id: z.string().uuid().optional().nullable(),
  tracking_number: z.string().min(5, "Tracking number inválido.").optional(), // Optional on create, server generates
  costo_envio: z.coerce.number().nonnegative("Costo debe ser no negativo.").optional().nullable(),
  costo_seguro: z.coerce.number().nonnegative("Costo debe ser no negativo.").optional().nullable(),
  costo_adicional: z.coerce.number().nonnegative("Costo debe ser no negativo.").optional().nullable(),
  notas_internas: z.string().optional().nullable(),
});

export const envioCreateSchema = baseEnvioSchemaObject.refine(data => {
    if (data.requiere_cobro_destino && (data.monto_cobro_destino === null || data.monto_cobro_destino === undefined || data.monto_cobro_destino < 0)) {
        return false;
    }
    return true;
}, { message: "Monto de cobro a destino es requerido si se activa la opción.", path: ["monto_cobro_destino"] });
export type EnvioCreateValues = z.infer<typeof envioCreateSchema>;

export const envioUpdateSchema = baseEnvioSchemaObject.partial().refine(data => {
    if (data.requiere_cobro_destino !== undefined && data.requiere_cobro_destino && (data.monto_cobro_destino === null || data.monto_cobro_destino === undefined || data.monto_cobro_destino < 0)) {
        return false;
    }
    return true;
}, { message: "Monto de cobro a destino es requerido si se activa la opción.", path: ["monto_cobro_destino"] });
export type EnvioUpdateValues = z.infer<typeof envioUpdateSchema>;


// Validators for Reparto
const baseRepartoSchemaObject = z.object({
  nombre_reparto: z.string().min(3, "Nombre del reparto debe tener al menos 3 caracteres.").optional().nullable(),
  repartidor_id: z.string().uuid("ID de repartidor inválido."),
  fecha_reparto: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Fecha inválida" }), // Stores as YYYY-MM-DD string
  estatus: estadoEnvioEnumSchema.default('pendiente_recoleccion'), // Estatus inicial del reparto
  hora_inicio_estimada: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM inválido").optional().nullable(),
  hora_fin_estimada: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM inválido").optional().nullable(),
  distancia_total_estimada_km: z.number().positive().optional().nullable(),
  vehiculo_utilizado: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  envios_ids: z.array(z.string().uuid("ID de envío inválido")).min(1, "Debe seleccionar al menos un envío para el reparto."),
});
export const repartoCreateSchema = baseRepartoSchemaObject;
export type RepartoCreateValues = z.infer<typeof repartoCreateSchema>;

export const repartoUpdateSchema = baseRepartoSchemaObject.omit({ envios_ids: true }).partial(); // envios_ids usually not updated directly this way
export type RepartoUpdateValues = z.infer<typeof repartoUpdateSchema>;


// Validators for ParadaReparto
const baseParadaRepartoSchemaObject = z.object({
  reparto_id: z.string().uuid("ID de reparto inválido."),
  envio_id: z.string().uuid("ID de envío inválido.").optional().nullable(),
  secuencia_parada: z.number().int().positive("Secuencia debe ser positiva."),
  tipo_parada: tipoParadaEnumSchema,
  direccion_parada: z.string().min(5, "Dirección de parada requerida."),
  referencia_parada: z.string().optional().nullable(),
  latitud_parada: z.number().optional().nullable(),
  longitud_parada: z.number().optional().nullable(),
  nombre_contacto_parada: z.string().optional().nullable(),
  telefono_contacto_parada: z.string().optional().nullable(),
  notas_parada: z.string().optional().nullable(),
  hora_estimada_llegada: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM inválido").optional().nullable(),
  estatus_parada: estadoEnvioEnumSchema.default('pendiente_recoleccion'), // Initial status for a stop
});
export const paradaRepartoCreateSchema = baseParadaRepartoSchemaObject;
export type ParadaRepartoCreateValues = z.infer<typeof paradaRepartoCreateSchema>;

export const paradaRepartoUpdateSchema = baseParadaRepartoSchemaObject.partial();
export type ParadaRepartoUpdateValues = z.infer<typeof paradaRepartoUpdateSchema>;


// Validators for TarifaDistanciaCalculadora
const baseTarifaDistanciaCalculadoraSchemaObject = z.object({
  tipo_servicio_id: z.string().uuid("ID tipo servicio inválido.").optional().nullable(),
  tipo_calculadora_servicio: tipoCalculadoraServicioEnumSchema,
  zona_geo: z.string().optional().nullable(),
  distancia_min_km: z.number().nonnegative().default(0),
  distancia_max_km: z.number().positive("Distancia máxima debe ser positiva."),
  tarifa_base: z.number().nonnegative("Tarifa base no puede ser negativa."),
  tarifa_km_adicional: z.number().nonnegative().optional().nullable(),
  peso_max_kg_adicional: z.number().positive().optional().nullable(),
  tarifa_kg_adicional: z.number().nonnegative().optional().nullable(),
  activo: z.boolean().default(true),
});

export const tarifaDistanciaCalculadoraCreateSchema = baseTarifaDistanciaCalculadoraSchemaObject.refine(data => data.distancia_min_km < data.distancia_max_km, {
  message: "Distancia mínima debe ser menor a la máxima.",
  path: ["distancia_min_km"],
});
export type TarifaDistanciaCalculadoraCreateValues = z.infer<typeof tarifaDistanciaCalculadoraCreateSchema>;

export const tarifaDistanciaCalculadoraUpdateSchema = baseTarifaDistanciaCalculadoraSchemaObject.partial().refine(data => {
  if (data.distancia_min_km !== undefined && data.distancia_max_km !== undefined) {
    // Ensure they are not null before comparison if they are optional fields
    if (data.distancia_min_km !== null && data.distancia_max_km !== null) {
        return data.distancia_min_km < data.distancia_max_km;
    }
  }
  return true;
}, { message: "Distancia mínima debe ser menor a la máxima.", path: ["distancia_min_km"] });
export type TarifaDistanciaCalculadoraUpdateValues = z.infer<typeof tarifaDistanciaCalculadoraUpdateSchema>;
