import { Briefcase, LogOut } from 'lucide-react'

export default function Layout({ children, view, setView, views, usuario, signOut }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <button onClick={() => setView(views.HOME)} className="flex items-center gap-2 font-semibold text-brand text-[15px] tracking-tight">
            <Briefcase size={18} strokeWidth={2} />
            Gestión de Compras
          </button>
          <nav className="flex items-center gap-1 text-[13px] font-medium text-muted">
            <button onClick={() => setView(views.HOME)} className="px-3 py-1.5 rounded-md hover:bg-canvas hover:text-ink">Inicio</button>
            <button onClick={() => setView(views.MIS_SOLICITUDES)} className="px-3 py-1.5 rounded-md hover:bg-canvas hover:text-ink">Mis solicitudes</button>
            {(usuario?.rol === 'jefe' || usuario?.rol === 'gestor') && (
              <button onClick={() => setView(views.POR_AUTORIZAR)} className="px-3 py-1.5 rounded-md hover:bg-canvas hover:text-ink">Por autorizar</button>
            )}
            {usuario?.rol === 'gestor' && (
              <>
                <button onClick={() => setView(views.DASHBOARD)} className="px-3 py-1.5 rounded-md hover:bg-canvas hover:text-ink">Dashboard</button>
                <button onClick={() => setView(views.CALENDARIO)} className="px-3 py-1.5 rounded-md hover:bg-canvas hover:text-ink">Calendario</button>
                <button onClick={() => setView(views.GESTION_SOLICITUDES)} className="px-3 py-1.5 rounded-md hover:bg-canvas hover:text-ink">Gestión</button>
                <button onClick={() => setView(views.USUARIOS)} className="px-3 py-1.5 rounded-md hover:bg-canvas hover:text-ink">Usuarios</button>
                <button onClick={() => setView(views.CATALOGOS)} className="px-3 py-1.5 rounded-md hover:bg-canvas hover:text-ink">Catálogos</button>
              </>
            )}
            <span className="w-px h-4 bg-border mx-2" />
            <span className="text-ink font-medium">{usuario?.nombre}</span>
            <button onClick={signOut} className="p-1.5 rounded-md hover:bg-canvas text-muted hover:text-ink" title="Salir">
              <LogOut size={16} />
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
