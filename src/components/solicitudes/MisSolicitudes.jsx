import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import EstatusBadge from './EstatusBadge.jsx'

export default function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('solicitudes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSolicitudes(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-center text-ink/50">Cargando…</p>

  if (!solicitudes.length) {
    return <p className="text-center text-ink/50 mt-10">Todavía no tienes solicitudes.</p>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {solicitudes.map((s) => (
        <div key={s.id} className="bg-surface border border-border rounded-xl2 p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium">#{s.folio} · {s.descripcion}</h3>
            <EstatusBadge estatus={s.estatus} />
          </div>
          {s.justificacion && <p className="text-sm text-ink/60 mb-1">{s.justificacion}</p>}
          <p className="text-xs text-ink/40">
            {s.centro_costo ? `CC: ${s.centro_costo} · ` : ''}
            {s.monto_estimado ? `Estimado: $${Number(s.monto_estimado).toLocaleString()}` : ''}
          </p>
          {s.comentario_autorizacion && (
            <p className="text-xs text-ink/50 mt-2 italic">"{s.comentario_autorizacion}"</p>
          )}
        </div>
      ))}
    </div>
  )
}
