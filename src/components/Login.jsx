import { useState } from 'react'
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
    <div className="min-h-screen bg-blush flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-xl2 shadow-md p-8">
        <h1 className="text-xl font-bold text-coral mb-1">✨ Gestión de Compras</h1>
        <p className="text-sm text-ink/60 mb-6">Inicia sesión</p>

        <form onSubmit={handleSubmit}>
          <Field label="Correo" type="email" value={email} onChange={setEmail} />
          <Field label="Contraseña" type="password" value={password} onChange={setPassword} />

          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-coral text-white py-2.5 rounded-full font-medium disabled:opacity-50 mt-2"
          >
            {loading ? 'Un momento…' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-ink/40 mt-6 text-center">
          ¿No tienes cuenta? Pídele acceso a tu PMO — aquí no hay registro abierto.
        </p>
      </div>
    </div>
  )
}
