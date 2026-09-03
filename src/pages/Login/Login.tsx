import { Link } from 'react-router-dom'
import './Login.css'

function Login() {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-header">
          <h1>BetTracker</h1>
          <p>Controla tus apuestas y analiza tu rendimiento.</p>
        </div>

        <form className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          <div className="login-options">
            <label className="remember-option">
              <input type="checkbox" />
              Recordarme
            </label>

            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" className="login-button">
            Iniciar sesión
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