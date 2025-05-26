
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Envio, DbResult, DbResultList, EnvioParaMapa } from '@/types';
import { envioCreateSchema, envioUpdateSchema, type EnvioCreateValues, type EnvioUpdateValues } from '@/lib/validators';
import { z } from 'zod';

// Helper function to generate a simple tracking number (customize as needed)
function generateTrackingNumber(): string {
  const prefix = "RUM";
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 random alphanumeric chars
  return `${prefix}${timestamp}${randomSuffix}`;
}


export async function addEnvioAction(values: Omit<EnvioCreateValues, 'tracking_number'>): Promise<DbResult<Envio>> {
  const supabase = createSupabaseServerClient();
  
  const fullValues: EnvioCreateValues = {
    ...values,
    tracking_number: generateTrackingNumber(),
    fecha_solicitud: values.fecha_solicitud || new Date().toISOString(),
  };

  const validation = envioCreateSchema.safeParse(fullValues);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('envios')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding envio:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function updateEnvioAction(id: string, values: EnvioUpdateValues): Promise<DbResult<Envio>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de envío es requerido para actualizar.') };

  const validation = envioUpdateSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('envios')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating envio:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function deleteEnvioAction(id: string): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de envío es requerido para eliminar.') };

  const { error } = await supabase.from('envios').delete().eq('id', id);

  if (error) {
    console.error('Error deleting envio:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data: null, error: null };
}

export async function getEnvioByIdAction(id: string): Promise<DbResult<Envio>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de envío es requerido.') };

  const { data, error } = await supabase
    .from('envios')
    .select(`
      *,
      cliente:clientes ( id, nombre_completo, email ),
      empresa_origen:empresas ( id, nombre ),
      tipo_paquete:tipos_paquete ( id, nombre ),
      tipo_servicio:tipos_servicio ( id, nombre ),
      repartidor_asignado:repartidores ( id, nombre_completo )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching envio by ID:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function getEnviosAction(
  { page = 1, pageSize = 10, searchTerm, estatus, clienteId, repartidorId, fechaInicio, fechaFin }:
  {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    estatus?: Envio['estatus'];
    clienteId?: string;
    repartidorId?: string;
    fechaInicio?: string; // ISO Date string
    fechaFin?: string; // ISO Date string
  } = {}
): Promise<DbResultList<Envio>> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('envios')
    .select(`
      *,
      cliente:clientes ( id, nombre_completo ),
      repartidor_asignado:repartidores ( id, nombre_completo ),
      tipo_servicio:tipos_servicio (id, nombre)
    `, { count: 'exact' });

  if (searchTerm) {
    query = query.or(
      `tracking_number.ilike.%${searchTerm}%,` +
      `direccion_origen.ilike.%${searchTerm}%,` +
      `direccion_destino.ilike.%${searchTerm}%,` +
      `contacto_origen_nombre.ilike.%${searchTerm}%,` +
      `contacto_destino_nombre.ilike.%${searchTerm}%`
    );
  }
  if (estatus) {
    query = query.eq('estatus', estatus);
  }
  if (clienteId) {
    query = query.eq('cliente_id', clienteId);
  }
  if (repartidorId) {
    query = query.eq('repartidor_asignado_id', repartidorId);
  }
  if (fechaInicio) {
    query = query.gte('fecha_solicitud', fechaInicio);
  }
  if (fechaFin) {
    // Add 1 day to fechaFin to include the whole day
    const endDate = new Date(fechaFin);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt('fecha_solicitud', endDate.toISOString().split('T')[0]);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end).order('fecha_solicitud', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching envios:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}


export async function getEnviosPendientesForSelectAction(
  { pageSize = 200, empresaOrigenId }: { pageSize?: number, empresaOrigenId?: string } = {}
): Promise<DbResultList<Pick<Envio, 'id' | 'tracking_number' | 'direccion_destino' | 'cliente_id' | 'empresa_origen_id'> & { cliente?: Pick<Cliente, 'nombre_completo'> | null }>> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('envios')
    .select('id, tracking_number, direccion_destino, cliente_id, empresa_origen_id, cliente:clientes(nombre_completo)')
    .in('estatus', ['pendiente_recoleccion', 'pendiente_confirmacion']) // Consider which statuses are truly "pending" for a reparto
    .limit(pageSize)
    .order('created_at', { ascending: true });

  if (empresaOrigenId) {
    query = query.eq('empresa_origen_id', empresaOrigenId);
  } else {
    // If no empresa_origen_id is specified, we might want to exclude those that DO have one,
    // or handle this based on business logic. For now, fetch all pending.
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching envios pendientes:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null, count: data?.length };
}

export async function getEnviosForMapAction(
  filter: 
  | { type: 'reparto'; id: string }
  | { type: 'todos_activos' }
  | { type: 'pendientes_asignacion' }
): Promise<DbResultList<EnvioParaMapa>> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('envios')
    .select(`
      id,
      tracking_number,
      direccion_destino,
      latitud_destino,
      longitud_destino,
      estatus,
      reparto_id,
      cliente:clientes (nombre_completo)
    `)
    .not('latitud_destino', 'is', null)
    .not('longitud_destino', 'is', null);

  switch (filter.type) {
    case 'reparto':
      query = query.eq('reparto_id', filter.id);
      break;
    case 'todos_activos':
      query = query.not('estatus', 'in', '("entregado", "cancelado", "fallido")');
      break;
    case 'pendientes_asignacion':
      query = query.is('reparto_id', null)
                   .in('estatus', ['pendiente_confirmacion', 'pendiente_recoleccion', 'recolectado']);
      break;
  }

  const { data, error } = await query.limit(500); // Limit for map display

  if (error) {
    console.error('Error fetching envios for map:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  // Ensure cliente is null if not expanded, not undefined.
  const formattedData = data?.map(envio => ({
    ...envio,
    cliente: envio.cliente || null
  })) || null;

  return { data: formattedData, error: null, count: formattedData?.length ?? 0 };
}
