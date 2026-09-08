import { useState } from 'react'
import { Briefcase } from 'lucide-react'
import { useAuth } from '../AuthContext.jsx'
import Field from './Field.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Algo salió mal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-surface border border-border rounded-xl2 p-8">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase size={20} className="text-brand" strokeWidth={2} />
          <h1 className="text-lg font-semibold text-brand tracking-tight">Gestión de Compras</h1>
        </div>
        <p className="text-sm text-muted mb-6">Inicia sesión con tu cuenta corporativa</p>

        <form onSubmit={handleSubmit}>
          <Field label="Correo" type="email" value={email} onChange={setEmail} />
          <Field label="Contraseña" type="password" value={password} onChange={setPassword} />

          {error && <p className="text-xs text-danger mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-light text-white py-2.5 rounded-md font-medium text-sm disabled:opacity-50 mt-2 transition-colors"
          >
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-muted mt-6 text-center">
          ¿No tienes cuenta? Pídele acceso a tu gestor — el registro no está abierto.
        </p>
      </div>
    </div>
  )
}
