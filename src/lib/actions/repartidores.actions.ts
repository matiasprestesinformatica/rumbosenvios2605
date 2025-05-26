
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Repartidor, DbResult, DbResultList } from '@/types';
import { repartidorCreateSchema, repartidorUpdateSchema, type RepartidorCreateValues, type RepartidorUpdateValues } from '@/lib/validators';
import { z } from 'zod';

export async function addRepartidorAction(values: RepartidorCreateValues): Promise<DbResult<Repartidor>> {
  const supabase = createSupabaseServerClient();
  const validation = repartidorCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('repartidores')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding repartidor:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function updateRepartidorAction(id: string, values: RepartidorUpdateValues): Promise<DbResult<Repartidor>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de repartidor es requerido para actualizar.') };

  const validation = repartidorUpdateSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('repartidores')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating repartidor:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function deleteRepartidorAction(id: string): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de repartidor es requerido para eliminar.') };

  const { error } = await supabase.from('repartidores').delete().eq('id', id);

  if (error) {
    console.error('Error deleting repartidor:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data: null, error: null };
}

export async function getRepartidorByIdAction(id: string): Promise<DbResult<Repartidor>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de repartidor es requerido.') };

  const { data, error } = await supabase.from('repartidores').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching repartidor by ID:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function getRepartidoresAction(
  { page = 1, pageSize = 10, searchTerm, estatus }: { page?: number; pageSize?: number; searchTerm?: string, estatus?: Repartidor['estatus'] } = {}
): Promise<DbResultList<Repartidor>> {
  const supabase = createSupabaseServerClient();
  let query = supabase.from('repartidores').select('*', { count: 'exact' });

  if (searchTerm) {
    query = query.or(`nombre_completo.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,placa_vehiculo.ilike.%${searchTerm}%`);
  }
  if (estatus) {
    query = query.eq('estatus', estatus);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching repartidores:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}
