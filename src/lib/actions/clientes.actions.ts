
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Cliente, DbResult, DbResultList } from '@/types';
import { clienteCreateSchema, clienteUpdateSchema, type ClienteCreateValues, type ClienteUpdateValues } from '@/lib/validators';
import { z } from 'zod';

export async function addClienteAction(values: ClienteCreateValues): Promise<DbResult<Cliente>> {
  const supabase = createSupabaseServerClient();
  const validation = clienteCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${validation.error.flatten().fieldErrors}`) };
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding cliente:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function updateClienteAction(id: string, values: ClienteUpdateValues): Promise<DbResult<Cliente>> {
  const supabase = createSupabaseServerClient();
   if (!id) return { data: null, error: new Error('ID de cliente es requerido para actualizar.') };

  const validation = clienteUpdateSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('clientes')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating cliente:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function deleteClienteAction(id: string): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de cliente es requerido para eliminar.') };

  const { error } = await supabase.from('clientes').delete().eq('id', id);

  if (error) {
    console.error('Error deleting cliente:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data: null, error: null };
}

export async function getClienteByIdAction(id: string): Promise<DbResult<Cliente>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de cliente es requerido.') };

  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching cliente by ID:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function getClientesAction(
  { page = 1, pageSize = 10, searchTerm }: { page?: number; pageSize?: number; searchTerm?: string } = {}
): Promise<DbResultList<Cliente>> {
  const supabase = createSupabaseServerClient();
  const query = supabase.from('clientes').select('*', { count: 'exact' });

  if (searchTerm) {
    query.or(`nombre_completo.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%`);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query.range(start, end).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching clientes:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}
