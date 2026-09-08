-- =========================================================
-- Fase 3: Catalogo de Centros de Costo y Cuentas Contables
-- Editable desde la app (solo gestor edita, todos pueden consultar)
-- =========================================================

create table if not exists centros_costo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nombre text,
  planta text not null check (planta in ('Salinas Victoria','Guadalupe Doxmon')),
  area text check (area in ('ventas','administracion','planta')),
  created_at timestamptz default now()
);

create table if not exists cuentas_contables (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  area text not null check (area in ('general','planta','administracion','ventas')),
  cuenta text not null,
  created_at timestamptz default now()
);

alter table centros_costo enable row level security;
alter table cuentas_contables enable row level security;

drop policy if exists "todos ven centros" on centros_costo;
create policy "todos ven centros" on centros_costo for select using (true);
drop policy if exists "gestor administra centros" on centros_costo;
create policy "gestor administra centros" on centros_costo
  for all using (exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'gestor'));

drop policy if exists "todos ven cuentas" on cuentas_contables;
create policy "todos ven cuentas" on cuentas_contables for select using (true);
drop policy if exists "gestor administra cuentas" on cuentas_contables;
create policy "gestor administra cuentas" on cuentas_contables
  for all using (exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'gestor'));

-- ---------------------------------------------------------
-- Semilla: Centros de costo Planta Salinas Victoria
-- ---------------------------------------------------------
insert into centros_costo (codigo, nombre, planta, area) values
('SPL-FLETE','Gastos Logísticos de ventas','Salinas Victoria','ventas'),
('SPL-VTACOR','Relaciones Institucionales (Dumping)','Salinas Victoria','ventas'),
('SPL-VTANAC','Ventas Nacionales','Salinas Victoria','ventas'),
('SPL-VTAUSA','Ventas USA','Salinas Victoria','ventas'),
('SPL-PLANEA','Planeación Ventas y Producción','Salinas Victoria','ventas'),
('SPL-MULTI',null,'Salinas Victoria','ventas'),
('SPL-PLANOS',null,'Salinas Victoria','ventas'),
('SPL-VTAERW',null,'Salinas Victoria','ventas'),
('SPL-VTAHSS',null,'Salinas Victoria','ventas'),
('SPL-MARKET',null,'Salinas Victoria','ventas'),
('SPL-ADMON','Administración','Salinas Victoria','administracion'),
('SPL-COMPCO','Compras Corporativo','Salinas Victoria','administracion'),
('SPL-COMPRA','Compras','Salinas Victoria','administracion'),
('SPL-CORP','Corporativo Piso 12','Salinas Victoria','administracion'),
('SPL-RHCORP','RH Corporativo','Salinas Victoria','administracion'),
('SPL-SEGPAT','Seguridad Patrimonial','Salinas Victoria','administracion'),
('SPL-TI-APL','TI Aplicaciones','Salinas Victoria','administracion'),
('SPL-TI-INF','TI Infraestructura','Salinas Victoria','administracion'),
('SPL-ACABA','Acabado','Salinas Victoria','planta'),
('SPL-ALM-IN','Almacén Insumos','Salinas Victoria','planta'),
('SPL-ALM-PT','Almacén PT','Salinas Victoria','planta'),
('SPL-ASCALD','Aseguramiento de Calidad','Salinas Victoria','planta'),
('SPL-CORTE','Corte','Salinas Victoria','planta'),
('SPL-CTLCAL','Control de Calidad','Salinas Victoria','planta'),
('SPL-CTR-PR','Control de Producción','Salinas Victoria','planta'),
('SPL-FLETE','Fletes Insumos','Salinas Victoria','planta'),
('SPL-HERRA','Herramentales','Salinas Victoria','planta'),
('SPL-INFRA','Infraestructura','Salinas Victoria','planta'),
('SPL-M1','Molino 1','Salinas Victoria','planta'),
('SPL-M2','Molino 2','Salinas Victoria','planta'),
('SPL-M3','Molino 3','Salinas Victoria','planta'),
('SPL-MTTO','Mantenimiento Planta','Salinas Victoria','planta'),
('SPL-PLNTRA','Planeación y Tráfico Planta','Salinas Victoria','planta'),
('SPL-PROD','Producción','Salinas Victoria','planta'),
('SPL-PROY','Proyectos','Salinas Victoria','planta'),
('SPL-RECUP','Recuperación','Salinas Victoria','planta'),
('SPL-RH','Recursos Humanos Planta','Salinas Victoria','planta'),
('SPL-SLITER','Sliter','Salinas Victoria','planta'),
('SPL-SLT-02',null,'Salinas Victoria','planta'),
('SPL-ACABA2',null,'Salinas Victoria','planta'),
('SPL-ALMIN1',null,'Salinas Victoria','planta'),
('SPL-ALMPT1',null,'Salinas Victoria','planta'),
('SPL-CTRPR1',null,'Salinas Victoria','planta'),
('SPL-PLNTR1',null,'Salinas Victoria','planta'),
('SPL-RECUB',null,'Salinas Victoria','planta'),
('SPL-SE1',null,'Salinas Victoria','planta'),
('SPL-SE2',null,'Salinas Victoria','planta'),
('SPL-SLT-03',null,'Salinas Victoria','planta'),
('SPL-OPER','Dirección General','Salinas Victoria','planta');

-- ---------------------------------------------------------
-- Semilla: Centros de costo Planta Guadalupe Doxmon
-- ---------------------------------------------------------
insert into centros_costo (codigo, nombre, planta, area) values
('PGF-FLETE',null,'Guadalupe Doxmon','ventas'),
('PGF-PLANEA',null,'Guadalupe Doxmon','ventas'),
('PGF-VTACOR',null,'Guadalupe Doxmon','ventas'),
('PGF-VTANAC',null,'Guadalupe Doxmon','ventas'),
('PGF-VTAUSA',null,'Guadalupe Doxmon','ventas'),
('PGF-ADMON',null,'Guadalupe Doxmon','administracion'),
('PGF-COMPCO',null,'Guadalupe Doxmon','administracion'),
('PGF-COMPRA',null,'Guadalupe Doxmon','administracion'),
('PGF-CORP',null,'Guadalupe Doxmon','administracion'),
('PGF-DIRGRL',null,'Guadalupe Doxmon','administracion'),
('PGF-RHCORP',null,'Guadalupe Doxmon','administracion'),
('PGF-SEGPAT',null,'Guadalupe Doxmon','administracion'),
('PGF-TI-APL',null,'Guadalupe Doxmon','administracion'),
('PGF-TI-INF',null,'Guadalupe Doxmon','administracion'),
('PGF-ACABA',null,'Guadalupe Doxmon','planta'),
('PGF-ALM-IN',null,'Guadalupe Doxmon','planta'),
('PGF-ALM-PT',null,'Guadalupe Doxmon','planta'),
('PGF-ASCALD',null,'Guadalupe Doxmon','planta'),
('PGF-CORTE',null,'Guadalupe Doxmon','planta'),
('PGF-CTLCAL',null,'Guadalupe Doxmon','planta'),
('PGF-CTR-PR',null,'Guadalupe Doxmon','planta'),
('PGF-DELTA1',null,'Guadalupe Doxmon','planta'),
('PGF-DELTA2',null,'Guadalupe Doxmon','planta'),
('PGF-HERRA',null,'Guadalupe Doxmon','planta'),
('PGF-INFRA',null,'Guadalupe Doxmon','planta'),
('PGF-MTTO',null,'Guadalupe Doxmon','planta'),
('PGF-OPER',null,'Guadalupe Doxmon','planta'),
('PGF-PLNTRA',null,'Guadalupe Doxmon','planta'),
('PGF-PROD',null,'Guadalupe Doxmon','planta'),
('PGF-PROY',null,'Guadalupe Doxmon','planta'),
('PGF-RECUP',null,'Guadalupe Doxmon','planta'),
('PGF-RH',null,'Guadalupe Doxmon','planta');

-- ---------------------------------------------------------
-- Semilla: Cuentas contables por concepto y area
-- area 'general' = una sola cuenta para cualquier area
-- ---------------------------------------------------------
insert into cuentas_contables (concepto, area, cuenta) values
('COMPUTADORA LAPTOP / ESCRITORIO','general','1210061000'),
('IMPRESORAS / MULTIFUNCIONAL','general','1210062000'),
('CAMARA VIDEO / FOTOGRAFICAS','general','1210063000'),
('LICENCIAS','general','1210064000'),
('EQUIPO SOFTWARE','general','1210065000'),
('EQUIPO HARDWARE','general','1210066000'),
('TERMINALES','general','1210067000'),
('MANTENIMIENTO EQUIPO DE COMPUTO','planta','6110030011'),
('MANTENIMIENTO EQUIPO DE COMPUTO','administracion','6210030006'),
('MANTENIMIENTO EQUIPO DE COMPUTO','ventas','6310030022'),
('TELEFONIA','planta','6110030048'),
('TELEFONIA','administracion','6210030030'),
('TELEFONIA','ventas','6310030016'),
('CUOTAS / SUSCRIPCIONES','planta','6110030069'),
('CUOTAS / SUSCRIPCIONES','administracion','6210030020'),
('CUOTAS / SUSCRIPCIONES','ventas','6310030025'),
('CONSUMIBLES EQUIPO DE COMPUTO','planta','6110030049'),
('CONSUMIBLES EQUIPO DE COMPUTO','administracion','6210030032'),
('CONSUMIBLES EQUIPO DE COMPUTO','ventas','6310030029'),
('RENTA DE IMPRESORAS','planta','6110030036'),
('RENTA DE IMPRESORAS','administracion','6210030021'),
('RENTA DE IMPRESORAS','ventas','6310030030'),
('INTERNET','administracion','6210030031'),
('INTERNET','ventas','6310030017'),
('SERVICIOS PROFESIONALES','administracion','6210030018'),
('INVERSION EN PROCESO PROYECTO HANA','general','1210079002'),
('INVERSION EN PROCESO PROYECTO SAP','general','1210079003'),
('INVERSION EN PROCESO PROYECTO DIGITALIZACION','general','1210079004'),
('INVERSION EN PROCESO PROYECTO CRM','general','1210079005'),
('INVERSION EN PROCESO PROYECTO E-COMMERCE','general','1210079006'),
('INVERSION EN PROCESO PROYECTO SAP EXTRAS','general','1210079007'),
('CONSULTORIA Y ESTUDIOS','general','6210030025');

create index if not exists idx_centros_costo_codigo on centros_costo(codigo);
create index if not exists idx_cuentas_concepto on cuentas_contables(concepto);
