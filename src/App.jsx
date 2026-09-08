import { useState } from 'react'
import {
  FilePlus, ClipboardList, CheckSquare, BarChart3, CalendarDays,
  Settings, FileUp, ShoppingCart, Users, Tags,
} from 'lucide-react'
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
import Catalogos from './components/admin/Catalogos.jsx'
import Dashboard from './components/Dashboard.jsx'
import Calendario from './components/Calendario.jsx'
import { extractDocument } from './lib/api.js'

const VIEWS = {
  HOME: 'home',
  DASHBOARD: 'dashboard',
  CALENDARIO: 'calendario',
  NUEVA_SOLICITUD: 'nueva_solicitud',
  MIS_SOLICITUDES: 'mis_solicitudes',
  POR_AUTORIZAR: 'por_autorizar',
  GESTION_SOLICITUDES: 'gestion_solicitudes',
  USUARIOS: 'usuarios',
  CATALOGOS: 'catalogos',
  CARGA_OC: 'carga_oc',
  CARGA_SOLPED: 'carga_solped',
}

function HomeCard({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group bg-surface border border-border rounded-xl2 p-6 text-left hover:border-brand/40 hover:shadow-sm transition-all"
    >
      <div className="w-9 h-9 rounded-md bg-canvas flex items-center justify-center mb-4 group-hover:bg-brand/5">
        <Icon size={18} className="text-brand" strokeWidth={1.75} />
      </div>
      <h2 className="font-semibold text-[15px] text-ink mb-1">{title}</h2>
      <p className="text-sm text-muted leading-snug">{description}</p>
    </button>
  )
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

  if (authLoading) return <p className="text-center mt-20 text-muted text-sm">Cargando…</p>
  if (!session) return <Login />
  if (!usuario) return <p className="text-center mt-20 text-muted text-sm">Preparando tu cuenta…</p>

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
        <div>
          <h1 className="text-xl font-semibold text-ink mb-1">Panel principal</h1>
          <p className="text-sm text-muted mb-8">Gestión de compras — {usuario.nombre}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <HomeCard
              icon={FilePlus}
              title="Nueva solicitud"
              description="Pide algo y mándalo a autorizar."
              onClick={() => setView(VIEWS.NUEVA_SOLICITUD)}
            />
            <HomeCard
              icon={ClipboardList}
              title="Mis solicitudes"
              description="Ve el estatus de lo que has pedido."
              onClick={() => setView(VIEWS.MIS_SOLICITUDES)}
            />
            {(usuario.rol === 'jefe' || usuario.rol === 'gestor') && (
              <HomeCard
                icon={CheckSquare}
                title="Por autorizar"
                description="Solicitudes esperando tu visto bueno."
                onClick={() => setView(VIEWS.POR_AUTORIZAR)}
              />
            )}
            {usuario.rol === 'gestor' && (
              <>
                <HomeCard
                  icon={BarChart3}
                  title="Dashboard"
                  description="Gasto del mes y solicitudes activas."
                  onClick={() => setView(VIEWS.DASHBOARD)}
                />
                <HomeCard
                  icon={CalendarDays}
                  title="Calendario"
                  description="Periodos y recordatorios recurrentes."
                  onClick={() => setView(VIEWS.CALENDARIO)}
                />
                <HomeCard
                  icon={Settings}
                  title="Gestión de solicitudes"
                  description="Todo lo autorizado que te toca tramitar."
                  onClick={() => setView(VIEWS.GESTION_SOLICITUDES)}
                />
                <HomeCard
                  icon={FileUp}
                  title="Cargar Orden de Compra"
                  description="Sube el PDF, se lee automáticamente."
                  onClick={() => setView(VIEWS.CARGA_OC)}
                />
                <HomeCard
                  icon={ShoppingCart}
                  title="Cargar Solicitud de Pedido"
                  description="Sube la foto de la SOLPED de SAP."
                  onClick={() => setView(VIEWS.CARGA_SOLPED)}
                />
                <HomeCard
                  icon={Users}
                  title="Usuarios"
                  description="Da de alta colaboradores y autorizadores."
                  onClick={() => setView(VIEWS.USUARIOS)}
                />
                <HomeCard
                  icon={Tags}
                  title="Catálogos"
                  description="Centros de costo y cuentas contables."
                  onClick={() => setView(VIEWS.CATALOGOS)}
                />
              </>
            )}
          </div>
        </div>
      )}

      {view === VIEWS.DASHBOARD && <Dashboard />}
      {view === VIEWS.CALENDARIO && <Calendario />}
      {view === VIEWS.NUEVA_SOLICITUD && (
        <NuevaSolicitud onDone={() => setView(VIEWS.MIS_SOLICITUDES)} />
      )}
      {view === VIEWS.MIS_SOLICITUDES && <MisSolicitudes />}
      {view === VIEWS.POR_AUTORIZAR && <PorAutorizar />}
      {view === VIEWS.GESTION_SOLICITUDES && <GestionSolicitudes />}
      {view === VIEWS.USUARIOS && <GestionUsuarios />}
      {view === VIEWS.CATALOGOS && <Catalogos />}

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
