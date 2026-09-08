import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Dashboard() {
  const [ocs, setOcs] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroAnio, setFiltroAnio] = useState('todos')
  const [filtroMes, setFiltroMes] = useState('todos')
  const [filtroProveedor, setFiltroProveedor] = useState('todos')

  useEffect(() => {
    async function cargar() {
      const [{ data: ocData }, { data: solData }] = await Promise.all([
        supabase.from('ordenes_compra').select('*, proveedores(nombre)'),
        supabase.from('solicitudes').select('estatus'),
      ])
      setOcs(ocData || [])
      setSolicitudes(solData || [])
      setLoading(false)
    }
    cargar()
  }, [])

  const anios = useMemo(() => {
    const set = new Set(
      ocs.filter((o) => o.fecha_documento).map((o) => new Date(o.fecha_documento).getFullYear())
    )
    return Array.from(set).sort((a, b) => b - a)
  }, [ocs])

  const proveedoresDisponibles = useMemo(() => {
    const set = new Set(ocs.map((o) => o.proveedores?.nombre || 'Sin proveedor'))
    return Array.from(set).sort()
  }, [ocs])

  if (loading) return <p className="text-center text-ink/50">Cargando…</p>

  const ocsFiltradas = ocs.filter((o) => {
    const nombreProv = o.proveedores?.nombre || 'Sin proveedor'
    if (filtroProveedor !== 'todos' && nombreProv !== filtroProveedor) return false
    if (filtroAnio === 'todos' && filtroMes === 'todos') return true
    if (!o.fecha_documento) return false
    const f = new Date(o.fecha_documento)
    if (filtroAnio !== 'todos' && f.getFullYear() !== Number(filtroAnio)) return false
    if (filtroMes !== 'todos' && f.getMonth() !== Number(filtroMes)) return false
    return true
  })

  const gastoPorMoneda = {}
  ocsFiltradas.forEach((o) => {
    const m = o.moneda || 'MXN'
    gastoPorMoneda[m] = (gastoPorMoneda[m] || 0) + Number(o.total || 0)
  })

  const gastoPorProveedor = {}
  ocsFiltradas.forEach((o) => {
    const nombre = o.proveedores?.nombre || 'Sin proveedor'
    gastoPorProveedor[nombre] = (gastoPorProveedor[nombre] || 0) + Number(o.total || 0)
  })
  const topProveedores = Object.entries(gastoPorProveedor).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const contarEstatus = (estatus) => solicitudes.filter((s) => s.estatus === estatus).length

  const hayFiltrosActivos = filtroAnio !== 'todos' || filtroMes !== 'todos' || filtroProveedor !== 'todos'
  const etiquetaPeriodo = hayFiltrosActivos ? 'filtrado' : 'acumulado'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-surface border border-border rounded-xl2 p-4 flex flex-wrap gap-2 items-center">
        <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
          <option value="todos">Todos los años</option>
          {anios.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
          <option value="todos">Todos los meses</option>
          {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={filtroProveedor} onChange={(e) => setFiltroProveedor(e.target.value)} className="rounded-md border border-border px-3 py-1.5 text-sm">
          <option value="todos">Todos los proveedores</option>
          {proveedoresDisponibles.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {hayFiltrosActivos && (
          <button
            onClick={() => { setFiltroAnio('todos'); setFiltroMes('todos'); setFiltroProveedor('todos') }}
            className="text-xs text-muted hover:text-ink px-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {Object.entries(gastoPorMoneda).length === 0 && (
          <div className="bg-surface border border-border rounded-xl2 p-6 sm:col-span-3 text-center text-ink/50">
            No hay OC que coincidan con este filtro.
          </div>
        )}
        {Object.entries(gastoPorMoneda).map(([moneda, total]) => (
          <div key={moneda} className="bg-surface border border-border rounded-xl2 p-6">
            <p className="text-xs text-ink/50 mb-1">Gasto {etiquetaPeriodo} ({moneda})</p>
            <p className="text-2xl font-bold text-coral">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
        <div className="bg-surface border border-border rounded-xl2 p-6">
          <p className="text-xs text-ink/50 mb-1">Pendientes de autorización</p>
          <p className="text-2xl font-bold text-yellow-600">{contarEstatus('pendiente_autorizacion')}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl2 p-6">
          <p className="text-xs text-ink/50 mb-1">En gestión</p>
          <p className="text-2xl font-bold text-purple-600">{contarEstatus('en_gestion')}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl2 p-6">
          <p className="text-xs text-ink/50 mb-1">Órdenes de compra {hayFiltrosActivos ? 'en este filtro' : 'cargadas'}</p>
          <p className="text-2xl font-bold text-ink">{ocsFiltradas.length}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl2 p-6">
        <h3 className="font-semibold mb-4">Top proveedores ({etiquetaPeriodo})</h3>
        {topProveedores.length === 0 && <p className="text-sm text-ink/50">Sin datos todavía.</p>}
        <div className="space-y-2">
          {topProveedores.map(([nombre, total]) => (
            <div key={nombre} className="flex justify-between text-sm border-b border-ink/5 pb-2">
              <span>{nombre}</span>
              <span className="font-medium">${total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
