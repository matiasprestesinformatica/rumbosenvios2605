
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Reparto, ParadaReparto, DbResult, DbResultList } from '@/types';
import { repartoCreateSchema, repartoUpdateSchema, type RepartoCreateValues, type RepartoUpdateValues } from '@/lib/validators';
import { paradaRepartoCreateSchema, paradaRepartoUpdateSchema, type ParadaRepartoCreateValues, type ParadaRepartoUpdateValues } from '@/lib/validators';
import { z } from 'zod';

// Reparto Actions
export async function addRepartoAction(values: RepartoCreateValues): Promise<DbResult<Reparto>> {
  const supabase = createSupabaseServerClient();
  const validation = repartoCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('repartos')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding reparto:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
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

export async function getRepartoByIdAction(id: string): Promise<DbResult<Reparto & { paradas_reparto: ParadaReparto[] }>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de reparto es requerido.') };

  const { data, error } = await supabase
    .from('repartos')
    .select(`
      *,
      repartidor:repartidores ( id, nombre_completo ),
      paradas_reparto (
        *,
        envio:envios (id, tracking_number, direccion_destino)
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

// ParadaReparto Actions (nested under repartos or could be separate)
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
        envio:envios (id, tracking_number, direccion_destino)
    `, { count: 'exact'})
    .eq('reparto_id', repartoId)
    .order('secuencia_parada', { ascending: true });

  if (error) {
    console.error('Error fetching paradas by reparto ID:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}
