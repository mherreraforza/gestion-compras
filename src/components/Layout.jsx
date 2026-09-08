export default function Layout({ children, view, setView, views }) {
  return (
    <div className="min-h-screen bg-blush">
      <header className="bg-white/70 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setView(views.HOME)} className="font-bold text-coral text-lg">
            ✨ Gestión de Compras
          </button>
          <nav className="flex gap-2 text-sm">
            <button onClick={() => setView(views.HOME)} className="px-3 py-1.5 rounded-full hover:bg-blush">Inicio</button>
            <button onClick={() => setView(views.CARGA_OC)} className="px-3 py-1.5 rounded-full hover:bg-blush">+ OC</button>
            <button onClick={() => setView(views.CARGA_SOLPED)} className="px-3 py-1.5 rounded-full hover:bg-blush">+ SOLPED</button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
