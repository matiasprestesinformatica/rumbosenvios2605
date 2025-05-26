
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TarifaDistanciaCalculadora, DbResult, DbResultList } from '@/types';
import { tarifaDistanciaCalculadoraCreateSchema, tarifaDistanciaCalculadoraUpdateSchema, type TarifaDistanciaCalculadoraCreateValues, type TarifaDistanciaCalculadoraUpdateValues } from '@/lib/validators';
import { z } from 'zod';

export async function addTarifaAction(values: TarifaDistanciaCalculadoraCreateValues): Promise<DbResult<TarifaDistanciaCalculadora>> {
  const supabase = createSupabaseServerClient();
  const validation = tarifaDistanciaCalculadoraCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('tarifas_distancia_calculadora')
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error('Error adding tarifa:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function updateTarifaAction(id: string, values: TarifaDistanciaCalculadoraUpdateValues): Promise<DbResult<TarifaDistanciaCalculadora>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de tarifa es requerido para actualizar.') };

  const validation = tarifaDistanciaCalculadoraUpdateSchema.safeParse(values);
  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { data, error } = await supabase
    .from('tarifas_distancia_calculadora')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating tarifa:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function deleteTarifaAction(id: string): Promise<DbResult<null>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de tarifa es requerido para eliminar.') };

  const { error } = await supabase.from('tarifas_distancia_calculadora').delete().eq('id', id);

  if (error) {
    console.error('Error deleting tarifa:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data: null, error: null };
}

export async function getTarifaByIdAction(id: string): Promise<DbResult<TarifaDistanciaCalculadora>> {
  const supabase = createSupabaseServerClient();
  if (!id) return { data: null, error: new Error('ID de tarifa es requerido.') };

  const { data, error } = await supabase
    .from('tarifas_distancia_calculadora')
    .select('*, tipo_servicio:tipos_servicio(id, nombre)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching tarifa by ID:', error.message);
    return { data: null, error: new Error(error.message) };
  }
  return { data, error: null };
}

export async function getTarifasAction(
  { page = 1, pageSize = 10, tipoServicioId, tipoCalculadora }: 
  { page?: number; pageSize?: number; tipoServicioId?: string, tipoCalculadora?: TarifaDistanciaCalculadora['tipo_calculadora_servicio'] } = {}
): Promise<DbResultList<TarifaDistanciaCalculadora>> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('tarifas_distancia_calculadora')
    .select('*, tipo_servicio:tipos_servicio(id, nombre)', { count: 'exact' });

  if (tipoServicioId) {
    query = query.eq('tipo_servicio_id', tipoServicioId);
  }
  if (tipoCalculadora) {
    query = query.eq('tipo_calculadora_servicio', tipoCalculadora);
  }
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end).order('tipo_calculadora_servicio').order('distancia_min_km');

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching tarifas:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count };
}

