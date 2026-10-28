import { start } from './app.js'
start().catch(error => {
  console.error('No se pudo iniciar la API. Revisa PostgreSQL y server/.env. Código:', error.code || 'internal')
  process.exitCode = 1
})
