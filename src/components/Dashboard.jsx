import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download } from 'lucide-react'
import { supabase } from '../supabaseClient.js'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const COLORES = ['#14213D', '#2F6FED', '#B45309', '#15803D', '#B91C1C', '#6B7280']

function money(n) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Dashboard() {
  const [ocs, setOcs] = useState([])
  const [partidas, setPartidas] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroAnio, setFiltroAnio] = useState('todos')
  const [filtroMes, setFiltroMes] = useState('todos')
  const [filtroProveedor, setFiltroProveedor] = useState('todos')

  useEffect(() => {
    async function cargar() {
      const [{ data: ocData }, { data: partidaData }, { data: solData }, { data: cuentaData }] = await Promise.all([
        supabase.from('ordenes_compra').select('*, proveedores(nombre)'),
        supabase.from('oc_partidas').select('*, ordenes_compra(fecha_documento, moneda, numero_documento, proveedor_id, proveedores(nombre))'),
        supabase.from('solicitudes').select('estatus'),
        supabase.from('cuentas_contables').select('*'),
      ])
      setOcs(ocData || [])
      setPartidas(partidaData || [])
      setSolicitudes(solData || [])
      setCuentas(cuentaData || [])
      setLoading(false)
    }
    cargar()
  }, [])

  const anios = useMemo(() => {
    const set = new Set(ocs.filter((o) => o.fecha_documento).map((o) => new Date(o.fecha_documento).getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  }, [ocs])

  const proveedoresDisponibles = useMemo(() => {
    const set = new Set(ocs.map((o) => o.proveedores?.nombre || 'Sin proveedor'))
    return Array.from(set).sort()
  }, [ocs])

  if (loading) return <p className="text-center text-ink/50">Cargando…</p>

  function pasaFiltro(fechaDocumento, proveedorNombre) {
    if (filtroProveedor !== 'todos' && proveedorNombre !== filtroProveedor) return false
    if (filtroAnio === 'todos' && filtroMes === 'todos') return true
    if (!fechaDocumento) return false
    const f = new Date(fechaDocumento)
    if (filtroAnio !== 'todos' && f.getFullYear() !== Number(filtroAnio)) return false
    if (filtroMes !== 'todos' && f.getMonth() !== Number(filtroMes)) return false
    return true
  }

  const ocsFiltradas = ocs.filter((o) => pasaFiltro(o.fecha_documento, o.proveedores?.nombre || 'Sin proveedor'))
  const partidasFiltradas = partidas.filter((p) =>
    pasaFiltro(p.ordenes_compra?.fecha_documento, p.ordenes_compra?.proveedores?.nombre || 'Sin proveedor')
  )

  // --- KPIs ---
  const gastoPorMoneda = {}
  ocsFiltradas.forEach((o) => {
    const m = o.moneda || 'MXN'
    gastoPorMoneda[m] = (gastoPorMoneda[m] || 0) + Number(o.total || 0)
  })
  const monedas = Object.keys(gastoPorMoneda)

  const contarEstatus = (estatus) => solicitudes.filter((s) => s.estatus === estatus).length

  // --- Top proveedores ---
  const gastoPorProveedor = {}
  ocsFiltradas.forEach((o) => {
    const nombre = o.proveedores?.nombre || 'Sin proveedor'
    const key = `${nombre}|${o.moneda || 'MXN'}`
    gastoPorProveedor[key] = (gastoPorProveedor[key] || 0) + Number(o.total || 0)
  })
  const topProveedores = Object.entries(gastoPorProveedor)
    .map(([key, total]) => { const [nombre, moneda] = key.split('|'); return { nombre, moneda, total } })
    .sort((a, b) => b.total - a.total)

  // --- Tendencia mensual por moneda ---
  const tendenciaPorMes = {}
  ocsFiltradas.forEach((o) => {
    if (!o.fecha_documento) return
    const f = new Date(o.fecha_documento)
    const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`
    const moneda = o.moneda || 'MXN'
    if (!tendenciaPorMes[key]) tendenciaPorMes[key] = { mesKey: key, label: `${MESES_CORTOS[f.getMonth()]} ${f.getFullYear()}` }
    tendenciaPorMes[key][moneda] = (tendenciaPorMes[key][moneda] || 0) + Number(o.total || 0)
  })
  const datosTendencia = Object.values(tendenciaPorMes).sort((a, b) => a.mesKey.localeCompare(b.mesKey)).slice(-12)

  // --- Gasto por centro de costo ---
  const gastoPorCentro = {}
  partidasFiltradas.forEach((p) => {
    const centro = p.centro_costo || 'Sin centro asignado'
    const moneda = p.ordenes_compra?.moneda || 'MXN'
    const key = `${centro}|${moneda}`
    gastoPorCentro[key] = (gastoPorCentro[key] || 0) + Number(p.total || 0)
  })
  const datosCentro = Object.entries(gastoPorCentro)
    .map(([key, total]) => { const [centro, moneda] = key.split('|'); return { centro, moneda, total } })
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // --- Gasto por cuenta contable ---
  const gastoPorCuenta = {}
  partidasFiltradas.forEach((p) => {
    const cuenta = p.cuenta_contable || 'Sin cuenta'
    const moneda = p.ordenes_compra?.moneda || 'MXN'
    const key = `${cuenta}|${moneda}`
    gastoPorCuenta[key] = (gastoPorCuenta[key] || 0) + Number(p.total || 0)
  })
  const datosCuenta = Object.entries(gastoPorCuenta)
    .map(([key, total]) => {
      const [cuenta, moneda] = key.split('|')
      const match = cuentas.find((c) => c.cuenta === cuenta)
      return { cuenta, concepto: match?.concepto || '—', moneda, total }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const hayFiltrosActivos = filtroAnio !== 'todos' || filtroMes !== 'todos' || filtroProveedor !== 'todos'
  const etiquetaPeriodo = hayFiltrosActivos ? 'filtrado' : 'acumulado'

  function exportarExcel() {
    const wb = XLSX.utils.book_new()

    const resumen = [
      ...monedas.map((m) => ({ Indicador: `Gasto ${etiquetaPeriodo} (${m})`, Valor: gastoPorMoneda[m] })),
      { Indicador: 'Órdenes de compra', Valor: ocsFiltradas.length },
      { Indicador: 'Pendientes de autorización', Valor: contarEstatus('pendiente_autorizacion') },
      { Indicador: 'En gestión', Valor: contarEstatus('en_gestion') },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(datosTendencia.map((d) => ({ Mes: d.label, ...Object.fromEntries(monedas.map((m) => [m, d[m] || 0])) }))),
      'Por mes'
    )
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(topProveedores.map((p) => ({ Proveedor: p.nombre, Moneda: p.moneda, Total: p.total }))),
      'Por proveedor'
    )
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(datosCentro.map((c) => ({ 'Centro de costo': c.centro, Moneda: c.moneda, Total: c.total }))),
      'Por centro de costo'
    )
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(datosCuenta.map((c) => ({ Cuenta: c.cuenta, Concepto: c.concepto, Moneda: c.moneda, Total: c.total }))),
      'Por cuenta contable'
    )
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        ocsFiltradas.map((o) => ({
          'No. Documento': o.numero_documento,
          Fecha: o.fecha_documento,
          Proveedor: o.proveedores?.nombre || '',
          Moneda: o.moneda,
          Total: o.total,
          Estatus: o.estatus,
        }))
      ),
      'Detalle OC'
    )

    const fecha = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `reporte_compras_${fecha}.xlsx`)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <button
          onClick={exportarExcel}
          className="flex items-center gap-2 text-sm bg-brand text-white px-4 py-2 rounded-md font-medium hover:bg-brand-light"
        >
          <Download size={15} /> Exportar a Excel
        </button>
      </div>

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
        {monedas.length === 0 && (
          <div className="bg-surface border border-border rounded-xl2 p-6 sm:col-span-3 text-center text-ink/50">
            No hay OC que coincidan con este filtro.
          </div>
        )}
        {monedas.map((m) => (
          <div key={m} className="bg-surface border border-border rounded-xl2 p-6">
            <p className="text-xs text-ink/50 mb-1">Gasto {etiquetaPeriodo} ({m})</p>
            <p className="text-2xl font-bold text-coral">${money(gastoPorMoneda[m])}</p>
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
          <p className="text-xs text-ink/50 mb-1">Órdenes de compra</p>
          <p className="text-2xl font-bold text-ink">{ocsFiltradas.length}</p>
        </div>
      </div>

      {datosTendencia.length > 0 && (
        <div className="bg-surface border border-border rounded-xl2 p-6">
          <h3 className="font-semibold mb-4">Tendencia mensual</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={datosTendencia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${money(v)}`} />
              <Legend />
              {monedas.map((m, i) => (
                <Bar key={m} dataKey={m} name={m} fill={COLORES[i % COLORES.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl2 p-6">
          <h3 className="font-semibold mb-4">Gasto por centro de costo</h3>
          {datosCentro.length === 0 && <p className="text-sm text-ink/50">Sin datos todavía.</p>}
          <div className="space-y-2">
            {datosCentro.map((c, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-ink/5 pb-2">
                <span>{c.centro}</span>
                <span className="font-medium">${money(c.total)} {c.moneda}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl2 p-6">
          <h3 className="font-semibold mb-4">Top proveedores ({etiquetaPeriodo})</h3>
          {topProveedores.length === 0 && <p className="text-sm text-ink/50">Sin datos todavía.</p>}
          <div className="space-y-2">
            {topProveedores.slice(0, 8).map((p, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-ink/5 pb-2">
                <span>{p.nombre}</span>
                <span className="font-medium">${money(p.total)} {p.moneda}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl2 p-6">
        <h3 className="font-semibold mb-4">Gasto por cuenta contable</h3>
        {datosCuenta.length === 0 && <p className="text-sm text-ink/50">Sin datos todavía.</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="pb-2 font-medium">Cuenta</th>
                <th className="pb-2 font-medium">Concepto</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {datosCuenta.map((c, i) => (
                <tr key={i} className="border-b border-ink/5">
                  <td className="py-2">{c.cuenta}</td>
                  <td className="py-2 text-muted">{c.concepto}</td>
                  <td className="py-2 text-right font-medium">${money(c.total)} {c.moneda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
