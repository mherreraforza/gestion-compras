-- Fase 4: agregar centro de costo tambien a las partidas de OC
alter table oc_partidas add column if not exists centro_costo text;
create index if not exists idx_oc_partidas_centro on oc_partidas(centro_costo);
