import { useState } from 'react'
import { supabase } from '../supabaseClient.js'
import Field from './Field.jsx'

export default function ReviewOCForm({ initial, archivo, onDone }) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }
  function setProv(field, value) { setForm((f) => ({ ...f, proveedor: { ...f.proveedor, [field]: value } })) }
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
      partidas: [...f.partidas, { numero_partida: '', descripcion: '', cantidad: 1, um: 'SER', precio: 0, total: 0, es_periodo: false }],
    }))
  }
  function removePartida(i) {
    setForm((f) => ({ ...f, partidas: f.partidas.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      let proveedorId = null
      if (form.proveedor?.numero_proveedor) {
        const { data: prov } = await supabase
          .from('proveedores')
          .upsert({ ...form.proveedor }, { onConflict: 'numero_proveedor' })
          .select()
          .single()
        proveedorId = prov?.id
      }

      let archivoUrl = null
      if (archivo) {
        const path = `oc/${form.numero_documento}_${archivo.name}`
        await supabase.storage.from('documentos').upload(path, archivo, { upsert: true })
        archivoUrl = path
      }

      const { data: oc, error } = await supabase
        .from('ordenes_compra')
        .insert({
          numero_documento: form.numero_documento,
          fecha_documento: form.fecha_documento || null,
          proveedor_id: proveedorId,
          solicitante: form.solicitante,
          creado_por: form.creado_por,
          estatus: form.estatus,
          fecha_entrega: form.fecha_entrega || null,
          tipo: form.tipo,
          condicion_pago_codigo: form.condicion_pago_codigo,
          condicion_pago_desc: form.condicion_pago_desc,
          moneda: form.moneda,
          subtotal: form.subtotal,
          descuento: form.descuento,
          gastos_adicionales: form.gastos_adicionales,
          impuesto_pct: form.impuesto_pct,
          impuesto_base: form.impuesto_base,
          impuesto: form.impuesto,
          total: form.total,
          archivo_url: archivoUrl,
          revisado: true,
        })
        .select()
        .single()

      if (error) throw error

      if (form.partidas?.length) {
        const { error: pErr } = await supabase
          .from('oc_partidas')
          .insert(form.partidas.map((p) => ({ ...p, oc_id: oc.id })))
        if (pErr) throw pErr
      }

      const recordatorios = form.partidas
        .filter((p) => p.es_periodo && p.periodo_fin)
        .map((p) => ({
          origen: 'oc',
          referencia_id: oc.id,
          titulo: `OC ${form.numero_documento} · vence periodo ${p.periodo_numero || ''}/${p.periodo_total || ''}`,
          fecha: p.periodo_fin,
          frecuencia: null,
          notas: p.descripcion,
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
      <p className="text-sm text-ink/60 mb-6">Corrige lo que haga falta antes de guardar.</p>

      <div className="grid sm:grid-cols-2 gap-x-6">
        <Field label="Número de documento" value={form.numero_documento} onChange={(v) => set('numero_documento', v)} />
        <Field label="Fecha de documento" type="date" value={form.fecha_documento} onChange={(v) => set('fecha_documento', v)} />
        <Field label="Proveedor" value={form.proveedor?.nombre} onChange={(v) => setProv('nombre', v)} />
        <Field label="Número de proveedor" value={form.proveedor?.numero_proveedor} onChange={(v) => setProv('numero_proveedor', v)} />
        <Field label="RFC" value={form.proveedor?.rfc} onChange={(v) => setProv('rfc', v)} />
        <Field label="Solicitante" value={form.solicitante} onChange={(v) => set('solicitante', v)} />
        <Field label="Creado por" value={form.creado_por} onChange={(v) => set('creado_por', v)} />
        <Field label="Estatus" value={form.estatus} onChange={(v) => set('estatus', v)} />
        <Field label="Fecha de entrega" type="date" value={form.fecha_entrega} onChange={(v) => set('fecha_entrega', v)} />
        <Field label="Moneda" value={form.moneda} onChange={(v) => set('moneda', v)} />
        <Field label="Subtotal" type="number" value={form.subtotal} onChange={(v) => set('subtotal', v)} />
        <Field label="Total" type="number" value={form.total} onChange={(v) => set('total', v)} />
      </div>

      <h3 className="font-semibold mt-6 mb-2">Partidas</h3>
      <div className="space-y-4">
        {form.partidas?.map((p, i) => (
          <div key={i} className="border border-ink/10 rounded-lg p-4 relative">
            <button onClick={() => removePartida(i)} className="absolute top-2 right-2 text-xs text-ink/40 hover:text-coral">✕</button>
            <div className="grid sm:grid-cols-3 gap-x-4">
              <Field label="No. partida" value={p.numero_partida} onChange={(v) => setPartida(i, 'numero_partida', v)} />
              <Field label="Cantidad" type="number" value={p.cantidad} onChange={(v) => setPartida(i, 'cantidad', v)} />
              <Field label="Precio" type="number" value={p.precio} onChange={(v) => setPartida(i, 'precio', v)} />
            </div>
            <Field label="Descripción" value={p.descripcion} onChange={(v) => setPartida(i, 'descripcion', v)} />
            <label className="flex items-center gap-2 text-sm mt-1">
              <input type="checkbox" checked={!!p.es_periodo} onChange={(e) => setPartida(i, 'es_periodo', e.target.checked)} />
              Es un periodo recurrente
            </label>
            {p.es_periodo && (
              <div className="grid sm:grid-cols-2 gap-x-4 mt-2">
                <Field label="Periodo inicio" type="date" value={p.periodo_inicio} onChange={(v) => setPartida(i, 'periodo_inicio', v)} />
                <Field label="Periodo fin" type="date" value={p.periodo_fin} onChange={(v) => setPartida(i, 'periodo_fin', v)} />
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
