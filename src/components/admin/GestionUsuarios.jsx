import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import Field from '../Field.jsx'

export default function GestionUsuarios() {
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', rol: 'colaborador' })
  const [usuarios, setUsuarios] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { cargarUsuarios() }, [])

  async function cargarUsuarios() {
    const { data } = await supabase.from('usuarios').select('*').order('created_at')
    setUsuarios(data || [])
  }

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMensaje('')
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo crear')
      setMensaje(`Cuenta creada para ${form.nombre}. Pásale el correo y la contraseña para que entre.`)
      setForm({ nombre: '', correo: '', password: '', rol: 'colaborador' })
      cargarUsuarios()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-6 sm:grid-cols-2">
      <div className="bg-white rounded-xl2 shadow-md p-8">
        <h2 className="font-semibold text-lg mb-1">Dar de alta un usuario</h2>
        <p className="text-sm text-ink/60 mb-6">Tú decides quién entra al sistema.</p>
        <form onSubmit={handleSubmit}>
          <Field label="Nombre" value={form.nombre} onChange={(v) => set('nombre', v)} />
          <Field label="Correo" type="email" value={form.correo} onChange={(v) => set('correo', v)} />
          <Field label="Contraseña temporal" value={form.password} onChange={(v) => set('password', v)} />
          <label className="block text-sm mb-3">
            <span className="text-ink/60">Rol</span>
            <select
              value={form.rol}
              onChange={(e) => set('rol', e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
            >
              <option value="colaborador">Colaborador</option>
              <option value="jefe">Jefe</option>
              <option value="gestor">Gestor</option>
            </select>
          </label>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          {mensaje && <p className="text-xs text-emerald-600 mb-3">{mensaje}</p>}
          <button type="submit" disabled={saving} className="w-full bg-coral text-white py-2.5 rounded-full font-medium disabled:opacity-50">
            {saving ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl2 shadow-md p-8">
        <h2 className="font-semibold text-lg mb-4">Usuarios actuales</h2>
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.id} className="flex justify-between text-sm border-b border-ink/5 pb-2">
              <span>{u.nombre}</span>
              <span className="text-ink/40 capitalize">{u.rol}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
