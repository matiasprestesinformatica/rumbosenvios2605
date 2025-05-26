
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TipoPaquete, DbResult, DbResultList } from '@/types';
import { tipoPaqueteCreateSchema, tipoPaqueteUpdateSchema, type TipoPaqueteCreateValues, type TipoPaqueteUpdateValues } from '@/lib/validators';
import { z } from 'zod';

export async function addTipoPaqueteAction(values: TipoPaqueteCreateValues): Promise<DbResult<TipoPaquete>> {
  const supabase = createSupabaseServerClient();
  const validation = tipoPaqueteCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('tipos_paquete')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding tipo_paquete:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function updateTipoPaqueteAction(id: string, values: TipoPaqueteUpdateValues): Promise<DbResult<TipoPaquete>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de tipo de paquete es requerido para actualizar.') };

  const validation = tipoPaqueteUpdateSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('tipos_paquete')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tipo_paquete:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function deleteTipoPaqueteAction(id: string): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de tipo de paquete es requerido para eliminar.') };

  const { error } = await supabase.from('tipos_paquete').delete().eq('id', id);

  if (error) {
    console.error('Error deleting tipo_paquete:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data: null, error: null };
}

export async function getTipoPaqueteByIdAction(id: string): Promise<DbResult<TipoPaquete>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de tipo de paquete es requerido.') };

  const { data, error } = await supabase.from('tipos_paquete').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching tipo_paquete by ID:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function getTiposPaqueteAction(
  { page = 1, pageSize = 10, searchTerm, activo }: { page?: number; pageSize?: number; searchTerm?: string, activo?: boolean } = {}
): Promise<DbResultList<TipoPaquete>> {
  const supabase = createSupabaseServerClient();
  let query = supabase.from('tipos_paquete').select('*', { count: 'exact' });

  if (searchTerm) {
    query = query.or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`);
  }
  if (activo !== undefined) {
    query = query.eq('activo', activo);
  }
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end).order('nombre', { ascending: true });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching tipos_paquete:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}

export async function getTiposPaqueteForSelectAction(
  { activo = true }: { activo?: boolean } = {}
): Promise<DbResultList<Pick<TipoPaquete, 'id' | 'nombre'>>> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('tipos_paquete')
    .select('id, nombre');
  
  if (activo !== undefined) {
    query = query.eq('activo', activo);
  }
  
  query = query.order('nombre', { ascending: true });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching tipos_paquete for select:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count: count ?? data?.length ?? 0 };
}
