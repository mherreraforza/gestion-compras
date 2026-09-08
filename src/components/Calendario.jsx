import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

export default function Calendario() {
  const [recordatorios, setRecordatorios] = useState([])
  const [cursor, setCursor] = useState(new Date())

  useEffect(() => {
    supabase.from('recordatorios').select('*').eq('activo', true).then(({ data }) => setRecordatorios(data || []))
  }, [])

  const anio = cursor.getFullYear()
  const mes = cursor.getMonth()
  const primerDia = new Date(anio, mes, 1)
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const offset = primerDia.getDay()

  const celdas = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  function recordatoriosDelDia(d) {
    if (!d) return []
    const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return recordatorios.filter((r) => r.fecha === fecha)
  }

  const proximos = recordatorios
    .filter((r) => new Date(r.fecha) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(0, 8)

  return (
    <div className="max-w-3xl mx-auto grid gap-6 sm:grid-cols-2">
      <div className="bg-surface border border-border rounded-xl2 p-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCursor(new Date(anio, mes - 1, 1))} className="px-2 text-ink/50 hover:text-coral">←</button>
          <h3 className="font-semibold capitalize">
            {cursor.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => setCursor(new Date(anio, mes + 1, 1))} className="px-2 text-ink/50 hover:text-coral">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink/40 mb-1">
          {DIAS.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {celdas.map((d, i) => {
            const eventos = recordatoriosDelDia(d)
            return (
              <div
                key={i}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm ${d ? 'bg-blush' : ''} ${eventos.length ? 'ring-2 ring-coral' : ''}`}
              >
                {d && <span>{d}</span>}
                {eventos.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-coral mt-0.5" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl2 p-6">
        <h3 className="font-semibold mb-4">Próximos recordatorios</h3>
        {proximos.length === 0 && <p className="text-sm text-ink/50">Nada próximo por ahora.</p>}
        <div className="space-y-3">
          {proximos.map((r) => (
            <div key={r.id} className="text-sm border-b border-ink/5 pb-2">
              <p className="font-medium">{r.titulo}</p>
              <p className="text-ink/50 text-xs">
                {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                {r.frecuencia ? ` · se repite ${r.frecuencia}` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
