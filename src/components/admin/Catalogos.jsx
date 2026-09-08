import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient.js'

const AREAS_CC = ['ventas', 'administracion', 'planta']
const AREAS_CTA = ['general', 'planta', 'administracion', 'ventas']

export default function Catalogos() {
  const [tab, setTab] = useState('centros')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('centros')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium ${tab === 'centros' ? 'bg-brand text-white' : 'bg-surface border border-border text-muted'}`}
        >
          Centros de costo
        </button>
        <button
          onClick={() => setTab('cuentas')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium ${tab === 'cuentas' ? 'bg-brand text-white' : 'bg-surface border border-border text-muted'}`}
        >
          Cuentas contables
        </button>
      </div>
      {tab === 'centros' ? <CentrosCosto /> : <CuentasContables />}
    </div>
  )
}

function CentrosCosto() {
  const [items, setItems] = useState([])
  const [nuevo, setNuevo] = useState({ codigo: '', nombre: '', planta: 'Salinas Victoria', area: 'planta' })
  const [buscar, setBuscar] = useState('')
  const [filtroPlanta, setFiltroPlanta] = useState('todas')
  const [filtroArea, setFiltroArea] = useState('todas')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase.from('centros_costo').select('*').order('codigo')
    setItems(data || [])
  }

  async function guardarFila(item) {
    await supabase.from('centros_costo').update({
      codigo: item.codigo, nombre: item.nombre, planta: item.planta, area: item.area,
    }).eq('id', item.id)
    cargar()
  }

  async function eliminar(id) {
    await supabase.from('centros_costo').delete().eq('id', id)
    cargar()
  }

  async function agregar() {
    if (!nuevo.codigo) return
    await supabase.from('centros_costo').insert(nuevo)
    setNuevo({ codigo: '', nombre: '', planta: 'Salinas Victoria', area: 'planta' })
    cargar()
  }

  function set(id, field, value) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)))
  }

  const filtrados = items.filter((it) => {
    const coincideTexto = (it.codigo + ' ' + (it.nombre || '')).toLowerCase().includes(buscar.toLowerCase())
    const coincidePlanta = filtroPlanta === 'todas' || it.planta === filtroPlanta
    const coincideArea = filtroArea === 'todas' || it.area === filtroArea
    return coincideTexto && coincidePlanta && coincideArea
  })

  return (
    <div className="bg-surface border border-border rounded-xl2 p-6">
      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        <input
          placeholder="Buscar código o nombre..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <select value={filtroPlanta} onChange={(e) => setFiltroPlanta(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="todas">Todas las plantas</option>
          <option value="Salinas Victoria">Salinas Victoria</option>
          <option value="Guadalupe Doxmon">Guadalupe Doxmon</option>
        </select>
        <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="todas">Todas las áreas</option>
          {AREAS_CC.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <p className="text-xs text-muted mb-2">{filtrados.length} de {items.length} centros</p>

      <div className="grid grid-cols-[1.2fr_2fr_1.3fr_1fr_auto] gap-2 text-xs text-muted font-medium mb-2 px-1">
        <span>Código</span><span>Nombre</span><span>Planta</span><span>Área</span><span></span>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto mb-4">
        {filtrados.map((it) => (
          <div key={it.id} className="grid grid-cols-[1.2fr_2fr_1.3fr_1fr_auto] gap-2 items-center">
            <input value={it.codigo} onChange={(e) => set(it.id, 'codigo', e.target.value)} onBlur={() => guardarFila(it)} className="rounded-md border border-border px-2 py-1 text-sm" />
            <input value={it.nombre || ''} onChange={(e) => set(it.id, 'nombre', e.target.value)} onBlur={() => guardarFila(it)} className="rounded-md border border-border px-2 py-1 text-sm" />
            <select value={it.planta} onChange={(e) => { set(it.id, 'planta', e.target.value); guardarFila({ ...it, planta: e.target.value }) }} className="rounded-md border border-border px-2 py-1 text-sm">
              <option value="Salinas Victoria">Salinas Victoria</option>
              <option value="Guadalupe Doxmon">Guadalupe Doxmon</option>
            </select>
            <select value={it.area || ''} onChange={(e) => { set(it.id, 'area', e.target.value); guardarFila({ ...it, area: e.target.value }) }} className="rounded-md border border-border px-2 py-1 text-sm">
              {AREAS_CC.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={() => eliminar(it.id)} className="text-xs text-danger px-2">Borrar</button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.2fr_2fr_1.3fr_1fr_auto] gap-2 items-center border-t border-border pt-3">
        <input placeholder="Código" value={nuevo.codigo} onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })} className="rounded-md border border-border px-2 py-1 text-sm" />
        <input placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} className="rounded-md border border-border px-2 py-1 text-sm" />
        <select value={nuevo.planta} onChange={(e) => setNuevo({ ...nuevo, planta: e.target.value })} className="rounded-md border border-border px-2 py-1 text-sm">
          <option value="Salinas Victoria">Salinas Victoria</option>
          <option value="Guadalupe Doxmon">Guadalupe Doxmon</option>
        </select>
        <select value={nuevo.area} onChange={(e) => setNuevo({ ...nuevo, area: e.target.value })} className="rounded-md border border-border px-2 py-1 text-sm">
          {AREAS_CC.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={agregar} className="text-xs bg-brand text-white px-3 py-1.5 rounded-md">+ Agregar</button>
      </div>
    </div>
  )
}

function CuentasContables() {
  const [items, setItems] = useState([])
  const [nuevo, setNuevo] = useState({ concepto: '', area: 'general', cuenta: '' })
  const [buscar, setBuscar] = useState('')
  const [filtroArea, setFiltroArea] = useState('todas')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase.from('cuentas_contables').select('*').order('concepto')
    setItems(data || [])
  }

  async function guardarFila(item) {
    await supabase.from('cuentas_contables').update({
      concepto: item.concepto, area: item.area, cuenta: item.cuenta,
    }).eq('id', item.id)
    cargar()
  }

  async function eliminar(id) {
    await supabase.from('cuentas_contables').delete().eq('id', id)
    cargar()
  }

  async function agregar() {
    if (!nuevo.concepto || !nuevo.cuenta) return
    await supabase.from('cuentas_contables').insert(nuevo)
    setNuevo({ concepto: '', area: 'general', cuenta: '' })
    cargar()
  }

  function set(id, field, value) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)))
  }

  const filtrados = items.filter((it) => {
    const coincideTexto = it.concepto.toLowerCase().includes(buscar.toLowerCase())
    const coincideArea = filtroArea === 'todas' || it.area === filtroArea
    return coincideTexto && coincideArea
  })

  return (
    <div className="bg-surface border border-border rounded-xl2 p-6">
      <div className="grid sm:grid-cols-2 gap-2 mb-4">
        <input
          placeholder="Buscar concepto..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm">
          <option value="todas">Todas las áreas</option>
          {AREAS_CTA.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <p className="text-xs text-muted mb-2">{filtrados.length} de {items.length} cuentas</p>

      <div className="grid grid-cols-[2.5fr_1.2fr_1.3fr_auto] gap-2 text-xs text-muted font-medium mb-2 px-1">
        <span>Concepto</span><span>Área</span><span>Cuenta</span><span></span>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto mb-4">
        {filtrados.map((it) => (
          <div key={it.id} className="grid grid-cols-[2.5fr_1.2fr_1.3fr_auto] gap-2 items-center">
            <input value={it.concepto} onChange={(e) => set(it.id, 'concepto', e.target.value)} onBlur={() => guardarFila(it)} className="rounded-md border border-border px-2 py-1 text-sm" />
            <select value={it.area} onChange={(e) => { set(it.id, 'area', e.target.value); guardarFila({ ...it, area: e.target.value }) }} className="rounded-md border border-border px-2 py-1 text-sm">
              {AREAS_CTA.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <input value={it.cuenta} onChange={(e) => set(it.id, 'cuenta', e.target.value)} onBlur={() => guardarFila(it)} className="rounded-md border border-border px-2 py-1 text-sm" />
            <button onClick={() => eliminar(it.id)} className="text-xs text-danger px-2">Borrar</button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[2.5fr_1.2fr_1.3fr_auto] gap-2 items-center border-t border-border pt-3">
        <input placeholder="Concepto" value={nuevo.concepto} onChange={(e) => setNuevo({ ...nuevo, concepto: e.target.value })} className="rounded-md border border-border px-2 py-1 text-sm" />
        <select value={nuevo.area} onChange={(e) => setNuevo({ ...nuevo, area: e.target.value })} className="rounded-md border border-border px-2 py-1 text-sm">
          {AREAS_CTA.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input placeholder="Cuenta" value={nuevo.cuenta} onChange={(e) => setNuevo({ ...nuevo, cuenta: e.target.value })} className="rounded-md border border-border px-2 py-1 text-sm" />
        <button onClick={agregar} className="text-xs bg-brand text-white px-3 py-1.5 rounded-md">+ Agregar</button>
      </div>
    </div>
  )
}
