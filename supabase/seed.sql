
-- Limpieza inicial de la base de datos
DROP TABLE IF EXISTS tarifas_distancia_calculadora CASCADE;
DROP TABLE IF EXISTS paradas_reparto CASCADE;
DROP TABLE IF EXISTS envios CASCADE;
DROP TABLE IF EXISTS repartos CASCADE;
DROP TABLE IF EXISTS tipos_servicio CASCADE;
DROP TABLE IF EXISTS tipos_paquete CASCADE;
DROP TABLE IF EXISTS repartidores CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

DROP TYPE IF EXISTS estadoenvioenum;
DROP TYPE IF EXISTS tipoparadaenum;
DROP TYPE IF EXISTS tipocalculadoraservicioenum;
DROP TYPE IF EXISTS estadorepartidorenum;
DROP TYPE IF EXISTS tipovehiculoenum;

-- Creación de ENUMs
CREATE TYPE estadoenvioenum AS ENUM (
  'pendiente_confirmacion', -- Usado para envios inicialmente
  'pendiente_recoleccion', -- Envío listo para ser recogido
  'en_recoleccion',        -- Reparto en proceso de recoger este envío
  'recolectado',           -- Envío ya en posesión del repartidor/centro
  'en_camino',             -- En ruta hacia el destino (para envío o reparto)
  'llegando_destino',      -- Cerca del punto de entrega
  'entregado',             -- Entrega completada
  'no_entregado',          -- Intento de entrega fallido
  'devuelto_origen',       -- Envío devuelto a origen
  'cancelado',             -- Envío o reparto cancelado
  'fallido'                -- Falla general
);

CREATE TYPE tipoparadaenum AS ENUM (
  'recoleccion_empresa',
  'entrega_cliente',
  'punto_logistico', -- Para paradas intermedias si se añaden en el futuro
  'devolucion_origen'
);

CREATE TYPE tipocalculadoraservicioenum AS ENUM (
  'express_moto',
  'express_auto',
  'programado_24h',
  'lowcost_72h',
  'personalizado'
);

CREATE TYPE estadorepartidorenum AS ENUM (
  'disponible',
  'en_ruta',
  'ocupado_otro',
  'inactivo',
  'en_mantenimiento'
);

CREATE TYPE tipovehiculoenum AS ENUM (
  'moto',
  'auto',
  'bicicleta',
  'utilitario_pequeno',
  'utilitario_grande'
);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creación de Tablas

CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  razon_social VARCHAR(255),
  rfc VARCHAR(13) UNIQUE,
  direccion_fiscal TEXT,
  latitud NUMERIC(10, 7),
  longitud NUMERIC(10, 7),
  telefono_contacto VARCHAR(50),
  email_contacto VARCHAR(255) UNIQUE,
  nombre_responsable VARCHAR(255),
  sitio_web VARCHAR(255),
  logo_url VARCHAR(255),
  activa BOOLEAN DEFAULT TRUE NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_empresas_updated_at
BEFORE UPDATE ON empresas
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  telefono VARCHAR(50),
  direccion_predeterminada TEXT,
  latitud_predeterminada NUMERIC(10, 7),
  longitud_predeterminada NUMERIC(10, 7),
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  fecha_nacimiento DATE,
  notas_internas TEXT,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_clientes_updated_at
BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

CREATE TABLE repartidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  fecha_nacimiento DATE,
  direccion TEXT,
  tipo_vehiculo tipovehiculoenum,
  marca_vehiculo VARCHAR(100),
  modelo_vehiculo VARCHAR(100),
  anio_vehiculo INT,
  placa_vehiculo VARCHAR(20) UNIQUE,
  numero_licencia VARCHAR(100) UNIQUE,
  fecha_vencimiento_licencia DATE,
  estatus estadorepartidorenum DEFAULT 'inactivo' NOT NULL,
  foto_perfil_url VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_repartidores_updated_at
BEFORE UPDATE ON repartidores
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE repartidores DISABLE ROW LEVEL SECURITY;

CREATE TABLE tipos_paquete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  peso_max_kg NUMERIC(5, 2),
  largo_max_cm INT,
  ancho_max_cm INT,
  alto_max_cm INT,
  requiere_refrigeracion BOOLEAN DEFAULT FALSE,
  es_fragil BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_tipos_paquete_updated_at
BEFORE UPDATE ON tipos_paquete
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE tipos_paquete DISABLE ROW LEVEL SECURITY;

CREATE TABLE tipos_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  tiempo_entrega_estimado_horas_min INT,
  tiempo_entrega_estimado_horas_max INT,
  disponible_fin_semana BOOLEAN DEFAULT FALSE,
  disponible_feriados BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_tiempo_entrega CHECK (tiempo_entrega_estimado_horas_min IS NULL OR tiempo_entrega_estimado_horas_max IS NULL OR tiempo_entrega_estimado_horas_min <= tiempo_entrega_estimado_horas_max)
);
CREATE TRIGGER set_tipos_servicio_updated_at
BEFORE UPDATE ON tipos_servicio
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE tipos_servicio DISABLE ROW LEVEL SECURITY;

CREATE TABLE repartos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_reparto VARCHAR(255),
  repartidor_id UUID NOT NULL REFERENCES repartidores(id) ON DELETE RESTRICT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL, -- Para retiros en lote de una empresa
  fecha_reparto DATE NOT NULL,
  estatus estadoenvioenum DEFAULT 'pendiente_recoleccion' NOT NULL,
  hora_inicio_estimada TIME,
  hora_fin_estimada TIME,
  distancia_total_estimada_km NUMERIC(6, 2),
  vehiculo_utilizado VARCHAR(255), -- Podría ser FK a una tabla de vehículos del repartidor
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_repartos_updated_at
BEFORE UPDATE ON repartos
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX idx_repartos_repartidor_id ON repartos(repartidor_id);
CREATE INDEX idx_repartos_fecha_reparto ON repartos(fecha_reparto);
ALTER TABLE repartos DISABLE ROW LEVEL SECURITY;

CREATE TABLE envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  empresa_origen_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  direccion_origen TEXT NOT NULL,
  referencia_origen TEXT,
  latitud_origen NUMERIC(10, 7),
  longitud_origen NUMERIC(10, 7),
  contacto_origen_nombre VARCHAR(255) NOT NULL,
  contacto_origen_telefono VARCHAR(50) NOT NULL,
  direccion_destino TEXT NOT NULL,
  referencia_destino TEXT,
  latitud_destino NUMERIC(10, 7),
  longitud_destino NUMERIC(10, 7),
  tipo_paquete_id UUID REFERENCES tipos_paquete(id) ON DELETE SET NULL,
  tipo_servicio_id UUID NOT NULL REFERENCES tipos_servicio(id) ON DELETE RESTRICT,
  descripcion_paquete TEXT,
  cantidad_paquetes INT DEFAULT 1 CHECK (cantidad_paquetes > 0),
  peso_total_estimado_kg NUMERIC(6, 2) CHECK (peso_total_estimado_kg IS NULL OR peso_total_estimado_kg > 0),
  dimensiones_paquete_cm VARCHAR(100), -- Ej: "30x20x10"
  instrucciones_especiales TEXT,
  valor_declarado NUMERIC(10, 2) DEFAULT 0 CHECK (valor_declarado IS NULL OR valor_declarado >= 0),
  requiere_cobro_destino BOOLEAN DEFAULT FALSE,
  monto_cobro_destino NUMERIC(10, 2) CHECK (monto_cobro_destino IS NULL OR monto_cobro_destino >= 0),
  fecha_solicitud TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_recoleccion_programada_inicio TIMESTAMPTZ,
  fecha_recoleccion_programada_fin TIMESTAMPTZ,
  fecha_entrega_estimada_inicio TIMESTAMPTZ,
  fecha_entrega_estimada_fin TIMESTAMPTZ,
  fecha_entrega_real TIMESTAMPTZ,
  estatus estadoenvioenum DEFAULT 'pendiente_confirmacion' NOT NULL,
  repartidor_asignado_id UUID REFERENCES repartidores(id) ON DELETE SET NULL,
  reparto_id UUID REFERENCES repartos(id) ON DELETE SET NULL,
  tracking_number VARCHAR(50) NOT NULL UNIQUE,
  costo_envio NUMERIC(10, 2) CHECK (costo_envio IS NULL OR costo_envio >= 0),
  costo_seguro NUMERIC(10, 2) CHECK (costo_seguro IS NULL OR costo_seguro >= 0),
  costo_adicional NUMERIC(10, 2) CHECK (costo_adicional IS NULL OR costo_adicional >= 0),
  costo_total NUMERIC(10, 2), -- Podría ser un campo generado
  notas_internas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_cobro_destino CHECK (NOT requiere_cobro_destino OR (requiere_cobro_destino AND monto_cobro_destino IS NOT NULL AND monto_cobro_destino >= 0))
);
CREATE TRIGGER set_envios_updated_at
BEFORE UPDATE ON envios
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX idx_envios_cliente_id ON envios(cliente_id);
CREATE INDEX idx_envios_repartidor_id ON envios(repartidor_asignado_id);
CREATE INDEX idx_envios_reparto_id ON envios(reparto_id);
CREATE INDEX idx_envios_estatus ON envios(estatus);
CREATE INDEX idx_envios_fecha_solicitud ON envios(fecha_solicitud);
ALTER TABLE envios DISABLE ROW LEVEL SECURITY;

CREATE TABLE paradas_reparto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reparto_id UUID NOT NULL REFERENCES repartos(id) ON DELETE CASCADE,
  envio_id UUID REFERENCES envios(id) ON DELETE SET NULL, -- Nullable para paradas de retiro en empresa
  orden INT NOT NULL, -- 'orden' en lugar de 'secuencia_parada' para alinearse con la solicitud
  tipo_parada tipoparadaenum NOT NULL,
  direccion_parada TEXT NOT NULL,
  referencia_parada TEXT,
  latitud_parada NUMERIC(10, 7),
  longitud_parada NUMERIC(10, 7),
  nombre_contacto_parada VARCHAR(255),
  telefono_contacto_parada VARCHAR(50),
  notas_parada TEXT,
  hora_estimada_llegada TIME,
  hora_real_llegada TIMESTAMPTZ,
  hora_real_salida TIMESTAMPTZ,
  estatus_parada estadoenvioenum DEFAULT 'pendiente_recoleccion' NOT NULL,
  foto_entrega_url VARCHAR(255),
  firma_receptor_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_reparto_orden UNIQUE (reparto_id, orden),
  CONSTRAINT chk_parada_envio_o_retiro CHECK ( (tipo_parada = 'entrega_cliente' AND envio_id IS NOT NULL) OR (tipo_parada = 'recoleccion_empresa' AND envio_id IS NULL) OR (tipo_parada != 'entrega_cliente' AND tipo_parada != 'recoleccion_empresa') )
);
CREATE TRIGGER set_paradas_reparto_updated_at
BEFORE UPDATE ON paradas_reparto
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX idx_paradas_reparto_reparto_id ON paradas_reparto(reparto_id);
CREATE INDEX idx_paradas_reparto_envio_id ON paradas_reparto(envio_id);
ALTER TABLE paradas_reparto DISABLE ROW LEVEL SECURITY;

CREATE TABLE tarifas_distancia_calculadora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_servicio_id UUID REFERENCES tipos_servicio(id) ON DELETE SET NULL, -- Puede ser general o por tipo de servicio
  tipo_calculadora_servicio tipocalculadoraservicioenum NOT NULL,
  zona_geo VARCHAR(100), -- Ej: "Mar del Plata Centro", "Zona Norte MDP"
  distancia_min_km NUMERIC(6, 2) DEFAULT 0 NOT NULL CHECK (distancia_min_km >= 0),
  distancia_max_km NUMERIC(6, 2) NOT NULL CHECK (distancia_max_km > 0),
  tarifa_base NUMERIC(10, 2) NOT NULL CHECK (tarifa_base >= 0),
  tarifa_km_adicional NUMERIC(8, 2) CHECK (tarifa_km_adicional IS NULL OR tarifa_km_adicional >= 0),
  peso_max_kg_adicional NUMERIC(5, 2) CHECK (peso_max_kg_adicional IS NULL OR peso_max_kg_adicional > 0),
  tarifa_kg_adicional NUMERIC(8, 2) CHECK (tarifa_kg_adicional IS NULL OR tarifa_kg_adicional >= 0),
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  valido_desde DATE DEFAULT CURRENT_DATE, -- Nueva columna para fecha de validez
  valido_hasta DATE,                   -- Nueva columna para fecha de validez
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_distancia_min_max CHECK (distancia_min_km < distancia_max_km),
  CONSTRAINT chk_validez_fechas CHECK (valido_desde IS NULL OR valido_hasta IS NULL OR valido_desde <= valido_hasta)
);
CREATE TRIGGER set_tarifas_distancia_calculadora_updated_at
BEFORE UPDATE ON tarifas_distancia_calculadora
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE INDEX idx_tarifas_tipo_calculadora ON tarifas_distancia_calculadora(tipo_calculadora_servicio, activo, valido_desde, valido_hasta);
ALTER TABLE tarifas_distancia_calculadora DISABLE ROW LEVEL SECURITY;


-- Inserción de Datos de Prueba

-- Empresas
INSERT INTO empresas (nombre, rfc, direccion_fiscal, email_contacto, telefono_contacto, nombre_responsable) VALUES
('Logística Costera SRL', 'LCO230115XYZ', 'Av. Colón 1234, Mar del Plata', 'contacto@logisticacostera.com', '2235550101', 'Roberto Pérez'),
('Envíos del Puerto SA', 'EPU220510ABC', '12 de Octubre 3456, Mar del Plata', 'admin@enviosdelpuerto.com', '2235550202', 'Ana García');

-- Clientes
INSERT INTO clientes (nombre_completo, email, telefono, direccion_predeterminada, empresa_id) VALUES
('Juan Rodríguez', 'juan.rod@email.com', '2236111111', 'Alberti 2020, Mar del Plata', (SELECT id FROM empresas WHERE nombre = 'Logística Costera SRL')),
('María López', 'maria.lopez@email.com', '2236222222', 'San Martín 3030, Mar del Plata', (SELECT id FROM empresas WHERE nombre = 'Envíos del Puerto SA')),
('Carlos Bianchi (Particular)', 'carlos.bianchi@email.net', '2236333333', 'Peña 4040, Mar del Plata', NULL);

-- Repartidores
INSERT INTO repartidores (nombre_completo, telefono, email, tipo_vehiculo, estatus) VALUES
('Pedro Ramirez', '2234555555', 'pedro.ramirez@reparto.com', 'moto', 'disponible'),
('Lucía Giménez', '2234666666', 'lucia.gimenez@reparto.com', 'auto', 'disponible');

-- Tipos de Paquete
INSERT INTO tipos_paquete (nombre, descripcion, peso_max_kg) VALUES
('Documento', 'Sobres y documentos importantes', 1.0),
('Paquete Pequeño', 'Cajas pequeñas de hasta 5kg', 5.0);

-- Tipos de Servicio
INSERT INTO tipos_servicio (nombre, descripcion, tiempo_entrega_estimado_horas_min, tiempo_entrega_estimado_horas_max) VALUES
('Express MDP', 'Entrega rápida dentro de Mar del Plata', 1, 3),
('Programado 24hs MDP', 'Entrega programada para el día siguiente en Mar del Plata', 12, 24);

-- Tarifas Distancia Calculadora
INSERT INTO tarifas_distancia_calculadora (tipo_calculadora_servicio, distancia_min_km, distancia_max_km, tarifa_base, tarifa_km_adicional, tipo_servicio_id) VALUES
('express_moto', 0, 5, 500.00, 50.00, (SELECT id FROM tipos_servicio WHERE nombre = 'Express MDP')),
('lowcost_72h', 0, 10, 300.00, 30.00, (SELECT id FROM tipos_servicio WHERE nombre = 'Programado 24hs MDP'));

-- No se insertan envíos, repartos ni paradas_reparto aquí para mantener el seed simple
-- Estos se crearían a través de la aplicación.

-- Mensaje de finalización (opcional)
-- SELECT 'Seed data inserted successfully and RLS disabled for all tables.';

