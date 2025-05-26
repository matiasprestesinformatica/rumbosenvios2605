
'use server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Reparto, ParadaReparto, DbResult, DbResultList, Envio, RepartoParaFiltroMapa, Empresa, Cliente } from '@/types';
import { repartoCreateSchema, repartoUpdateSchema, type RepartoCreateValues, type RepartoUpdateValues, paradaRepartoCreateSchema, paradaRepartoUpdateSchema, type ParadaRepartoCreateValues, type ParadaRepartoUpdateValues, repartoLoteCreateSchema, type RepartoLoteCreateValues } from '@/lib/validators';
import { z } from 'zod';

// Helper function to generate a simple tracking number
function generateTrackingNumber(): string {
  const prefix = "RUM";
  const timestamp = Date.now().toString().slice(-8);
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}${timestamp}${randomSuffix}`;
}

// Reparto Actions
export async function addRepartoAction(values: RepartoCreateValues): Promise<DbResult<Reparto>> {
  const supabase = createSupabaseServerClient();
  const validation = repartoCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación del reparto: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { envios_ids, ...repartoData } = validation.data;

  const { data: nuevoReparto, error: errorReparto } = await supabase
    .from('repartos')
    .insert(repartoData)
    .select()
    .single();

  if (errorReparto || !nuevoReparto) {
    console.error('Error adding reparto:', errorReparto?.message);
    return { data: null, error: new Error(errorReparto?.message || "No se pudo crear el reparto.") };
  }

  const { data: enviosDetails, error: errorEnvios } = await supabase
    .from('envios')
    .select('id, direccion_origen, latitud_origen, longitud_origen, referencia_origen, contacto_origen_nombre, contacto_origen_telefono, direccion_destino, latitud_destino, longitud_destino, referencia_destino, contacto_destino_nombre, contacto_destino_telefono, tipo_servicio_id, empresa_origen_id')
    .in('id', envios_ids);
  
  if (errorEnvios || !enviosDetails) {
     console.error('Error fetching envios for paradas:', errorEnvios?.message);
     await supabase.from('repartos').delete().eq('id', nuevoReparto.id);
     return { data: null, error: new Error(errorEnvios?.message || "No se pudieron obtener los detalles de los envíos para crear las paradas.") };
  }

  const paradasParaCrear: ParadaRepartoCreateValues[] = [];
  let secuencia = 1; 

  const uniqueEmpresaOrigenIds = new Set(enviosDetails.map(e => e.empresa_origen_id).filter(id => id !== null));
  
  if (uniqueEmpresaOrigenIds.size === 1) {
    const empresaOrigenId = uniqueEmpresaOrigenIds.values().next().value;
    const { data: empresaOrigenDetails } = await supabase.from('empresas').select('direccion_fiscal, latitud, longitud, nombre_responsable, telefono_contacto').eq('id', empresaOrigenId).single();
    if (empresaOrigenDetails) {
      paradasParaCrear.push({
        reparto_id: nuevoReparto.id,
        envio_id: null,
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
      tipo_parada: 'entrega_cliente', 
      direccion_parada: envio.direccion_destino,
      latitud_parada: envio.latitud_destino,
      longitud_parada: envio.longitud_destino,
      referencia_parada: envio.referencia_destino,
      nombre_contacto_parada: envio.contacto_destino_nombre,
      telefono_contacto_parada: envio.contacto_destino_telefono,
      estatus_parada: 'pendiente_recoleccion',
    });
  }

  const { error: errorParadas } = await supabase
    .from('paradas_reparto')
    .insert(paradasParaCrear);

  if (errorParadas) {
    console.error('Error adding paradas_reparto:', errorParadas.message);
    await supabase.from('repartos').delete().eq('id', nuevoReparto.id);
    return { data: null, error: new Error(errorParadas.message) };
  }

  const { error: errorUpdateEnvios } = await supabase
    .from('envios')
    .update({ 
      estatus: 'en_recoleccion', 
      repartidor_asignado_id: nuevoReparto.repartidor_id,
      reparto_id: nuevoReparto.id 
    }) 
    .in('id', envios_ids);

  if (errorUpdateEnvios) {
    console.warn('Error updating envios status, but reparto created:', errorUpdateEnvios.message);
  }

  return { data: nuevoReparto, error: null };
}

export async function addRepartoLoteAction(values: RepartoLoteCreateValues): Promise<DbResult<Reparto>> {
  const supabase = createSupabaseServerClient();
  const validation = repartoLoteCreateSchema.safeParse(values);

  if (!validation.success) {
    return { data: null, error: new Error(`Error de validación del reparto por lote: ${JSON.stringify(validation.error.flatten().fieldErrors)}`) };
  }

  const { empresa_id, repartidor_id, fecha_reparto, nombre_reparto, hora_inicio_estimada, hora_fin_estimada, clientes_config } = validation.data;

  // 1. Fetch Empresa details (for origin address and first stop)
  const { data: empresa, error: errorEmpresa } = await supabase
    .from('empresas')
    .select('id, nombre, direccion_fiscal, latitud, longitud, nombre_responsable, telefono_contacto')
    .eq('id', empresa_id)
    .single();

  if (errorEmpresa || !empresa) {
    return { data: null, error: new Error(errorEmpresa?.message || "No se pudo encontrar la empresa seleccionada.") };
  }

  const enviosCreadosIds: string[] = [];
  const paradasParaCrear: ParadaRepartoCreateValues[] = [];

  // 2. Create Envios for selected clients
  const clientesSeleccionados = clientes_config.filter(c => c.seleccionado && c.cliente_id && c.tipo_servicio_id);

  if (clientesSeleccionados.length === 0) {
    return { data: null, error: new Error("No se seleccionó ningún cliente válido para crear envíos.") };
  }

  for (const clienteConfig of clientesSeleccionados) {
    const { data: cliente, error: errorCliente } = await supabase
      .from('clientes')
      .select('id, direccion_predeterminada, latitud_predeterminada, longitud_predeterminada, nombre_completo, telefono')
      .eq('id', clienteConfig.cliente_id)
      .single();

    if (errorCliente || !cliente) {
      console.warn(`No se pudo encontrar el cliente con ID ${clienteConfig.cliente_id}. Saltando.`);
      continue;
    }

    const nuevoEnvioData = {
      cliente_id: cliente.id,
      empresa_origen_id: empresa.id,
      direccion_origen: empresa.direccion_fiscal || 'Dirección de empresa no disponible',
      latitud_origen: empresa.latitud,
      longitud_origen: empresa.longitud,
      contacto_origen_nombre: empresa.nombre_responsable || empresa.nombre,
      contacto_origen_telefono: empresa.telefono_contacto || 'N/A',
      direccion_destino: cliente.direccion_predeterminada || 'Dirección de cliente no disponible',
      latitud_destino: cliente.latitud_predeterminada,
      longitud_destino: cliente.longitud_predeterminada,
      contacto_destino_nombre: cliente.nombre_completo,
      contacto_destino_telefono: cliente.telefono || 'N/A',
      tipo_servicio_id: clienteConfig.tipo_servicio_id!, // Assert as it's filtered
      descripcion_paquete: clienteConfig.descripcion_paquete || 'Envío por lote',
      cantidad_paquetes: clienteConfig.cantidad_paquetes || 1,
      estatus: 'pendiente_recoleccion' as EstadoEnvioEnum, // Initial status for new envios in a batch
      tracking_number: generateTrackingNumber(),
      fecha_solicitud: new Date().toISOString(),
      costo_envio: clienteConfig.costo_envio_manual,
    };

    const { data: envioCreado, error: errorCrearEnvio } = await supabase
      .from('envios')
      .insert(nuevoEnvioData)
      .select('id, direccion_destino, latitud_destino, longitud_destino, contacto_destino_nombre, contacto_destino_telefono') // Select fields needed for parada
      .single();

    if (errorCrearEnvio || !envioCreado) {
      // Consider how to handle partial failures: rollback all or log and continue?
      // For now, we'll log and try to continue, but a transaction (RPC) would be better.
      console.error(`Error creando envío para cliente ${cliente.id}: ${errorCrearEnvio?.message}`);
      continue;
    }
    enviosCreadosIds.push(envioCreado.id);
    paradasParaCrear.push({ // Add to paradas to be created later
      envio_id: envioCreado.id,
      tipo_parada: 'entrega_cliente',
      direccion_parada: envioCreado.direccion_destino,
      latitud_parada: envioCreado.latitud_destino,
      longitud_parada: envioCreado.longitud_destino,
      nombre_contacto_parada: envioCreado.contacto_destino_nombre,
      telefono_contacto_parada: envioCreado.contacto_destino_telefono,
      estatus_parada: 'pendiente_recoleccion',
      secuencia_parada: 0, // Will be set later
      reparto_id: '', // Will be set later
    });
  }

  if (enviosCreadosIds.length === 0) {
    return { data: null, error: new Error("No se pudieron crear envíos para los clientes seleccionados.") };
  }

  // 3. Create the Reparto
  const repartoData: Omit<RepartoCreateValues, 'envios_ids'> = {
    repartidor_id,
    fecha_reparto,
    nombre_reparto: nombre_reparto || `Reparto Lote ${empresa.nombre} ${fecha_reparto}`,
    estatus: 'pendiente_recoleccion',
    hora_inicio_estimada,
    hora_fin_estimada,
  };

  const { data: nuevoReparto, error: errorReparto } = await supabase
    .from('repartos')
    .insert(repartoData)
    .select()
    .single();

  if (errorReparto || !nuevoReparto) {
    // Rollback created envios if reparto creation fails
    await supabase.from('envios').delete().in('id', enviosCreadosIds);
    return { data: null, error: new Error(errorReparto?.message || "No se pudo crear el registro del reparto.") };
  }

  // 4. Create ParadasReparto
  let secuencia = 1;
  const paradasFinales: ParadaRepartoCreateValues[] = [];

  // First stop: Recoleccion en Empresa
  paradasFinales.push({
    reparto_id: nuevoReparto.id,
    envio_id: null,
    secuencia_parada: secuencia++,
    tipo_parada: 'recoleccion_empresa',
    direccion_parada: empresa.direccion_fiscal || 'N/A',
    latitud_parada: empresa.latitud,
    longitud_parada: empresa.longitud,
    nombre_contacto_parada: empresa.nombre_responsable || empresa.nombre,
    telefono_contacto_parada: empresa.telefono_contacto,
    estatus_parada: 'pendiente_recoleccion',
  });

  // Subsequent stops: Entrega a Clientes
  for (const parada of paradasParaCrear) {
    paradasFinales.push({
      ...parada,
      reparto_id: nuevoReparto.id,
      secuencia_parada: secuencia++,
    });
  }

  const { error: errorParadas } = await supabase
    .from('paradas_reparto')
    .insert(paradasFinales);

  if (errorParadas) {
    await supabase.from('repartos').delete().eq('id', nuevoReparto.id);
    await supabase.from('envios').delete().in('id', enviosCreadosIds);
    return { data: null, error: new Error(`Error creando paradas: ${errorParadas.message}`) };
  }

  // 5. Update envios with reparto_id and repartidor_id
  const { error: errorUpdateEnvios } = await supabase
    .from('envios')
    .update({ reparto_id: nuevoReparto.id, repartidor_asignado_id: nuevoReparto.repartidor_id, estatus: 'en_recoleccion' })
    .in('id', enviosCreadosIds);

  if (errorUpdateEnvios) {
    console.warn(`Reparto por lote ${nuevoReparto.id} creado y paradas generadas, pero error al actualizar envíos: ${errorUpdateEnvios.message}`);
    // Decide if this warrants a full rollback. For now, log and return success as reparto is made.
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
      paradas_reparto (
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
    }
  }
  
  return { data, error: null };
}

export async function getRepartosForMapFilterAction(): Promise<DbResultList<RepartoParaFiltroMapa>> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('repartos')
    .select('id, nombre_reparto, fecha_reparto')
    .order('fecha_reparto', { ascending: false })
    .order('nombre_reparto', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching repartos for map filter:', error.message);
    return { data: null, error: new Error(error.message), count: null };
  }
  return { data, error: null, count: data?.length ?? 0 };
}
