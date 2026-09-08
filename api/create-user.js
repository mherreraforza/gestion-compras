// Vercel Serverless Function
// Solo un usuario con rol 'pmo' puede crear cuentas nuevas.
// Usa la Secret key de Supabase (SUPABASE_SERVICE_ROLE_KEY), que NUNCA se manda al navegador.

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    res.status(401).json({ error: 'no_token' })
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Verifica quien esta llamando, usando su propio token (no privilegios especiales todavia)
  const supabaseAsCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userErr } = await supabaseAsCaller.auth.getUser(token)
  if (userErr || !userData?.user) {
    res.status(401).json({ error: 'invalid_token' })
    return
  }

  const { data: perfil } = await supabaseAsCaller
    .from('usuarios')
    .select('rol')
    .eq('id', userData.user.id)
    .single()

  if (!perfil || perfil.rol !== 'pmo') {
    res.status(403).json({ error: 'not_authorized' })
    return
  }

  const { nombre, correo, password, rol } = req.body || {}
  if (!nombre || !correo || !password || !rol) {
    res.status(400).json({ error: 'missing_fields' })
    return
  }
  if (!['colaborador', 'jefe', 'pmo'].includes(rol)) {
    res.status(400).json({ error: 'invalid_role' })
    return
  }

  // Aqui si con privilegios de administrador, para crear el usuario en Auth
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  })
  if (createErr) {
    res.status(400).json({ error: createErr.message })
    return
  }

  const { error: insertErr } = await admin.from('usuarios').insert({
    id: created.user.id,
    nombre,
    correo,
    rol,
  })
  if (insertErr) {
    res.status(400).json({ error: insertErr.message })
    return
  }

  res.status(200).json({ ok: true })
}
