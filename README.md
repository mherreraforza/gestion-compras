# Gestión de Compras (interno, sin conexión SAP)

Fase 1: carga de documentos (OC en PDF, SOLPED en foto) → lectura automática con IA →
formulario editable → guardado en Supabase. El dashboard de gastos y el calendario
de recordatorios se agregan en fases siguientes sobre esta misma base.

## 1. Crear el proyecto en Supabase

1. Crea un proyecto nuevo en https://supabase.com (separado del de PCT).
2. Ve a SQL Editor y corre el archivo `db/schema.sql` completo.
3. Ve a Storage y crea un bucket llamado `documentos` (puede ser privado).
4. Copia la URL del proyecto y la `anon public key` (Settings → API).

## 2. Configurar variables de entorno locales

```
cp .env.example .env
```

Rellena:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 3. Correr en local

```
npm install
npm run dev
```

Para que `/api/extract` funcione en local necesitas correr con Vercel CLI en vez de solo Vite:

```
npm install -g vercel
vercel dev
```

## 4. Desplegar a Vercel

1. Sube este proyecto a un repo de GitHub.
2. Impórtalo en https://vercel.com (framework: Vite, se detecta solo).
3. En Settings → Environment Variables agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

## Cómo funciona la lectura de documentos

- La OC es un PDF con plantilla fija de SAP → se lee su texto con la librería
  `pdf-parse` y se extraen los campos con reglas de texto fijas (sin IA, sin costo,
  instantáneo). Detecta si hay partidas con patrón de "Período N En... Hasta..."
  y las marca como recurrentes automáticamente.
- La SOLPED es una foto de la pantalla de SAP → como es una imagen (no texto
  seleccionable), no se puede leer con reglas de texto. Se captura 100% a mano en
  el formulario; la foto solo queda guardada como respaldo/adjunto.
- Si la lectura de la OC falla en algún campo (por variaciones menores en el PDF),
  el formulario de revisión siempre se muestra antes de guardar, así que se puede
  corregir a mano — nunca se bloquea la carga.

## Pendiente para siguientes fases

- Dashboard de gastos del mes (agrupando `ordenes_compra` + `oc_partidas`, con manejo
  de que hay documentos en USD y otros en MXN — pendiente decidir si se normaliza o
  se muestra separado por moneda).
- Vista de calendario visual sobre la tabla `recordatorios` + fechas de solicitudes
  pendientes de autorización.
- Catálogo/editor de centros de costo y cuentas contables (hoy son texto libre).

## Fase 2: Solicitudes con login y autorización (usuarios cerrados, sin registro público)

1. En Supabase, corre `db/schema_fase2_solicitudes.sql` (después de `schema.sql`).
2. **Apaga el registro público**: Authentication → Sign In / Providers → Email → desactiva
   "Allow new users to sign up" (o el interruptor equivalente, el nombre varía según la
   versión de Supabase). Esto es importante: aunque la app ya no muestra un botón de
   "crear cuenta", sin este paso alguien podría crear una cuenta llamando directo a la API.
3. Consigue tu **Secret key** de Supabase: Settings → API Keys → pestaña "Publishable and
   secret API keys" → copia la que empieza `sb_secret_...` (la misma sección donde sacaste
   la publishable, pero la de abajo).
4. En Vercel, agrega una variable de entorno nueva: `SUPABASE_SERVICE_ROLE_KEY` con ese
   valor. **Nunca** le pongas el prefijo VITE_ — esta debe quedarse solo en el servidor.
5. **Crea tu propia cuenta (la primera, a mano, solo esta vez):**
   - Supabase → Authentication → Users → **Add user** → **Create new user** → pon tu correo y una contraseña
   - Copia el UUID que le asignó (aparece en la lista de usuarios)
   - Ve a SQL Editor y corre (con tus datos reales):
     ```sql
     insert into usuarios (id, nombre, correo, rol)
     values ('EL-UUID-QUE-COPIASTE', 'Tu nombre', 'tu-correo@forzasteel.com', 'gestor');
     ```
6. Entra a la app con ese correo y contraseña — ya eres Gestor.
7. Desde el botón **"Usuarios"** (solo tú lo ves), da de alta a tu jefe (rol Jefe) y a cada
   colaborador (rol Colaborador), con un correo y una contraseña temporal que tú les compartes.
   Nadie más puede crear su propia cuenta.

### Flujo de una solicitud
`Pendiente de autorización → Autorizada / Rechazada → En gestión (tú generas la SOLPED en SAP) → SOLPED generada → Completada`

- Cualquiera con cuenta crea una solicitud desde "Nueva solicitud" y elige quién la autoriza.
- El jefe la ve en "Por autorizar" y decide.
- Tú ves todo en "Gestión" y vas avanzando el estatus conforme trabajas la compra.
