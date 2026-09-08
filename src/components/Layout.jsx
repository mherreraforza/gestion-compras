export default function Layout({ children, view, setView, views, usuario, signOut }) {
  return (
    <div className="min-h-screen bg-blush">
      <header className="bg-white/70 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setView(views.HOME)} className="font-bold text-coral text-lg">
            ✨ Gestión de Compras
          </button>
          <nav className="flex items-center gap-2 text-sm">
            <button onClick={() => setView(views.HOME)} className="px-3 py-1.5 rounded-full hover:bg-blush">Inicio</button>
            <button onClick={() => setView(views.MIS_SOLICITUDES)} className="px-3 py-1.5 rounded-full hover:bg-blush">Mis solicitudes</button>
            {(usuario?.rol === 'jefe' || usuario?.rol === 'gestor') && (
              <button onClick={() => setView(views.POR_AUTORIZAR)} className="px-3 py-1.5 rounded-full hover:bg-blush">Por autorizar</button>
            )}
            {usuario?.rol === 'gestor' && (
              <>
                <button onClick={() => setView(views.DASHBOARD)} className="px-3 py-1.5 rounded-full hover:bg-blush">Dashboard</button>
                <button onClick={() => setView(views.CALENDARIO)} className="px-3 py-1.5 rounded-full hover:bg-blush">Calendario</button>
                <button onClick={() => setView(views.GESTION_SOLICITUDES)} className="px-3 py-1.5 rounded-full hover:bg-blush">Gestión</button>
                <button onClick={() => setView(views.USUARIOS)} className="px-3 py-1.5 rounded-full hover:bg-blush">Usuarios</button>
              </>
            )}
            <span className="text-ink/40 px-2">{usuario?.nombre}</span>
            <button onClick={signOut} className="px-3 py-1.5 rounded-full text-ink/50 hover:bg-blush">Salir</button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
