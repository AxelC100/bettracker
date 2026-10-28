import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Link } from 'react-router-dom'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { confirmSession } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const fields = new FormData(event.currentTarget)
    setError('')
    setBusy(true)
    try {
      await api('/auth/login', 'POST', { name: fields.get('name'), email: fields.get('email'), password: fields.get('password'), remember: fields.get('remember') === 'on' })
      await confirmSession()
      navigate('/dashboard', { replace: true })
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-header">
          <h1>BetTracker</h1>
          <p>Controla tus apuestas y analiza tu rendimiento.</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          {error && <p role="alert">{error}</p>}
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email" name="email" autoComplete="username" required
              type="email"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password" name="password" autoComplete="current-password" required
              type="password"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          <div className="login-options">
            <label className="remember-option">
              <input type="checkbox" name="remember" />
              Recordarme
            </label>

            <span>Recuperación de acceso próximamente</span>
          </div>

          <button type="submit" disabled={busy} className="login-button">
            {busy ? 'Verificando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="register-text">
          ¿No tienes una cuenta?{' '}
          <Link to="/register">Crear cuenta</Link>
        </p>
      </section>
    </main>
  )
}

export default Login