import { useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import Login from './components/Login.jsx'
import Layout from './components/Layout.jsx'
import UploadCard from './components/UploadCard.jsx'
import ReviewOCForm from './components/ReviewOCForm.jsx'
import ReviewSolpedForm from './components/ReviewSolpedForm.jsx'
import NuevaSolicitud from './components/solicitudes/NuevaSolicitud.jsx'
import MisSolicitudes from './components/solicitudes/MisSolicitudes.jsx'
import PorAutorizar from './components/solicitudes/PorAutorizar.jsx'
import GestionSolicitudes from './components/solicitudes/GestionSolicitudes.jsx'
import GestionUsuarios from './components/admin/GestionUsuarios.jsx'
import { extractDocument } from './lib/api.js'

const VIEWS = {
  HOME: 'home',
  NUEVA_SOLICITUD: 'nueva_solicitud',
  MIS_SOLICITUDES: 'mis_solicitudes',
  POR_AUTORIZAR: 'por_autorizar',
  GESTION_SOLICITUDES: 'gestion_solicitudes',
  USUARIOS: 'usuarios',
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
  const { session, usuario, loading: authLoading, signOut } = useAuth()
  const [view, setView] = useState(VIEWS.HOME)
  const [extracted, setExtracted] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (authLoading) return <p className="text-center mt-20 text-ink/50">Cargando…</p>
  if (!session) return <Login />
  if (!usuario) return <p className="text-center mt-20 text-ink/50">Preparando tu cuenta…</p>

  async function handleUpload(file, tipo) {
    if (tipo === 'solped') {
      setExtracted({ tipo, data: emptySolped(), archivo: file })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await extractDocument(file, tipo)
      setExtracted({ tipo, data, archivo: file })
    } catch (e) {
      setError('No se pudo leer el documento automáticamente. Captúralo a mano abajo.')
      setExtracted({ tipo, data: emptyOC(), archivo: file })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout view={view} setView={setView} views={VIEWS} usuario={usuario} signOut={signOut}>
      {view === VIEWS.HOME && (
        <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto mt-10">
          <button onClick={() => setView(VIEWS.NUEVA_SOLICITUD)} className="rounded-xl2 bg-white shadow-md p-8 text-left hover:shadow-lg transition hover:-translate-y-1">
            <p className="text-2xl mb-2">🙋</p>
            <h2 className="font-semibold text-lg mb-1">Nueva solicitud</h2>
            <p className="text-sm text-ink/60">Pide algo y mándalo a autorizar.</p>
          </button>
          <button onClick={() => setView(VIEWS.MIS_SOLICITUDES)} className="rounded-xl2 bg-white shadow-md p-8 text-left hover:shadow-lg transition hover:-translate-y-1">
            <p className="text-2xl mb-2">📋</p>
            <h2 className="font-semibold text-lg mb-1">Mis solicitudes</h2>
            <p className="text-sm text-ink/60">Ve el estatus de lo que has pedido.</p>
          </button>
          {(usuario.rol === 'jefe' || usuario.rol === 'pmo') && (
            <button onClick={() => setView(VIEWS.POR_AUTORIZAR)} className="rounded-xl2 bg-white shadow-md p-8 text-left hover:shadow-lg transition hover:-translate-y-1">
              <p className="text-2xl mb-2">✅</p>
              <h2 className="font-semibold text-lg mb-1">Por autorizar</h2>
              <p className="text-sm text-ink/60">Solicitudes esperando tu visto bueno.</p>
            </button>
          )}
          {usuario.rol === 'pmo' && (
            <>
              <button onClick={() => setView(VIEWS.GESTION_SOLICITUDES)} className="rounded-xl2 bg-white shadow-md p-8 text-left hover:shadow-lg transition hover:-translate-y-1">
                <p className="text-2xl mb-2">⚙️</p>
                <h2 className="font-semibold text-lg mb-1">Gestión de solicitudes</h2>
                <p className="text-sm text-ink/60">Todo lo autorizado que te toca tramitar.</p>
              </button>
              <button onClick={() => setView(VIEWS.CARGA_OC)} className="rounded-xl2 bg-white shadow-md p-8 text-left hover:shadow-lg transition hover:-translate-y-1">
                <p className="text-2xl mb-2">📄</p>
                <h2 className="font-semibold text-lg mb-1">Cargar Orden de Compra</h2>
                <p className="text-sm text-ink/60">Sube el PDF, se lee solo.</p>
              </button>
              <button onClick={() => setView(VIEWS.CARGA_SOLPED)} className="rounded-xl2 bg-white shadow-md p-8 text-left hover:shadow-lg transition hover:-translate-y-1">
                <p className="text-2xl mb-2">🛒</p>
                <h2 className="font-semibold text-lg mb-1">Cargar Solicitud de Pedido</h2>
                <p className="text-sm text-ink/60">Sube la foto de la SOLPED de SAP.</p>
              </button>
              <button onClick={() => setView(VIEWS.USUARIOS)} className="rounded-xl2 bg-white shadow-md p-8 text-left hover:shadow-lg transition hover:-translate-y-1">
                <p className="text-2xl mb-2">👥</p>
                <h2 className="font-semibold text-lg mb-1">Usuarios</h2>
                <p className="text-sm text-ink/60">Da de alta colaboradores y jefes.</p>
              </button>
            </>
          )}
        </div>
      )}

      {view === VIEWS.NUEVA_SOLICITUD && (
        <NuevaSolicitud onDone={() => setView(VIEWS.MIS_SOLICITUDES)} />
      )}
      {view === VIEWS.MIS_SOLICITUDES && <MisSolicitudes />}
      {view === VIEWS.POR_AUTORIZAR && <PorAutorizar />}
      {view === VIEWS.GESTION_SOLICITUDES && <GestionSolicitudes />}
      {view === VIEWS.USUARIOS && <GestionUsuarios />}

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
