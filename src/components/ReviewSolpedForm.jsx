import { useState } from 'react'
import { supabase } from '../supabaseClient.js'
import Field from './Field.jsx'

export default function ReviewSolpedForm({ initial, archivo, onDone }) {
  const [form, setForm] = useState(() => ({
    ...initial,
    partidas: (initial.partidas || []).map((p) => ({ ...p, es_recurrente: false, frecuencia: 'mensual', proxima_fecha: '' })),
  }))
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }
  function setPartida(i, field, value) {
    setForm((f) => {
      const partidas = [...f.partidas]
      partidas[i] = { ...partidas[i], [field]: value }
      return { ...f, partidas }
    })
  }
  function addPartida() {
    setForm((f) => ({
      ...f,
      partidas: [...f.partidas, { numero_partida: '', texto_breve: '', cantidad: 1, um: 'SER', precio_valor: 0, es_recurrente: false, frecuencia: 'mensual', proxima_fecha: '' }],
    }))
  }
  function removePartida(i) {
    setForm((f) => ({ ...f, partidas: f.partidas.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      let archivoUrl = null
      if (archivo) {
        const path = `solped/${form.numero_solped}_${archivo.name}`
        await supabase.storage.from('documentos').upload(path, archivo, { upsert: true })
        archivoUrl = path
      }

      const { data: solped, error } = await supabase
        .from('solicitudes_pedido')
        .insert({
          numero_solped: form.numero_solped,
          tipo: form.tipo,
          estatus: form.estatus,
          archivo_url: archivoUrl,
          revisado: true,
        })
        .select()
        .single()
      if (error) throw error

      const partidasToInsert = form.partidas.map(({ es_recurrente, frecuencia, proxima_fecha, ...p }) => ({
        ...p,
        solped_id: solped.id,
        es_recurrente,
        frecuencia: es_recurrente ? frecuencia : null,
      }))
      if (partidasToInsert.length) {
        const { error: pErr } = await supabase.from('solped_partidas').insert(partidasToInsert)
        if (pErr) throw pErr
      }

      const recordatorios = form.partidas
        .filter((p) => p.es_recurrente && p.proxima_fecha)
        .map((p) => ({
          origen: 'solped',
          referencia_id: solped.id,
          titulo: `${form.numero_solped} · ${p.texto_breve || 'Partida recurrente'}`,
          fecha: p.proxima_fecha,
          frecuencia: p.frecuencia,
          notas: `Centro de costo: ${p.centro_costo || ''}`,
        }))
      if (recordatorios.length) {
        await supabase.from('recordatorios').insert(recordatorios)
      }

      onDone()
    } catch (err) {
      console.error(err)
      alert('No se pudo guardar. Revisa la consola.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-surface border border-border rounded-xl2 p-8">
      <h2 className="font-semibold text-lg mb-1">Revisa y confirma los datos</h2>
      <p className="text-sm text-ink/60 mb-6">La lectura de fotos puede fallar más — revisa con calma.</p>

      <div className="grid sm:grid-cols-2 gap-x-6">
        <Field label="Número de SOLPED" value={form.numero_solped} onChange={(v) => set('numero_solped', v)} />
        <Field label="Tipo" value={form.tipo} onChange={(v) => set('tipo', v)} />
        <Field label="Estatus" value={form.estatus} onChange={(v) => set('estatus', v)} />
      </div>

      <h3 className="font-semibold mt-6 mb-2">Partidas</h3>
      <div className="space-y-4">
        {form.partidas?.map((p, i) => (
          <div key={i} className="border border-ink/10 rounded-lg p-4 relative">
            <button onClick={() => removePartida(i)} className="absolute top-2 right-2 text-xs text-ink/40 hover:text-coral">✕</button>
            <div className="grid sm:grid-cols-3 gap-x-4">
              <Field label="No. partida" value={p.numero_partida} onChange={(v) => setPartida(i, 'numero_partida', v)} />
              <Field label="Cantidad" type="number" value={p.cantidad} onChange={(v) => setPartida(i, 'cantidad', v)} />
              <Field label="Precio valor" type="number" value={p.precio_valor} onChange={(v) => setPartida(i, 'precio_valor', v)} />
            </div>
            <Field label="Texto breve" value={p.texto_breve} onChange={(v) => setPartida(i, 'texto_breve', v)} />
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Field label="Centro de costo" value={p.centro_costo} onChange={(v) => setPartida(i, 'centro_costo', v)} />
              <Field label="Cuenta mayor" value={p.cta_mayor} onChange={(v) => setPartida(i, 'cta_mayor', v)} />
            </div>
            <label className="flex items-center gap-2 text-sm mt-2">
              <input type="checkbox" checked={!!p.es_recurrente} onChange={(e) => setPartida(i, 'es_recurrente', e.target.checked)} />
              Es recurrente (poner recordatorio)
            </label>
            {p.es_recurrente && (
              <div className="grid sm:grid-cols-2 gap-x-4 mt-2">
                <label className="block text-sm mb-3">
                  <span className="text-ink/60">Frecuencia</span>
                  <select
                    value={p.frecuencia}
                    onChange={(e) => setPartida(i, 'frecuencia', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </label>
                <Field label="Próxima fecha" type="date" value={p.proxima_fecha} onChange={(v) => setPartida(i, 'proxima_fecha', v)} />
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={addPartida} className="text-sm text-coral mt-3">+ agregar partida</button>

      <div className="flex justify-end gap-3 mt-8">
        <button onClick={onDone} className="px-5 py-2 rounded-full text-ink/60">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 rounded-full bg-coral text-white font-medium disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
