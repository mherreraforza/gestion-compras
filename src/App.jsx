import { useState } from 'react'
import Layout from './components/Layout.jsx'
import UploadCard from './components/UploadCard.jsx'
import ReviewOCForm from './components/ReviewOCForm.jsx'
import ReviewSolpedForm from './components/ReviewSolpedForm.jsx'
import { extractDocument } from './lib/api.js'

const VIEWS = {
  HOME: 'home',
  CARGA_OC: 'carga_oc',
  CARGA_SOLPED: 'carga_solped',
}

function emptyOC() {
  return {
    numero_documento: '', fecha_documento: '', proveedor: { nombre: '', numero_proveedor: '', rfc: '' },
    solicitante: '', creado_por: '', estatus: '', fecha_entrega: '', tipo: '',
    condicion_pago_codigo: '', condicion_pago_desc: '', moneda: 'MXN', subtotal: 0, descuento: 0,
    gastos_adicionales: 0, impuesto_pct: 16, impuesto_base: 0, impuesto: 0, total: 0, partidas: [],
  }
}
function emptySolped() {
  return { numero_solped: '', tipo: '', estatus: '', partidas: [] }
}

export default function App() {
  const [view, setView] = useState(VIEWS.HOME)
  const [extracted, setExtracted] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleUpload(file, tipo) {
    setLoading(true)
    setError(null)
    try {
      const data = await extractDocument(file, tipo)
      setExtracted({ tipo, data, archivo: file })
    } catch (e) {
      setError('No se pudo leer el documento automáticamente. Captúralo a mano abajo.')
      setExtracted({ tipo, data: tipo === 'oc' ? emptyOC() : emptySolped(), archivo: file })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout view={view} setView={setView} views={VIEWS}>
      {view === VIEWS.HOME && (
        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto mt-10">
          <button
            onClick={() => setView(VIEWS.CARGA_OC)}
            className="rounded-xl2 bg-white shadow-md p-8 text-left hover:shadow-lg transition hover:-translate-y-1"
          >
            <p className="text-2xl mb-2">📄</p>
            <h2 className="font-semibold text-lg mb-1">Cargar Orden de Compra</h2>
            <p className="text-sm text-ink/60">Sube el PDF y te ayudo a leer los datos.</p>
          </button>
          <button
            onClick={() => setView(VIEWS.CARGA_SOLPED)}
            className="rounded-xl2 bg-white shadow-md p-8 text-left hover:shadow-lg transition hover:-translate-y-1"
          >
            <p className="text-2xl mb-2">🛒</p>
            <h2 className="font-semibold text-lg mb-1">Cargar Solicitud de Pedido</h2>
            <p className="text-sm text-ink/60">Sube la foto de la SOLPED de SAP.</p>
          </button>
        </div>
      )}

      {(view === VIEWS.CARGA_OC || view === VIEWS.CARGA_SOLPED) && !extracted && (
        <UploadCard
          tipo={view === VIEWS.CARGA_OC ? 'oc' : 'solped'}
          loading={loading}
          error={error}
          onUpload={handleUpload}
        />
      )}

      {extracted && extracted.tipo === 'oc' && (
        <ReviewOCForm
          initial={extracted.data}
          archivo={extracted.archivo}
          onDone={() => { setExtracted(null); setView(VIEWS.HOME) }}
        />
      )}

      {extracted && extracted.tipo === 'solped' && (
        <ReviewSolpedForm
          initial={extracted.data}
          archivo={extracted.archivo}
          onDone={() => { setExtracted(null); setView(VIEWS.HOME) }}
        />
      )}
    </Layout>
  )
}
