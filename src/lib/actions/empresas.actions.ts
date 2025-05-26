
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Empresa, DbResult, DbResultList } from '@/types';
import { empresaCreateSchema, empresaUpdateSchema, type EmpresaCreateValues, type EmpresaUpdateValues } from '@/lib/validators';
import { z } from 'zod';

export async function addEmpresaAction(values: EmpresaCreateValues): Promise<DbResult<Empresa>> {
  const supabase = createSupabaseServerClient();
  const validation = empresaCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('empresas')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding empresa:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function updateEmpresaAction(id: string, values: EmpresaUpdateValues): Promise<DbResult<Empresa>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de empresa es requerido para actualizar.') };
  
  const validation = empresaUpdateSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('empresas')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating empresa:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function deleteEmpresaAction(id: string): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de empresa es requerido para eliminar.') };

  const { error } = await supabase.from('empresas').delete().eq('id', id);

  if (error) {
    console.error('Error deleting empresa:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data: null, error: null };
}

export async function getEmpresaByIdAction(id: string): Promise<DbResult<Empresa>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de empresa es requerido.') };

  const { data, error } = await supabase.from('empresas').select('*').eq('id', id).single();

  if (error) {
    console.error('Error fetching empresa by ID:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function getEmpresasAction(
  { page = 1, pageSize = 10, searchTerm }: { page?: number; pageSize?: number; searchTerm?: string } = {}
): Promise<DbResultList<Empresa>> {
  const supabase = createSupabaseServerClient();
  const query = supabase.from('empresas').select('*', { count: 'exact' });

  if (searchTerm) {
    query.or(`nombre.ilike.%${searchTerm}%,rfc.ilike.%${searchTerm}%,email_contacto.ilike.%${searchTerm}%`);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query.range(start, end).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching empresas:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}
