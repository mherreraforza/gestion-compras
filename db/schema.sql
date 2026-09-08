-- =========================================================
-- Sistema de Gestión de Compras Interno (sin conexión SAP)
-- Proyecto Supabase nuevo y separado de PCT
-- =========================================================

-- Catálogo de proveedores (se va llenando solo, conforme se cargan OCs)
create table proveedores (
  id uuid primary key default gen_random_uuid(),
  numero_proveedor text unique,
  nombre text not null,
  rfc text,
  direccion text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- ÓRDENES DE COMPRA (documento con plantilla fija PDF/Word)
-- ---------------------------------------------------------
create table ordenes_compra (
  id uuid primary key default gen_random_uuid(),
  numero_documento text unique not null,
  fecha_documento date,
  proveedor_id uuid references proveedores(id),
  solicitante text,
  creado_por text,
  estatus text,                 -- AUTORIZADO, etc.
  fecha_entrega date,
  tipo text,
  condicion_pago_codigo text,   -- K001, K002...
  condicion_pago_desc text,
  moneda text,                  -- USD, MXN — siempre por documento, no asumir
  subtotal numeric(14,2),
  descuento numeric(14,2) default 0,
  gastos_adicionales numeric(14,2) default 0,
  impuesto_pct numeric(5,2),
  impuesto_base numeric(14,2),
  impuesto numeric(14,2),
  total numeric(14,2),
  archivo_url text,             -- PDF original en Supabase Storage
  extraido_por_ia boolean default true,
  revisado boolean default false, -- se marca true cuando ella confirma/edita
  created_at timestamptz default now()
);

create table oc_partidas (
  id uuid primary key default gen_random_uuid(),
  oc_id uuid references ordenes_compra(id) on delete cascade,
  numero_partida text,          -- 00010, 00020...
  descripcion text,
  cuenta_contable text,
  cod_articulo text,
  cantidad numeric(12,3),
  um text,
  precio numeric(14,2),
  total numeric(14,2),
  -- Detección de recurrencia tipo "Período N En ... Hasta ..."
  es_periodo boolean default false,
  periodo_numero int,
  periodo_total int,
  periodo_inicio date,
  periodo_fin date
);

-- ---------------------------------------------------------
-- SOLICITUDES DE PEDIDO (SOLPED) — capturadas por foto de SAP GUI
-- ---------------------------------------------------------
create table solicitudes_pedido (
  id uuid primary key default gen_random_uuid(),
  numero_solped text unique not null,
  tipo text,                    -- SolPed Servicios, etc.
  estatus text,
  fecha_captura date default current_date,
  archivo_url text,             -- foto original en Supabase Storage
  extraido_por_ia boolean default true,
  revisado boolean default false,
  created_at timestamptz default now()
);

create table solped_partidas (
  id uuid primary key default gen_random_uuid(),
  solped_id uuid references solicitudes_pedido(id) on delete cascade,
  numero_partida text,          -- 10, 20, 30...
  material text,
  cantidad numeric(12,3),
  um text,
  texto_breve text,
  grupo_articulos text,
  centro text,
  precio_valor numeric(14,2),
  gcp text,
  solicitante text,
  prov_deseado text,
  org_compras text,
  -- Imputación
  cta_mayor text,
  sociedad_co text,
  centro_costo text,
  centro_gestor text,
  pos_presupuestal text,
  -- Recurrencia: aquí normalmente NO viene el patrón en el texto,
  -- así que se marca manual
  es_recurrente boolean default false,
  frecuencia text,              -- mensual, trimestral, anual, etc.
  mes_correspondiente int       -- 1-12, si aplica
);

-- ---------------------------------------------------------
-- RECORDATORIOS / CALENDARIO
-- Se generan automático (por periodos de OC) o manual (SOLPED recurrente)
-- ---------------------------------------------------------
create table recordatorios (
  id uuid primary key default gen_random_uuid(),
  origen text not null,          -- 'oc' | 'solped' | 'manual'
  referencia_id uuid,            -- oc_id o solped_id, null si es manual
  titulo text not null,
  fecha date not null,
  frecuencia text,               -- null si es único
  activo boolean default true,
  notas text,
  created_at timestamptz default now()
);

-- Índices útiles para el dashboard de gastos por mes
create index idx_oc_fecha on ordenes_compra(fecha_documento);
create index idx_oc_partidas_periodo on oc_partidas(periodo_inicio, periodo_fin);
create index idx_recordatorios_fecha on recordatorios(fecha);
