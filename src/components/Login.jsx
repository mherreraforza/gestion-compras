import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import Field from './Field.jsx'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [modo, setModo] = useState('entrar') // 'entrar' | 'crear'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('colaborador')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (modo === 'entrar') {
        await signIn(email, password)
      } else {
        await signUp(email, password, nombre, rol)
      }
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
        <p className="text-sm text-ink/60 mb-6">
          {modo === 'entrar' ? 'Inicia sesión' : 'Crea tu cuenta'}
        </p>

        <form onSubmit={handleSubmit}>
          {modo === 'crear' && (
            <>
              <Field label="Nombre" value={nombre} onChange={setNombre} />
              <label className="block text-sm mb-3">
                <span className="text-ink/60">Rol</span>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/10 px-3 py-2"
                >
                  <option value="colaborador">Colaborador (voy a pedir compras)</option>
                  <option value="jefe">Jefe (voy a autorizar compras)</option>
                </select>
              </label>
            </>
          )}
          <Field label="Correo" type="email" value={email} onChange={setEmail} />
          <Field label="Contraseña" type="password" value={password} onChange={setPassword} />

          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-coral text-white py-2.5 rounded-full font-medium disabled:opacity-50 mt-2"
          >
            {loading ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          onClick={() => setModo(modo === 'entrar' ? 'crear' : 'entrar')}
          className="text-sm text-ink/50 mt-4 w-full text-center hover:text-coral"
        >
          {modo === 'entrar' ? '¿No tienes cuenta? Créala aquí' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  )
}
