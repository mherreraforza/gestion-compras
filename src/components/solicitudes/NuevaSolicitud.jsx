import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { useAuth } from '../../AuthContext.jsx'
import Field from '../Field.jsx'

export default function NuevaSolicitud({ onDone }) {
  const { usuario } = useAuth()
  const [jefes, setJefes] = useState([])
  const [form, setForm] = useState({
    solicitante_nombre: usuario?.nombre || '',
    descripcion: '',
    justificacion: '',
    monto_estimado: 0,
    centro_costo: '',
    jefe_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('usuarios').select('*').eq('rol', 'jefe').then(({ data }) => {
      const lista = data || []
      setJefes(lista)
      if (lista.length === 1) {
        setForm((f) => ({ ...f, jefe_id: lista[0].id }))
      }
    })
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.jefe_id) { setError('Elige quién va a autorizar.'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('solicitudes').insert({
        solicitante_id: usuario.rol === 'colaborador' ? usuario.id : null,
        solicitante_nombre: form.solicitante_nombre,
        descripcion: form.descripcion,
        justificacion: form.justificacion,
        monto_estimado: form.monto_estimado,
        centro_costo: form.centro_costo,
        jefe_id: form.jefe_id,
        registrada_por: usuario.id,
      })
      if (error) throw error
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-surface border border-border rounded-xl2 p-8">
      <h2 className="font-semibold text-lg mb-1">Nueva solicitud</h2>
      <p className="text-sm text-ink/60 mb-6">Se manda a tu autorizador para su visto bueno.</p>

      <form onSubmit={handleSubmit}>
        {usuario?.rol === 'gestor' && (
          <Field label="Nombre del solicitante" value={form.solicitante_nombre} onChange={(v) => set('solicitante_nombre', v)} />
        )}
        <label className="block text-sm mb-3">
          <span className="text-ink/60">¿Qué necesitas?</span>
          <textarea
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
          />
        </label>
        <label className="block text-sm mb-3">
          <span className="text-ink/60">Justificación</span>
          <textarea
            value={form.justificacion}
            onChange={(e) => set('justificacion', e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="Monto estimado" type="number" value={form.monto_estimado} onChange={(v) => set('monto_estimado', v)} />
          <Field label="Centro de costo" value={form.centro_costo} onChange={(v) => set('centro_costo', v)} />
        </div>
        <label className="block text-sm mb-3">
          <span className="text-ink/60">¿Quién autoriza?</span>
          <select
            value={form.jefe_id}
            onChange={(e) => set('jefe_id', e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
          >
            <option value="">Selecciona...</option>
            {jefes.map((j) => (
              <option key={j.id} value={j.id}>{j.nombre}</option>
            ))}
          </select>
        </label>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={onDone} className="px-5 py-2 rounded-full text-ink/60">Cancelar</button>
          <button type="submit" disabled={saving} className="px-6 py-2 rounded-full bg-coral text-white font-medium disabled:opacity-50">
            {saving ? 'Enviando…' : 'Enviar a autorizar'}
          </button>
        </div>
      </form>
    </div>
  )
}
