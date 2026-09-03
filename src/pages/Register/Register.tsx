import { Link } from 'react-router-dom'
import './Register.css'

function Register() {
  return (
    <main className="register-page">
      <section className="register-card">
        <div className="register-header">
          <h1>Crear cuenta</h1>
          <p>Empieza a registrar y analizar tus apuestas.</p>
        </div>

        <form className="register-form">
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              type="text"
              placeholder="Tu nombre"
            />
          </div>

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
              placeholder="Crea una contraseña"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
            />
          </div>

          <button type="submit" className="register-button">
            Crear cuenta
          </button>
        </form>

        <p className="login-text">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  )
}

export default Register