import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { useAuth } from '../../AuthContext.jsx'

export default function PorAutorizar() {
  const { usuario } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [comentarios, setComentarios] = useState({})

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('jefe_id', usuario.id)
      .eq('estatus', 'pendiente_autorizacion')
      .order('created_at', { ascending: true })
    setSolicitudes(data || [])
    setLoading(false)
  }

  async function resolver(id, nuevoEstatus) {
    await supabase
      .from('solicitudes')
      .update({
        estatus: nuevoEstatus,
        fecha_autorizacion: new Date().toISOString().slice(0, 10),
        comentario_autorizacion: comentarios[id] || null,
      })
      .eq('id', id)
    cargar()
  }

  if (loading) return <p className="text-center text-ink/50">Cargando…</p>

  if (!solicitudes.length) {
    return <p className="text-center text-ink/50 mt-10">No tienes solicitudes pendientes por autorizar 🎉</p>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {solicitudes.map((s) => (
        <div key={s.id} className="bg-white rounded-xl2 shadow-md p-6">
          <h3 className="font-medium mb-1">#{s.folio} · {s.solicitante_nombre}</h3>
          <p className="text-sm mb-1">{s.descripcion}</p>
          {s.justificacion && <p className="text-sm text-ink/60 mb-2">{s.justificacion}</p>}
          <p className="text-xs text-ink/40 mb-3">
            {s.centro_costo ? `CC: ${s.centro_costo} · ` : ''}
            {s.monto_estimado ? `Estimado: $${Number(s.monto_estimado).toLocaleString()}` : ''}
          </p>
          <textarea
            placeholder="Comentario (opcional)"
            value={comentarios[s.id] || ''}
            onChange={(e) => setComentarios((c) => ({ ...c, [s.id]: e.target.value }))}
            className="w-full text-sm rounded-lg border border-ink/10 px-3 py-2 mb-3"
            rows={2}
          />
          <div className="flex gap-3 justify-end">
            <button onClick={() => resolver(s.id, 'rechazada')} className="px-5 py-2 rounded-full text-red-500 hover:bg-red-50">
              Rechazar
            </button>
            <button onClick={() => resolver(s.id, 'autorizada')} className="px-6 py-2 rounded-full bg-coral text-white font-medium">
              Autorizar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
