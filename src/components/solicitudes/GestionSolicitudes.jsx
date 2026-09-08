import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import EstatusBadge from './EstatusBadge.jsx'

const SIGUIENTE = {
  autorizada: 'en_gestion',
  en_gestion: 'solped_generada',
  solped_generada: 'completada',
}
const ETIQUETA_BOTON = {
  autorizada: 'Pasar a gestión',
  en_gestion: 'Marcar SOLPED generada',
  solped_generada: 'Marcar completada',
}

export default function GestionSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('activas')

  useEffect(() => { cargar() }, [filtro])

  async function cargar() {
    setLoading(true)
    let query = supabase.from('solicitudes').select('*').order('created_at', { ascending: false })
    if (filtro === 'activas') {
      query = query.in('estatus', ['autorizada', 'en_gestion', 'solped_generada'])
    } else if (filtro === 'pendientes') {
      query = query.eq('estatus', 'pendiente_autorizacion')
    } else if (filtro === 'completadas') {
      query = query.eq('estatus', 'completada')
    }
    const { data } = await query
    setSolicitudes(data || [])
    setLoading(false)
  }

  async function avanzar(s) {
    const nuevo = SIGUIENTE[s.estatus]
    if (!nuevo) return
    await supabase.from('solicitudes').update({ estatus: nuevo }).eq('id', s.id)
    cargar()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-2 mb-4">
        {['activas', 'pendientes', 'completadas'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm ${filtro === f ? 'bg-coral text-white' : 'bg-white text-ink/60'}`}
          >
            {f === 'activas' ? 'En trámite' : f === 'pendientes' ? 'Pendientes de jefe' : 'Completadas'}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-ink/50">Cargando…</p>}
      {!loading && !solicitudes.length && <p className="text-center text-ink/50 mt-10">Nada por aquí.</p>}

      <div className="space-y-3">
        {solicitudes.map((s) => (
          <div key={s.id} className="bg-white rounded-xl2 shadow-sm p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">#{s.folio} · {s.solicitante_nombre}</h3>
              <EstatusBadge estatus={s.estatus} />
            </div>
            <p className="text-sm mb-1">{s.descripcion}</p>
            <p className="text-xs text-ink/40 mb-3">
              {s.centro_costo ? `CC: ${s.centro_costo} · ` : ''}
              {s.monto_estimado ? `Estimado: $${Number(s.monto_estimado).toLocaleString()}` : ''}
            </p>
            {SIGUIENTE[s.estatus] && (
              <button
                onClick={() => avanzar(s)}
                className="text-sm px-4 py-1.5 rounded-full bg-lilac/40 text-purple-700 font-medium"
              >
                {ETIQUETA_BOTON[s.estatus]} →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
