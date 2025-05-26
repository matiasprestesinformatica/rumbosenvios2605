
-- Habilitar extensiones necesarias (si aún no están habilitadas)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Para gen_random_uuid() si no está por defecto
-- CREATE EXTENSION IF NOT EXISTS "moddatetime"; -- Para la función moddatetime (si se usa para updated_at triggers)
-- CREATE EXTENSION IF NOT EXISTS postgis; -- Para tipos de datos geoespaciales como geometry(Point, 4326)

-- Función auxiliar para generar cadenas alfanuméricas aleatorias (para tracking_number, por ejemplo)
CREATE OR REPLACE FUNCTION generate_random_alphanumeric(length INTEGER)
RETURNS TEXT AS $$
DECLARE
  chars TEXT[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result TEXT := '';
  i INTEGER;
BEGIN
  IF length < 1 THEN
    RAISE EXCEPTION 'Length must be at least 1';
  END IF;
  FOR i IN 1..length LOOP
    result := result || chars[1 + floor(random() * array_length(chars, 1))];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Función para actualizar automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ENUMs globales
CREATE TYPE public.tipo_vehiculo_enum AS ENUM (
    'motocicleta',
    'bicicleta',
    'automovil',
    'camioneta_pequena',
    'otro'
);

CREATE TYPE public.estatus_repartidor_enum AS ENUM (
    'activo',
    'inactivo',
    'en_descanso',
    'suspendido',
    'en_ruta' -- Añadido para mayor claridad
);

CREATE TYPE public.estatus_envio_enum AS ENUM (
    'pendiente',
    'programado',
    'en_recoleccion',
    'en_ruta_almacen',
    'en_almacen',
    'en_transito',
    'en_entrega',
    'entregado',
    'intento_fallido',
    'devuelto',
    'cancelado',
    'reprogramado'
);

CREATE TYPE public.estatus_reparto_enum AS ENUM (
    'planificado',
    'en_curso',
    'completado',
    'parcialmente_completado',
    'cancelado',
    'fallido'
);

CREATE TYPE public.tipo_parada_enum AS ENUM (
    'recoleccion',
    'entrega'
);

CREATE TYPE public.estatus_parada_enum AS ENUM (
    'pendiente',
    'en_ruta_a_parada',
    'en_parada',
    'completada',
    'omitida',
    'fallida',
    'reprogramada'
);

CREATE TYPE public.velocidad_entrega_enum AS ENUM (
    'standard',
    'express',
    'overnight'
);


-- Tabla: tipos_servicio
CREATE TABLE public.tipos_servicio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.tipos_servicio IS 'Catálogo de tipos de servicio ofrecidos (ej. Mensajería Express, Paquetería Estándar).';

-- Tabla: tipos_paquete
CREATE TABLE public.tipos_paquete (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    peso_max_kg NUMERIC CHECK (peso_max_kg > 0),
    largo_max_cm NUMERIC CHECK (largo_max_cm > 0),
    ancho_max_cm NUMERIC CHECK (ancho_max_cm > 0),
    alto_max_cm NUMERIC CHECK (alto_max_cm > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.tipos_paquete IS 'Catálogo de tipos de paquete aceptados (ej. Sobre, Caja Pequeña).';

-- Tabla: empresas
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_fiscal TEXT NOT NULL,
    nombre_comercial TEXT,
    rfc VARCHAR(13) UNIQUE,
    direccion_fiscal TEXT,
    email_contacto TEXT UNIQUE CHECK (email_contacto ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    telefono_contacto VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.empresas IS 'Información de las empresas que utilizan el servicio de envíos.';

-- Tabla: clientes
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
    nombre_completo TEXT NOT NULL,
    email TEXT UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    telefono VARCHAR(20),
    direccion_predeterminada TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.clientes IS 'Información de los clientes finales o remitentes individuales.';

-- Tabla: repartidores
CREATE TABLE public.repartidores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL, -- Opcional, si los repartidores son usuarios del sistema
    nombre_completo TEXT NOT NULL,
    email TEXT UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    telefono VARCHAR(20) NOT NULL UNIQUE,
    tipo_vehiculo tipo_vehiculo_enum,
    placa_vehiculo VARCHAR(20) UNIQUE,
    licencia_conducir VARCHAR(50) UNIQUE,
    estatus estatus_repartidor_enum NOT NULL DEFAULT 'activo',
    current_location GEOMETRY(Point, 4326), -- Requiere la extensión PostGIS
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.repartidores IS 'Información del personal de entrega.';
CREATE INDEX idx_repartidores_current_location ON public.repartidores USING GIST (current_location);

-- Tabla: envios
CREATE TABLE public.envios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id), -- Puede ser NULL si el envío es de una empresa directamente
    empresa_id UUID REFERENCES public.empresas(id), -- La empresa que solicita el envío (si aplica)
    tipo_servicio_id UUID NOT NULL REFERENCES public.tipos_servicio(id),
    tipo_paquete_id UUID NOT NULL REFERENCES public.tipos_paquete(id),
    
    origen_nombre_contacto TEXT NOT NULL,
    origen_telefono_contacto VARCHAR(20) NOT NULL,
    origen_email_contacto TEXT CHECK (origen_email_contacto ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    origen_direccion_completa TEXT NOT NULL,
    origen_referencias TEXT,
    origen_latitud NUMERIC(10, 7),
    origen_longitud NUMERIC(10, 7),
    origen_codigo_postal VARCHAR(10),
    
    destino_nombre_contacto TEXT NOT NULL,
    destino_telefono_contacto VARCHAR(20) NOT NULL,
    destino_email_contacto TEXT CHECK (destino_email_contacto ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    destino_direccion_completa TEXT NOT NULL,
    destino_referencias TEXT,
    destino_latitud NUMERIC(10, 7),
    destino_longitud NUMERIC(10, 7),
    destino_codigo_postal VARCHAR(10),

    descripcion_contenido TEXT NOT NULL,
    valor_declarado_contenido NUMERIC(10, 2) DEFAULT 0.00,
    peso_real_kg NUMERIC(6, 2) CHECK (peso_real_kg > 0),
    largo_cm NUMERIC(5,1) CHECK (largo_cm > 0),
    ancho_cm NUMERIC(5,1) CHECK (ancho_cm > 0),
    alto_cm NUMERIC(5,1) CHECK (alto_cm > 0),
    
    instrucciones_especiales TEXT,
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_recoleccion_programada_inicio TIMESTAMPTZ,
    fecha_recoleccion_programada_fin TIMESTAMPTZ,
    fecha_entrega_estimada_inicio TIMESTAMPTZ,
    fecha_entrega_estimada_fin TIMESTAMPTZ,
    fecha_entregado_real TIMESTAMPTZ,
    
    repartidor_asignado_id UUID REFERENCES public.repartidores(id) ON DELETE SET NULL,
    estatus estatus_envio_enum NOT NULL DEFAULT 'pendiente',
    costo_envio NUMERIC(10, 2) CHECK (costo_envio >= 0),
    costo_seguro NUMERIC(10, 2) DEFAULT 0.00 CHECK (costo_seguro >= 0),
    total_cobrado NUMERIC(10, 2) CHECK (total_cobrado >= 0),
    tracking_number VARCHAR(20) UNIQUE NOT NULL DEFAULT generate_random_alphanumeric(12),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_cliente_or_empresa CHECK (cliente_id IS NOT NULL OR empresa_id IS NOT NULL),
    CONSTRAINT chk_recoleccion_window CHECK (fecha_recoleccion_programada_fin >= fecha_recoleccion_programada_inicio OR fecha_recoleccion_programada_fin IS NULL OR fecha_recoleccion_programada_inicio IS NULL),
    CONSTRAINT chk_entrega_window CHECK (fecha_entrega_estimada_fin >= fecha_entrega_estimada_inicio OR fecha_entrega_estimada_fin IS NULL OR fecha_entrega_estimada_inicio IS NULL)
);
COMMENT ON TABLE public.envios IS 'Registros de cada envío solicitado.';
CREATE INDEX idx_envios_tracking_number ON public.envios(tracking_number);
CREATE INDEX idx_envios_estatus ON public.envios(estatus);
CREATE INDEX idx_envios_repartidor_asignado_id ON public.envios(repartidor_asignado_id);
CREATE INDEX idx_envios_cliente_id ON public.envios(cliente_id);
CREATE INDEX idx_envios_empresa_id ON public.envios(empresa_id);

-- Tabla: repartos
CREATE TABLE public.repartos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repartidor_id UUID NOT NULL REFERENCES public.repartidores(id),
    fecha_reparto DATE NOT NULL DEFAULT CURRENT_DATE,
    descripcion TEXT,
    estatus estatus_reparto_enum NOT NULL DEFAULT 'planificado',
    vehiculo_utilizado_info TEXT, -- E.g., "Motocicleta Honda CB190R - Placa XYZ123"
    km_estimado NUMERIC(8, 2),
    km_real NUMERIC(8, 2),
    tiempo_estimado_minutos INTEGER,
    tiempo_real_minutos INTEGER,
    notas_conductor TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.repartos IS 'Agrupación de envíos para una ruta o jornada de un repartidor.';
CREATE INDEX idx_repartos_repartidor_id ON public.repartos(repartidor_id);
CREATE INDEX idx_repartos_fecha_reparto ON public.repartos(fecha_reparto);
CREATE INDEX idx_repartos_estatus ON public.repartos(estatus);

-- Tabla: paradas_reparto (tabla intermedia para la relación muchos-a-muchos entre repartos y envíos)
CREATE TABLE public.paradas_reparto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reparto_id UUID NOT NULL REFERENCES public.repartos(id) ON DELETE CASCADE,
    envio_id UUID NOT NULL REFERENCES public.envios(id) ON DELETE CASCADE,
    secuencia_parada INTEGER NOT NULL CHECK (secuencia_parada > 0),
    tipo_parada tipo_parada_enum NOT NULL, -- 'recoleccion' o 'entrega'
    
    direccion_parada TEXT NOT NULL, -- Denormalizado del envío para la ruta
    latitud_parada NUMERIC(10, 7),
    longitud_parada NUMERIC(10, 7),
    
    hora_estimada_llegada TIMESTAMPTZ,
    hora_llegada_real TIMESTAMPTZ,
    hora_salida_real TIMESTAMPTZ,
    
    estatus_parada estatus_parada_enum NOT NULL DEFAULT 'pendiente',
    intentos_entrega INTEGER DEFAULT 0,
    motivo_fallido TEXT, -- Si la parada fue fallida
    foto_evidencia_url TEXT,
    firma_recibido_url TEXT,
    nombre_recibido TEXT,
    notas_parada TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (reparto_id, envio_id, tipo_parada), -- Un envío solo se recolecta o entrega una vez por reparto
    UNIQUE (reparto_id, secuencia_parada) -- La secuencia debe ser única dentro de un reparto
);
COMMENT ON TABLE public.paradas_reparto IS 'Detalle de cada parada (recolección o entrega) dentro de un reparto.';
CREATE INDEX idx_paradas_reparto_reparto_id ON public.paradas_reparto(reparto_id);
CREATE INDEX idx_paradas_reparto_envio_id ON public.paradas_reparto(envio_id);
CREATE INDEX idx_paradas_reparto_estatus_parada ON public.paradas_reparto(estatus_parada);


-- Tabla: tarifas_distancia_calculadora
CREATE TABLE public.tarifas_distancia_calculadora (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_servicio_id UUID NOT NULL REFERENCES public.tipos_servicio(id),
    tipo_paquete_id UUID NOT NULL REFERENCES public.tipos_paquete(id),
    velocidad_entrega velocidad_entrega_enum NOT NULL,
    
    distancia_min_km NUMERIC(8, 2) NOT NULL CHECK (distancia_min_km >= 0),
    distancia_max_km NUMERIC(8, 2) NOT NULL,
    
    tarifa_base NUMERIC(10, 2) NOT NULL CHECK (tarifa_base >= 0),
    costo_por_km_adicional NUMERIC(10, 2) DEFAULT 0.00 CHECK (costo_por_km_adicional >= 0),
    
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_distancia_max_mayor_min CHECK (distancia_max_km > distancia_min_km),
    -- Asegura que no haya rangos de distancia solapados para la misma combinación
    CONSTRAINT unique_tarifa_combinacion UNIQUE (tipo_servicio_id, tipo_paquete_id, velocidad_entrega, distancia_min_km, distancia_max_km)
);
COMMENT ON TABLE public.tarifas_distancia_calculadora IS 'Configuración de tarifas para la calculadora de precios, basada en distancia, tipo de paquete/servicio y velocidad.';
CREATE INDEX idx_tarifas_activa ON public.tarifas_distancia_calculadora(activa);

-- Triggers para updated_at
CREATE TRIGGER set_timestamp_tipos_servicio BEFORE UPDATE ON public.tipos_servicio FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_tipos_paquete BEFORE UPDATE ON public.tipos_paquete FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_empresas BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_clientes BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_repartidores BEFORE UPDATE ON public.repartidores FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_envios BEFORE UPDATE ON public.envios FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_repartos BEFORE UPDATE ON public.repartos FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_paradas_reparto BEFORE UPDATE ON public.paradas_reparto FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_tarifas_distancia_calculadora BEFORE UPDATE ON public.tarifas_distancia_calculadora FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- Políticas de RLS (Row Level Security)
DO $$
DECLARE
  tbl_name TEXT;
BEGIN
  FOR tbl_name IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE' 
      AND table_name NOT LIKE 'pg_%' -- Excluir tablas internas de PostgreSQL
      AND table_name NOT LIKE 'sql_%' -- Excluir tablas internas de SQL
      AND table_name NOT IN ('schema_migrations', 'genkit_traces', 'genkit_experiments', 'genkit_flow_states') -- Excluir tablas de migraciones y genkit
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl_name);
    
    -- Política para permitir todas las operaciones a usuarios autenticados
    EXECUTE format('
      CREATE POLICY "Allow all access for authenticated users on %s"
      ON public.%I
      FOR ALL
      TO authenticated
      USING (auth.role() = ''authenticated'')
      WITH CHECK (auth.role() = ''authenticated'');', tbl_name, tbl_name);

    -- Si necesitas políticas más restrictivas (ej. solo SELECT) o para roles específicos, créalas aquí.
    -- Ejemplo: permitir solo lectura a todos los usuarios (incluyendo anónimos si están habilitados)
    -- EXECUTE format('
    --   CREATE POLICY "Allow read access for all users on %s"
    --   ON public.%I
    --   FOR SELECT
    --   USING (true);', tbl_name, tbl_name);
  END LOOP;
END $$;

-- Nota: Si tienes roles anónimos ('anon') y quieres que tengan acceso de lectura a ciertas tablas,
-- deberás crear políticas específicas para 'anon' en esas tablas.
-- La política anterior para 'authenticated' asegura que solo los usuarios logueados pueden modificar datos.

-- Ejemplo de cómo permitir lectura al rol 'anon' en una tabla específica (ej. tipos_servicio)
-- ALTER POLICY "Allow all access for authenticated users on tipos_servicio" RENAME TO "Allow full access for authenticated users on tipos_servicio";
-- CREATE POLICY "Allow read access for anon users on tipos_servicio"
-- ON public.tipos_servicio
-- FOR SELECT
-- TO anon
-- USING (true);

-- Recuerda que si `auth.users` es referenciada, RLS también se aplica ahí.
-- Generalmente Supabase maneja las políticas para `auth.users` automáticamente.
-- Si creas funciones (RPC) que acceden a estas tablas, asegúrate de que se ejecuten con los permisos del invocador
-- o con `SECURITY DEFINER` si es necesario y seguro.
-- Por defecto, las funciones se ejecutan con `SECURITY INVOKER`.

COMMENT ON COLUMN public.repartidores.current_location IS 'Ubicación actual del repartidor. Requiere la extensión PostGIS habilitada en Supabase (extensions.postgis).';

-- Fin del script
