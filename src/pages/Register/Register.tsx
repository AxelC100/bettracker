import { useState, type FormEvent } from 'react'

import { useNavigate } from 'react-router-dom'

import { api } from '../../lib/api'

import { useAuth } from '../../lib/auth'

import { Link } from 'react-router-dom'

import './Register.css'



function Register() {

  const navigate = useNavigate()

  const { confirmSession } = useAuth()

  const [error, setError] = useState('')

  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault()

    if (busy) return

    const fields = new FormData(event.currentTarget)

    setError('')

    if (fields.get('password') !== fields.get('confirmPassword')) { setError('Las contraseñas no coinciden.'); return }

    setBusy(true)

    try {

      await api('/auth/register', 'POST', { name: fields.get('name'), email: fields.get('email'), password: fields.get('password'), remember: fields.get('remember') === 'on' })

      await confirmSession()
      navigate('/dashboard', { replace: true })

    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }

  }



  return (

    <main className="register-page">

      <section className="register-card">

        <div className="register-header">

          <h1>Crear cuenta</h1>

          <p>Empieza a registrar y analizar tus apuestas.</p>

        </div>



        <form className="register-form" onSubmit={submit}>

          {error && <p role="alert">{error}</p>}

          <div className="form-group">

            <label htmlFor="name">Nombre</label>

            <input

              id="name" name="name" required

              type="text"

              placeholder="Tu nombre"

            />

          </div>



          <div className="form-group">

            <label htmlFor="email">Correo electrónico</label>

            <input

              id="email" name="email" required

              type="email"

              placeholder="correo@ejemplo.com"

            />

          </div>



          <div className="form-group">

            <label htmlFor="password">Contraseña</label>

            <input

              id="password" name="password" required minLength={10} maxLength={128}

              type="password"

              placeholder="Crea una contraseña"

            />

          </div>



          <div className="form-group">

            <label htmlFor="confirmPassword">Confirmar contraseña</label>

            <input

              id="confirmPassword" name="confirmPassword" required

              type="password"

              placeholder="Repite tu contraseña"

            />

          </div>



          <button type="submit" disabled={busy} className="register-button">

            {busy ? 'Creando cuenta…' : 'Crear cuenta'}

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