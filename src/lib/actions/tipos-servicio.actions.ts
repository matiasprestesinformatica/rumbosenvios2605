
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TipoServicio, DbResult, DbResultList } from '@/types';
import { tipoServicioCreateSchema, tipoServicioUpdateSchema, type TipoServicioCreateValues, type TipoServicioUpdateValues } from '@/lib/validators';
import { z } from 'zod';

export async function addTipoServicioAction(values: TipoServicioCreateValues): Promise<DbResult<TipoServicio>> {
  const supabase = createSupabaseServerClient();
  const validation = tipoServicioCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('tipos_servicio')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding tipo_servicio:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function updateTipoServicioAction(id: string, values: TipoServicioUpdateValues): Promise<DbResult<TipoServicio>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de tipo de servicio es requerido para actualizar.') };

  const validation = tipoServicioUpdateSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('tipos_servicio')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tipo_servicio:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function deleteTipoServicioAction(id: string): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de tipo de servicio es requerido para eliminar.') };

  const { error } = await supabase.from('tipos_servicio').delete().eq('id', id);

  if (error) {
    console.error('Error deleting tipo_servicio:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data: null, error: null };
}

export async function getTipoServicioByIdAction(id: string): Promise<DbResult<TipoServicio>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de tipo de servicio es requerido.') };

  const { data, error } = await supabase.from('tipos_servicio').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching tipo_servicio by ID:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function getTiposServicioAction(
  { page = 1, pageSize = 10, searchTerm, activo }: { page?: number; pageSize?: number; searchTerm?: string, activo?: boolean } = {}
): Promise<DbResultList<TipoServicio>> {
  const supabase = createSupabaseServerClient();
  let query = supabase.from('tipos_servicio').select('*', { count: 'exact' });

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
    console.error('Error fetching tipos_servicio:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}
