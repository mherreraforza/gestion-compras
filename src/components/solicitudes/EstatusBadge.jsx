const ESTILOS = {
  pendiente_autorizacion: 'bg-yellow-100 text-yellow-700',
  autorizada: 'bg-mint text-emerald-700',
  rechazada: 'bg-red-100 text-red-600',
  en_gestion: 'bg-lilac/40 text-purple-700',
  solped_generada: 'bg-blue-100 text-blue-700',
  completada: 'bg-green-100 text-green-700',
  cancelada: 'bg-gray-100 text-gray-500',
}
const LABELS = {
  pendiente_autorizacion: 'Pendiente de autorización',
  autorizada: 'Autorizada',
  rechazada: 'Rechazada',
  en_gestion: 'En gestión',
  solped_generada: 'SOLPED generada',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

export default function EstatusBadge({ estatus }) {
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${ESTILOS[estatus] || 'bg-gray-100 text-gray-500'}`}>
      {LABELS[estatus] || estatus}
    </span>
  )
}
