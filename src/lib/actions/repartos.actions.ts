
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Reparto, ParadaReparto, DbResult, DbResultList, Envio } from '@/types';
import { repartoCreateSchema, repartoUpdateSchema, type RepartoCreateValues, type RepartoUpdateValues, paradaRepartoCreateSchema, paradaRepartoUpdateSchema, type ParadaRepartoCreateValues, type ParadaRepartoUpdateValues } from '@/lib/validators';
import { z } from 'zod';

// Reparto Actions
export async function addRepartoAction(values: RepartoCreateValues): Promise<DbResult<Reparto>> {
  const supabase = createSupabaseServerClient();
  const validation = repartoCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación del reparto: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { envios_ids, ...repartoData } = validation.data;

  // 1. Create the Reparto
  const { data: nuevoReparto, error: errorReparto } = await supabase
    .from('repartos')
    .insert(repartoData)
    .select()
    .single();

  if (errorReparto || !nuevoReparto) {
    console.error('Error adding reparto:', errorReparto?.message);
    return { data: null, error: new Error(errorReparto?.message || "No se pudo crear el reparto.") };
  }

  // 2. Fetch details of selected envios to create paradas
  const { data: enviosDetails, error: errorEnvios } = await supabase
    .from('envios')
    .select('id, direccion_origen, latitud_origen, longitud_origen, referencia_origen, contacto_origen_nombre, contacto_origen_telefono, direccion_destino, latitud_destino, longitud_destino, referencia_destino, contacto_destino_nombre, contacto_destino_telefono, tipo_servicio_id, empresa_origen_id')
    .in('id', envios_ids);
  
  if (errorEnvios || !enviosDetails) {
     console.error('Error fetching envios for paradas:', errorEnvios?.message);
     // Attempt to delete the created reparto if paradas can't be created
     await supabase.from('repartos').delete().eq('id', nuevoReparto.id);
     return { data: null, error: new Error(errorEnvios?.message || "No se pudieron obtener los detalles de los envíos para crear las paradas.") };
  }

  // 3. Create ParadasReparto for each envio
  const paradasParaCrear: ParadaRepartoCreateValues[] = [];
  let secuencia = 1; // Start sequence at 1

  // Check if there's a common empresa_origen_id for a potential initial pickup stop
  const uniqueEmpresaOrigenIds = new Set(enviosDetails.map(e => e.empresa_origen_id).filter(id => id !== null));
  
  if (uniqueEmpresaOrigenIds.size === 1) {
    const empresaOrigenId = uniqueEmpresaOrigenIds.values().next().value;
    const { data: empresaOrigenDetails } = await supabase.from('empresas').select('direccion_fiscal, latitud, longitud, nombre_responsable, telefono_contacto').eq('id', empresaOrigenId).single();
    if (empresaOrigenDetails) {
      paradasParaCrear.push({
        reparto_id: nuevoReparto.id,
        envio_id: null, // No specific envio for this company pickup stop
        secuencia_parada: secuencia++,
        tipo_parada: 'recoleccion_empresa',
        direccion_parada: empresaOrigenDetails.direccion_fiscal || 'Dirección de empresa no disponible',
        latitud_parada: empresaOrigenDetails.latitud,
        longitud_parada: empresaOrigenDetails.longitud,
        nombre_contacto_parada: empresaOrigenDetails.nombre_responsable,
        telefono_contacto_parada: empresaOrigenDetails.telefono_contacto,
        estatus_parada: 'pendiente_recoleccion',
      });
    }
  }


  for (const envio of enviosDetails) {
    paradasParaCrear.push({
      reparto_id: nuevoReparto.id,
      envio_id: envio.id,
      secuencia_parada: secuencia++,
      // Determine tipo_parada based on your logic, e.g., always 'entrega_cliente' for now
      // Or if you have multiple services, you might need more complex logic
      tipo_parada: 'entrega_cliente', 
      direccion_parada: envio.direccion_destino,
      latitud_parada: envio.latitud_destino,
      longitud_parada: envio.longitud_destino,
      referencia_parada: envio.referencia_destino,
      nombre_contacto_parada: envio.contacto_destino_nombre,
      telefono_contacto_parada: envio.contacto_destino_telefono,
      estatus_parada: 'pendiente_recoleccion', // Initial status for the stop
    });
  }

  const { error: errorParadas } = await supabase
    .from('paradas_reparto')
    .insert(paradasParaCrear);

  if (errorParadas) {
    console.error('Error adding paradas_reparto:', errorParadas.message);
    // Attempt to delete the created reparto if paradas can't be created
    await supabase.from('repartos').delete().eq('id', nuevoReparto.id);
    return { data: null, error: new Error(errorParadas.message) };
  }

  // 4. Update status of selected envios
  const { error: errorUpdateEnvios } = await supabase
    .from('envios')
    .update({ estatus: 'en_recoleccion', repartidor_asignado_id: nuevoReparto.repartidor_id }) // Or 'asignado', 'en_ruta_recoleccion' etc.
    .in('id', envios_ids);

  if (errorUpdateEnvios) {
    console.warn('Error updating envios status, but reparto created:', errorUpdateEnvios.message);
    // Reparto is created, but envios status update failed. Decide on rollback or proceed.
  }

  return { data: nuevoReparto, error: null };
}

export async function updateRepartoAction(id: string, values: RepartoUpdateValues): Promise<DbResult<Reparto>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de reparto es requerido para actualizar.') };

  const validation = repartoUpdateSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('repartos')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating reparto:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function deleteRepartoAction(id: string): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de reparto es requerido para eliminar.') };

  // Consider deleting associated paradas_reparto if ON DELETE CASCADE is not set or for logging.
  const { error } = await supabase.from('repartos').delete().eq('id', id);

  if (error) {
    console.error('Error deleting reparto:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data: null, error: null };
}

export async function getRepartoByIdAction(id: string): Promise<DbResult<Reparto>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de reparto es requerido.') };

  const { data, error } = await supabase
    .from('repartos')
    .select(`
      *,
      repartidor:repartidores ( id, nombre_completo ),
      paradas_reparto:paradas_reparto (
        *,
        envio:envios (
          id, 
          tracking_number, 
          direccion_destino, 
          cliente_id, 
          estatus,
          cliente:clientes (nombre_completo) 
        )
      )
    `)
    .eq('id', id)
    .order('secuencia_parada', { referencedTable: 'paradas_reparto', ascending: true })
    .single();

  if (error) {
    console.error('Error fetching reparto by ID:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function getRepartosAction(
  { page = 1, pageSize = 10, searchTerm, repartidorId, fecha }:
  { page?: number; pageSize?: number; searchTerm?: string; repartidorId?: string; fecha?: string } = {}
): Promise<DbResultList<Reparto>> {
  const supabase = createSupabaseServerClient();
  let query = supabase.from('repartos').select(`
    *,
    repartidor:repartidores (id, nombre_completo)
  `, { count: 'exact' });

  if (searchTerm) {
    query = query.or(`nombre_reparto.ilike.%${searchTerm}%`);
  }
  if (repartidorId) {
    query = query.eq('repartidor_id', repartidorId);
  }
  if (fecha) {
    query = query.eq('fecha_reparto', fecha);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end).order('fecha_reparto', { ascending: false }).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching repartos:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}

// ParadaReparto Actions
export async function addParadaRepartoAction(values: ParadaRepartoCreateValues): Promise<DbResult<ParadaReparto>> {
  const supabase = createSupabaseServerClient();
  const validation = paradaRepartoCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('paradas_reparto')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding parada_reparto:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function updateParadaRepartoAction(id: string, values: ParadaRepartoUpdateValues): Promise<DbResult<ParadaReparto>> {
  const supabase = createSupabaseServerClient();
   if (!id) return { data: null, error: new Error('ID de parada es requerido para actualizar.') };

  const validation = paradaRepartoUpdateSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('paradas_reparto')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating parada_reparto:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function deleteParadaRepartoAction(id: string): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de parada es requerido para eliminar.') };

  const { error } = await supabase.from('paradas_reparto').delete().eq('id', id);

  if (error) {
    console.error('Error deleting parada_reparto:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data: null, error: null };
}

export async function getParadasByRepartoIdAction(repartoId: string): Promise<DbResultList<ParadaReparto>> {
  const supabase = createSupabaseServerClient();
  if (!repartoId) return { data: null, error: new Error('ID de reparto es requerido.'), count: null };

  const { data, error, count } = await supabase
    .from('paradas_reparto')
    .select(`
        *,
        envio:envios (
          id, 
          tracking_number, 
          direccion_destino, 
          cliente_id,
          estatus,
          cliente:clientes(nombre_completo)
        )
    `, { count: 'exact'})
    .eq('reparto_id', repartoId)
    .order('secuencia_parada', { ascending: true });

  if (error) {
    console.error('Error fetching paradas by reparto ID:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}

export async function updateRepartoEstadoAction(repartoId: string, nuevoEstatus: Envio['estatus']): Promise<DbResult<Reparto>> {
  const supabase = createSupabaseServerClient();
  if (!repartoId) return { data: null, error: new Error("ID de reparto es requerido.") };
  if (!nuevoEstatus) return { data: null, error: new Error("Nuevo estado es requerido.") };

  const { data, error } = await supabase
    .from('repartos')
    .update({ estatus: nuevoEstatus })
    .eq('id', repartoId)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando estado del reparto:", error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function reorderParadasAction(repartoId: string, paradasOrdenadas: { parada_id: string; nueva_secuencia: number }[]): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!repartoId) return { data: null, error: new Error("ID de reparto es requerido.") };
  if (!paradasOrdenadas || paradasOrdenadas.length === 0) return { data: null, error: new Error("Lista de paradas ordenadas no puede estar vacía.") };

  const updates = paradasOrdenadas.map(p =>
    supabase.from('paradas_reparto')
      .update({ secuencia_parada: p.nueva_secuencia })
      .eq('id', p.parada_id)
      .eq('reparto_id', repartoId) // Ensure we only update paradas for this reparto
  );

  const results = await Promise.all(updates);
  const firstError = results.find(r => r.error);

  if (firstError && firstError.error) {
    console.error("Error reordenando paradas:", firstError.error.message);
    return { data: null, error: new Error(firstError.error.message) };
  }
  return { data: null, error: null };
}

export async function updateParadaEstadoAction(paradaId: string, nuevoEstatus: Envio['estatus']): Promise<DbResult<ParadaReparto>> {
  const supabase = createSupabaseServerClient();
  if (!paradaId) return { data: null, error: new Error("ID de parada es requerido.") };
  if (!nuevoEstatus) return { data: null, error: new Error("Nuevo estado es requerido.") };

  const { data, error } = await supabase
    .from('paradas_reparto')
    .update({ estatus_parada: nuevoEstatus })
    .eq('id', paradaId)
    .select()
    .single();
  
  if (error) {
    console.error("Error actualizando estado de la parada:", error.message);
    return { data: null, error: new Error(error.message) };
  }

  // If the parada was completed, update the main envio status as well
  if (data && data.envio_id && (nuevoEstatus === 'entregado' || nuevoEstatus === 'no_entregado' || nuevoEstatus === 'devuelto_origen')) {
    const { error: envioError } = await supabase
      .from('envios')
      .update({ estatus: nuevoEstatus })
      .eq('id', data.envio_id);
    if (envioError) {
      console.warn(`Parada ${paradaId} actualizada a ${nuevoEstatus}, pero error al actualizar envío ${data.envio_id}: ${envioError.message}`);
      // Non-critical error, so we don't return it, but log it.
    }
  }
  
  return { data, error: null };
}
