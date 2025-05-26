
-- Limpieza inicial de la base de datos
DROP TABLE IF EXISTS tarifas_distancia_calculadora CASCADE;
DROP TABLE IF EXISTS paradas_reparto CASCADE;
DROP TABLE IF EXISTS envios CASCADE;
DROP TABLE IF EXISTS repartos CASCADE;
DROP TABLE IF EXISTS tipos_paquete CASCADE;
DROP TABLE IF EXISTS tipos_servicio CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS repartidores CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;

DROP TYPE IF EXISTS estado_envio_enum CASCADE;
DROP TYPE IF EXISTS tipo_parada_enum CASCADE;
DROP TYPE IF EXISTS tipo_calculadora_servicio_enum CASCADE;
DROP TYPE IF EXISTS estado_repartidor_enum CASCADE;
DROP TYPE IF EXISTS tipo_vehiculo_enum CASCADE;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS postgis; -- Descomentar si se va a usar GEOMETRY para ubicaciones

-- Definición de ENUMs
CREATE TYPE estado_envio_enum AS ENUM (
  'pendiente_confirmacion', -- El cliente creó el pedido, pendiente de aprobación/pago
  'pendiente_recoleccion', -- Aprobado, esperando que un repartidor lo recoja
  'en_recoleccion', -- Repartidor en camino a recolectar
  'recolectado', -- Paquete en manos del repartidor o en centro de distribución
  'en_camino', -- En tránsito hacia el destino final
  'llegando_destino', -- Repartidor cerca del punto de entrega
  'entregado', -- Entrega completada exitosamente
  'no_entregado', -- Intento de entrega fallido (e.g., cliente ausente)
  'devuelto_origen', -- Paquete devuelto al remitente
  'cancelado', -- Envío cancelado por el cliente o la empresa
  'fallido' -- Problema grave que impide la entrega
);

CREATE TYPE tipo_parada_enum AS ENUM (
  'recoleccion_empresa',
  'entrega_cliente',
  'punto_logistico', -- E.g., centro de distribución
  'devolucion_origen'
);

CREATE TYPE tipo_calculadora_servicio_enum AS ENUM (
  'express_moto',
  'express_auto',
  'programado_24h',
  'lowcost_72h',
  'personalizado'
);

CREATE TYPE estado_repartidor_enum AS ENUM (
  'disponible',
  'en_ruta', -- Ocupado con un reparto activo
  'ocupado_otro', -- Ocupado pero no en reparto (e.g. almuerzo)
  'inactivo', -- No disponible para trabajar
  'en_mantenimiento' -- Vehículo o repartidor en mantenimiento
);

CREATE TYPE tipo_vehiculo_enum AS ENUM (
  'moto',
  'auto',
  'bicicleta',
  'utilitario_pequeno',
  'utilitario_grande'
);

-- Función para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabla: empresas
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  razon_social TEXT,
  rfc VARCHAR(13) UNIQUE,
  direccion_fiscal TEXT,
  telefono_contacto VARCHAR(20),
  email_contacto VARCHAR(255) UNIQUE,
  nombre_responsable VARCHAR(100),
  sitio_web VARCHAR(255),
  logo_url TEXT, -- URL al logo de la empresa
  activa BOOLEAN DEFAULT TRUE NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_empresas_updated_at
BEFORE UPDATE ON empresas
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso CRUD a usuarios autenticados en empresas" ON empresas
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Tabla: clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo TEXT NOT NULL,
  email VARCHAR(255) UNIQUE,
  telefono VARCHAR(20),
  direccion_predeterminada TEXT,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL, -- Cliente puede estar asociado a una empresa
  fecha_nacimiento DATE,
  notas_internas TEXT,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_clientes_updated_at
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso CRUD a usuarios autenticados en clientes" ON clientes
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Tabla: repartidores
CREATE TABLE repartidores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE, -- Opcional, si los repartidores tienen cuentas de usuario
  nombre_completo TEXT NOT NULL,
  telefono VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  fecha_nacimiento DATE,
  direccion TEXT,
  tipo_vehiculo tipo_vehiculo_enum,
  marca_vehiculo VARCHAR(50),
  modelo_vehiculo VARCHAR(50),
  anio_vehiculo INTEGER,
  placa_vehiculo VARCHAR(20) UNIQUE,
  numero_licencia VARCHAR(50) UNIQUE,
  fecha_vencimiento_licencia DATE,
  estatus estado_repartidor_enum DEFAULT 'inactivo' NOT NULL,
  foto_perfil_url TEXT,
  current_location TEXT, -- Placeholder: Usar GEOMETRY(Point, 4326) con PostGIS para ubicaciones reales
  promedio_calificacion NUMERIC(3,2) DEFAULT 0.00,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_repartidores_updated_at
BEFORE UPDATE ON repartidores
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE repartidores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso CRUD a usuarios autenticados en repartidores" ON repartidores
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Tabla: tipos_paquete
CREATE TABLE tipos_paquete (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  peso_max_kg NUMERIC(5,2),
  largo_max_cm INTEGER,
  ancho_max_cm INTEGER,
  alto_max_cm INTEGER,
  requiere_refrigeracion BOOLEAN DEFAULT FALSE,
  es_fragil BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_tipos_paquete_updated_at
BEFORE UPDATE ON tipos_paquete
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE tipos_paquete ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso CRUD a usuarios autenticados en tipos_paquete" ON tipos_paquete
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Tabla: tipos_servicio
CREATE TABLE tipos_servicio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT UNIQUE NOT NULL, -- Ej: "Entrega Express Moto", "Programado 24hs Auto"
  descripcion TEXT,
  tiempo_entrega_estimado_horas_min INTEGER,
  tiempo_entrega_estimado_horas_max INTEGER,
  disponible_fin_semana BOOLEAN DEFAULT FALSE,
  disponible_feriados BOOLEAN DEFAULT FALSE,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TRIGGER set_tipos_servicio_updated_at
BEFORE UPDATE ON tipos_servicio
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE tipos_servicio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso CRUD a usuarios autenticados en tipos_servicio" ON tipos_servicio
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Tabla: envios
CREATE TABLE envios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  empresa_origen_id UUID REFERENCES empresas(id) ON DELETE SET NULL, -- Si el origen es una empresa registrada
  direccion_origen TEXT NOT NULL,
  referencia_origen TEXT,
  latitud_origen NUMERIC(10,7),
  longitud_origen NUMERIC(10,7),
  contacto_origen_nombre VARCHAR(100) NOT NULL,
  contacto_origen_telefono VARCHAR(20) NOT NULL,
  direccion_destino TEXT NOT NULL,
  referencia_destino TEXT,
  latitud_destino NUMERIC(10,7),
  longitud_destino NUMERIC(10,7),
  contacto_destino_nombre VARCHAR(100) NOT NULL,
  contacto_destino_telefono VARCHAR(20) NOT NULL,
  tipo_paquete_id UUID REFERENCES tipos_paquete(id) ON DELETE RESTRICT,
  tipo_servicio_id UUID NOT NULL REFERENCES tipos_servicio(id) ON DELETE RESTRICT,
  descripcion_paquete TEXT,
  cantidad_paquetes INTEGER DEFAULT 1 CHECK (cantidad_paquetes > 0),
  peso_total_estimado_kg NUMERIC(6,2),
  dimensiones_paquete_cm TEXT, -- Ej: "30x20x10"
  instrucciones_especiales TEXT,
  valor_declarado NUMERIC(10,2) DEFAULT 0.00,
  requiere_cobro_destino BOOLEAN DEFAULT FALSE,
  monto_cobro_destino NUMERIC(10,2),
  fecha_solicitud TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_recoleccion_programada_inicio TIMESTAMPTZ,
  fecha_recoleccion_programada_fin TIMESTAMPTZ,
  fecha_entrega_estimada_inicio TIMESTAMPTZ,
  fecha_entrega_estimada_fin TIMESTAMPTZ,
  fecha_entrega_real TIMESTAMPTZ,
  estatus estado_envio_enum DEFAULT 'pendiente_confirmacion' NOT NULL,
  repartidor_asignado_id UUID REFERENCES repartidores(id) ON DELETE SET NULL,
  tracking_number VARCHAR(20) UNIQUE NOT NULL,
  costo_envio NUMERIC(10,2),
  costo_seguro NUMERIC(10,2),
  costo_adicional NUMERIC(10,2),
  costo_total NUMERIC(10,2) GENERATED ALWAYS AS (COALESCE(costo_envio, 0) + COALESCE(costo_seguro, 0) + COALESCE(costo_adicional, 0)) STORED,
  notas_internas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_fechas_recoleccion CHECK (fecha_recoleccion_programada_inicio IS NULL OR fecha_recoleccion_programada_fin IS NULL OR fecha_recoleccion_programada_inicio <= fecha_recoleccion_programada_fin),
  CONSTRAINT chk_fechas_entrega CHECK (fecha_entrega_estimada_inicio IS NULL OR fecha_entrega_estimada_fin IS NULL OR fecha_entrega_estimada_inicio <= fecha_entrega_estimada_fin)
);
CREATE INDEX idx_envios_cliente_id ON envios(cliente_id);
CREATE INDEX idx_envios_repartidor_id ON envios(repartidor_asignado_id);
CREATE INDEX idx_envios_estatus ON envios(estatus);
CREATE INDEX idx_envios_tracking_number ON envios(tracking_number);
CREATE INDEX idx_envios_fecha_solicitud ON envios(fecha_solicitud);

CREATE TRIGGER set_envios_updated_at
BEFORE UPDATE ON envios
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE envios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso CRUD a usuarios autenticados en envios" ON envios
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Tabla: repartos (agrupación de envíos para un repartidor en una ruta)
CREATE TABLE repartos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_reparto TEXT, -- Ej: "Ruta Matutina Centro 2024-07-20"
  repartidor_id UUID NOT NULL REFERENCES repartidores(id) ON DELETE RESTRICT,
  fecha_reparto DATE NOT NULL,
  estatus estado_envio_enum DEFAULT 'pendiente_recoleccion' NOT NULL, -- Podría ser un ENUM específico para repartos
  hora_inicio_estimada TIME,
  hora_fin_estimada TIME,
  distancia_total_estimada_km NUMERIC(6,2),
  vehiculo_utilizado TEXT, -- Podría tomarse del repartidor o especificarse aquí
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_repartos_repartidor_id ON repartos(repartidor_id);
CREATE INDEX idx_repartos_fecha_reparto ON repartos(fecha_reparto);
CREATE INDEX idx_repartos_estatus ON repartos(estatus);

CREATE TRIGGER set_repartos_updated_at
BEFORE UPDATE ON repartos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE repartos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso CRUD a usuarios autenticados en repartos" ON repartos
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Tabla: paradas_reparto (detalles de cada parada dentro de un reparto)
CREATE TABLE paradas_reparto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reparto_id UUID NOT NULL REFERENCES repartos(id) ON DELETE CASCADE, -- Si se borra el reparto, se borran sus paradas
  envio_id UUID REFERENCES envios(id) ON DELETE SET NULL, -- Una parada puede estar ligada a un envío específico
  secuencia_parada INTEGER NOT NULL, -- Orden de la parada en la ruta
  tipo_parada tipo_parada_enum NOT NULL,
  direccion_parada TEXT NOT NULL,
  referencia_parada TEXT,
  latitud_parada NUMERIC(10,7),
  longitud_parada NUMERIC(10,7),
  nombre_contacto_parada VARCHAR(100),
  telefono_contacto_parada VARCHAR(20),
  notas_parada TEXT,
  hora_estimada_llegada TIME,
  hora_real_llegada TIMESTAMPTZ,
  hora_real_salida TIMESTAMPTZ,
  estatus_parada estado_envio_enum DEFAULT 'pendiente_recoleccion' NOT NULL, -- Estado específico de la parada
  foto_entrega_url TEXT,
  firma_receptor_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (reparto_id, secuencia_parada) -- Una secuencia no se puede repetir en el mismo reparto
);
CREATE INDEX idx_paradas_reparto_id ON paradas_reparto(reparto_id);
CREATE INDEX idx_paradas_envio_id ON paradas_reparto(envio_id);

CREATE TRIGGER set_paradas_reparto_updated_at
BEFORE UPDATE ON paradas_reparto
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE paradas_reparto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso CRUD a usuarios autenticados en paradas_reparto" ON paradas_reparto
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Tabla: tarifas_distancia_calculadora
CREATE TABLE tarifas_distancia_calculadora (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_servicio_id UUID REFERENCES tipos_servicio(id) ON DELETE CASCADE,
  tipo_calculadora_servicio tipo_calculadora_servicio_enum NOT NULL,
  zona_geo VARCHAR(100), -- Ej: "Mar del Plata Centro", "Mar del Plata Periferia" (Opcional)
  distancia_min_km NUMERIC(6,2) DEFAULT 0.00 NOT NULL,
  distancia_max_km NUMERIC(6,2) NOT NULL,
  tarifa_base NUMERIC(10,2) NOT NULL,
  tarifa_km_adicional NUMERIC(8,2), -- Tarifa por cada km extra si supera distancia_max_km del rango
  peso_max_kg_adicional NUMERIC(5,2), -- Para rangos de peso
  tarifa_kg_adicional NUMERIC(8,2),
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_distancia_min_max CHECK (distancia_min_km < distancia_max_km),
  UNIQUE (tipo_calculadora_servicio, tipo_servicio_id, distancia_min_km, distancia_max_km, zona_geo) -- Evitar solapamiento de tarifas
);
CREATE INDEX idx_tarifas_tipo_servicio ON tarifas_distancia_calculadora(tipo_servicio_id);
CREATE INDEX idx_tarifas_tipo_calculadora ON tarifas_distancia_calculadora(tipo_calculadora_servicio);

CREATE TRIGGER set_tarifas_distancia_calculadora_updated_at
BEFORE UPDATE ON tarifas_distancia_calculadora
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
ALTER TABLE tarifas_distancia_calculadora ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso CRUD a usuarios autenticados en tarifas_distancia_calculadora" ON tarifas_distancia_calculadora
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Seed Data

-- Empresas
INSERT INTO empresas (nombre, razon_social, rfc, direccion_fiscal, telefono_contacto, email_contacto, nombre_responsable, sitio_web)
VALUES
('Logística Total MDP', 'Logística Total Mar del Plata SA', 'LTM120315XYZ', 'Av. Colón 3456, Mar del Plata', '2235123456', 'contacto@logisticatotalmdp.com', 'Juan Pérez', 'https://logisticatotalmdp.com'),
('Envios Costa Atlántica', 'Envios Costa Atlántica SRL', 'ECA010203ABC', 'Calle San Martín 1234, Mar del Plata', '2236987654', 'info@envioscosta.com.ar', 'Ana García', 'https://envioscosta.com.ar');

-- Clientes
WITH empresa_ltm AS (SELECT id FROM empresas WHERE rfc = 'LTM120315XYZ')
INSERT INTO clientes (nombre_completo, email, telefono, direccion_predeterminada, empresa_id)
VALUES
('María López', 'maria.lopez@email.com', '2234567890', 'Calle Falsa 123, Mar del Plata', NULL),
('Carlos Sánchez', 'carlos.sanchez@email.com', '2231122334', 'Av. Independencia 2345, Mar del Plata', (SELECT id FROM empresa_ltm)),
('Laura Fernández', 'laura.fernandez@workmail.com', '2239876543', 'Belgrano 3456, Oficina 3, Mar del Plata', (SELECT id FROM empresa_ltm));

-- Repartidores
INSERT INTO repartidores (nombre_completo, telefono, email, tipo_vehiculo, placa_vehiculo, estatus)
VALUES
('Roberto Gómez', '2233334444', 'roberto.gomez@repartos.com', 'moto', 'A123BCD', 'disponible'),
('Lucía Martínez', '2232221111', 'lucia.martinez@repartos.com', 'auto', 'AF456GH', 'en_ruta');

-- Tipos de Paquete
INSERT INTO tipos_paquete (nombre, descripcion, peso_max_kg, largo_max_cm, ancho_max_cm, alto_max_cm)
VALUES
('Sobre Documento', 'Documentos y papeles importantes', 0.5, 35, 25, 2),
('Paquete Pequeño', 'Cajas pequeñas, productos chicos', 2.0, 30, 20, 15),
('Paquete Mediano', 'Cajas medianas, varios productos', 5.0, 50, 40, 30),
('Paquete Grande', 'Cajas grandes o productos voluminosos', 15.0, 80, 60, 50);

-- Tipos de Servicio
INSERT INTO tipos_servicio (nombre, descripcion, tiempo_entrega_estimado_horas_min, tiempo_entrega_estimado_horas_max, disponible_fin_semana)
VALUES
('Moto Express Urbano', 'Entregas ultra rápidas en moto dentro de la ciudad.', 1, 3, TRUE),
('Auto Programado 24hs', 'Entregas en auto con planificación de 24hs.', 8, 24, FALSE),
('LowCost 72hs', 'Servicio económico con entrega en hasta 72hs.', 24, 72, FALSE);

-- Tarifas Distancia Calculadora
WITH ts_moto_express AS (SELECT id FROM tipos_servicio WHERE nombre = 'Moto Express Urbano'),
     ts_auto_prog AS (SELECT id FROM tipos_servicio WHERE nombre = 'Auto Programado 24hs')
INSERT INTO tarifas_distancia_calculadora (tipo_servicio_id, tipo_calculadora_servicio, distancia_min_km, distancia_max_km, tarifa_base, tarifa_km_adicional)
VALUES
((SELECT id FROM ts_moto_express), 'express_moto', 0, 5, 300.00, 50.00),
((SELECT id FROM ts_moto_express), 'express_moto', 5.01, 10, 500.00, 40.00),
((SELECT id FROM ts_auto_prog), 'programado_24h', 0, 10, 600.00, 30.00),
((SELECT id FROM ts_auto_prog), 'programado_24h', 10.01, 20, 800.00, 25.00);

-- Envios (Ejemplo)
WITH cliente_maria AS (SELECT id FROM clientes WHERE email = 'maria.lopez@email.com'),
     tipo_paq_peq AS (SELECT id FROM tipos_paquete WHERE nombre = 'Paquete Pequeño'),
     tipo_serv_moto AS (SELECT id FROM tipos_servicio WHERE nombre = 'Moto Express Urbano'),
     repartidor_roberto AS (SELECT id FROM repartidores WHERE email = 'roberto.gomez@repartos.com')
INSERT INTO envios (cliente_id, direccion_origen, contacto_origen_nombre, contacto_origen_telefono, direccion_destino, contacto_destino_nombre, contacto_destino_telefono, tipo_paquete_id, tipo_servicio_id, descripcion_paquete, fecha_entrega_estimada_inicio, fecha_entrega_estimada_fin, estatus, repartidor_asignado_id, tracking_number, costo_envio)
VALUES
( (SELECT id FROM cliente_maria), 'Av. Luro 3245, Mar del Plata', 'Local Ropa X', '2231001001', 'San Juan 1560, Mar del Plata', 'Maria López', '2234567890', (SELECT id FROM tipo_paq_peq), (SELECT id FROM tipo_serv_moto), 'Ropa Variada', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '3 hours', 'en_camino', (SELECT id FROM repartidor_roberto), 'RUM' || TO_CHAR(NOW(),'YYMMDDHH24MISS') || '001', 450.00),
( (SELECT id FROM cliente_maria), 'Peatonal San Martin 2210, Mar del Plata', 'Farmacia Central', '2232002002', 'Almafuerte 330, Mar del Plata', 'Maria López', '2234567890', (SELECT id FROM tipos_paquete WHERE nombre = 'Sobre Documento'), (SELECT id FROM tipos_servicio WHERE nombre = 'Moto Express Urbano'), 'Receta médica', NOW() + INTERVAL '2 hour', NOW() + INTERVAL '4 hours', 'pendiente_recoleccion', NULL, 'RUM' || TO_CHAR(NOW(),'YYMMDDHH24MISS') || '002', 300.00);

-- Repartos (Ejemplo)
WITH repartidor_roberto AS (SELECT id FROM repartidores WHERE email = 'roberto.gomez@repartos.com')
INSERT INTO repartos (repartidor_id, fecha_reparto, estatus, nombre_reparto)
VALUES
((SELECT id FROM repartidor_roberto), CURRENT_DATE, 'en_camino', 'Ruta Diaria Roberto ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'));

-- Paradas Reparto (Ejemplo)
WITH rep_actual AS (SELECT id FROM repartos WHERE nombre_reparto = 'Ruta Diaria Roberto ' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')),
     envio_1 AS (SELECT id FROM envios WHERE tracking_number = 'RUM' || TO_CHAR(NOW(),'YYMMDDHH24MISS') || '001')
INSERT INTO paradas_reparto (reparto_id, envio_id, secuencia_parada, tipo_parada, direccion_parada, nombre_contacto_parada, telefono_contacto_parada, hora_estimada_llegada, estatus_parada)
VALUES
((SELECT id FROM rep_actual), NULL, 1, 'recoleccion_empresa', 'Av. Luro 3245, Mar del Plata', 'Local Ropa X', '2231001001', '09:30:00', 'en_camino'),
((SELECT id FROM rep_actual), (SELECT id FROM envio_1), 2, 'entrega_cliente', 'San Juan 1560, Mar del Plata', 'Maria López', '2234567890', '10:15:00', 'en_camino');

-- Mensaje final de la migración
SELECT 'Migración y seeding inicial completados para Rumbos Envios.';
    