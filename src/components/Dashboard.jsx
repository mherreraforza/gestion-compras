import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Dashboard() {
  const [ocs, setOcs] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <p className="text-center text-ink/50">Cargando…</p>

  const gastoPorMoneda = {}
  ocs.forEach((o) => {
    const m = o.moneda || 'MXN'
    gastoPorMoneda[m] = (gastoPorMoneda[m] || 0) + Number(o.total || 0)
  })

  const gastoPorProveedor = {}
  ocs.forEach((o) => {
    const nombre = o.proveedores?.nombre || 'Sin proveedor'
    gastoPorProveedor[nombre] = (gastoPorProveedor[nombre] || 0) + Number(o.total || 0)
  })
  const topProveedores = Object.entries(gastoPorProveedor).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const contarEstatus = (estatus) => solicitudes.filter((s) => s.estatus === estatus).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {Object.entries(gastoPorMoneda).length === 0 && (
          <div className="bg-surface border border-border rounded-xl2 p-6 sm:col-span-3 text-center text-ink/50">
            Todavía no hay OC cargadas.
          </div>
        )}
        {Object.entries(gastoPorMoneda).map(([moneda, total]) => (
          <div key={moneda} className="bg-surface border border-border rounded-xl2 p-6">
            <p className="text-xs text-ink/50 mb-1">Gasto acumulado ({moneda})</p>
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
          <p className="text-xs text-ink/50 mb-1">Órdenes de compra cargadas</p>
          <p className="text-2xl font-bold text-ink">{ocs.length}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl2 p-6">
        <h3 className="font-semibold mb-4">Top proveedores (histórico)</h3>
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
