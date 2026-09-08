-- =========================================================
-- Fase 2: Solicitudes con flujo de autorización + login
-- Correr DESPUES de schema.sql
-- =========================================================

-- Usuarios de la app, ligados 1 a 1 con Supabase Auth
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  correo text,
  rol text not null default 'colaborador' check (rol in ('colaborador','jefe','gestor')),
  created_at timestamptz default now()
);

alter table usuarios enable row level security;
create policy "ver todos los usuarios" on usuarios for select using (true);
create policy "cada quien inserta su propia fila" on usuarios for insert with check (auth.uid() = id);
create policy "cada quien edita su propia fila" on usuarios for update using (auth.uid() = id);

-- Solicitudes (el flujo completo desde que se pide hasta que se compra)
create table solicitudes (
  id uuid primary key default gen_random_uuid(),
  folio serial,
  solicitante_id uuid references usuarios(id),
  solicitante_nombre text,       -- para cuando el Gestor la registra sin que el empleado tenga cuenta
  descripcion text not null,
  justificacion text,
  monto_estimado numeric(14,2),
  centro_costo text,
  jefe_id uuid references usuarios(id) not null,
  estatus text not null default 'pendiente_autorizacion'
    check (estatus in ('pendiente_autorizacion','autorizada','rechazada','en_gestion','solped_generada','completada','cancelada')),
  fecha_solicitud date default current_date,
  fecha_autorizacion date,
  comentario_autorizacion text,
  oc_id uuid references ordenes_compra(id),
  solped_id uuid references solicitudes_pedido(id),
  registrada_por uuid references usuarios(id) not null,
  created_at timestamptz default now()
);

alter table solicitudes enable row level security;

-- El colaborador ve/crea lo que el mismo solicito o registro
create policy "colaborador ve lo suyo" on solicitudes
  for select using (solicitante_id = auth.uid() or registrada_por = auth.uid());
create policy "colaborador crea lo suyo" on solicitudes
  for insert with check (registrada_por = auth.uid());

-- El jefe ve y autoriza/rechaza lo que le toca
create policy "jefe ve lo que le toca" on solicitudes
  for select using (jefe_id = auth.uid());
create policy "jefe actualiza lo que le toca" on solicitudes
  for update using (jefe_id = auth.uid());

-- El Gestor (tu) ve y gestiona absolutamente todo
create policy "gestor administra todo" on solicitudes
  for all using (
    exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'gestor')
  );

create index idx_solicitudes_estatus on solicitudes(estatus);
create index idx_solicitudes_jefe on solicitudes(jefe_id, estatus);
