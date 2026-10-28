# BetTracker

Web en React y TypeScript para registrar apuestas y analizar resultados. La API usa Express y PostgreSQL. Moneda inicial: USDT; casa predeterminada: Stake.

## Desarrollo

1. Instalar dependencias con `npm install` en la raíz y en `server`.
2. Configurar PostgreSQL en `server/.env` usando `server/.env.example` como referencia. No subir credenciales al repositorio.
3. Desde `server`, ejecutar `npm run dev`. El servidor crea las tablas iniciales al arrancar; no elimina tablas existentes.
4. Desde la raíz, ejecutar `npm run dev` y abrir la dirección de Vite. Vite dirige `/api` al servidor local.
5. Crear una cuenta. En Configuración se pueden importar las apuestas del navegador. La importación es explícita, omite identificadores repetidos y conserva los originales locales.

El servidor debe poder conectarse a la base antes de aceptar conexiones. Si falla la autenticación PostgreSQL, revisar usuario, contraseña y base en `.env`. La clave de la cuenta BetTracker se elige después, en la web; es independiente de la contraseña de PostgreSQL.

## Crear la base con pgAdmin

Entrar al servidor con una cuenta administradora. Crear un rol de inicio de sesión exclusivo para la aplicación (por ejemplo `bettracker_app`) y establecer una contraseña propia. Crear una base `bettracker` y asignar ese rol como propietario. Configurar `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` en `server/.env`. No reemplazar credenciales de otros proyectos.

También se admite `DATABASE_URL` como alternativa a las variables `DB_*`.

## Comprobaciones

- Raíz: `npm run build` y `npm run lint`.
- Servidor: `npm test` (compilación, validación de apuestas y controles HTTP independientes de base de datos).
- Prueba manual con PostgreSQL: crear dos cuentas, guardar una apuesta en cada una y comprobar que sus historiales sean independientes. Editar, resolver, eliminar, cerrar sesión y volver a entrar. Importar dos veces las mismas apuestas locales y comprobar que no se dupliquen.

Las contraseñas se derivan con scrypt y sal aleatoria. Las sesiones usan cookies HttpOnly y tokens guardados como hash. Las consultas de apuestas filtran por el usuario autenticado. El límite de intentos de autenticación es local al proceso; un despliegue con varias instancias necesita un límite compartido.

## Producción

Compilar frontend y servidor con `npm run build` en sus carpetas. Ejecutar `npm start` desde `server`. Servir frontend y `/api` bajo el mismo dominio con HTTPS y proxy inverso a la API local. Definir `NODE_ENV=production` y `APP_ORIGIN` con el origen público exacto. Las cookies de producción requieren HTTPS. No se ha desplegado esta versión.

La configuración web es el alcance de este bloque; el flujo Electron necesita configuración propia para consumir la API. Recuperación de contraseña está pendiente. Las conexiones externas de visión y resultados requieren claves; consulta IMPLEMENTACION.md. Consultar [PLAN.md](PLAN.md).

## Instancia local preparada en este equipo

Se creo una base exclusiva para desarrollo en `server/.postgres.local/data`, puerto `5433`. La configuracion esta en `server/.env`; la configuracion anterior se conservo en `server/.env.previous.local`. Esos archivos y los datos locales estan excluidos de Git.

Desde `server`, ejecutar `npm run db:start` si PostgreSQL local no esta activo, y luego `npm run dev`. Desde otra terminal en la raiz, ejecutar `npm run dev`. Abrir la URL que muestra Vite y crear una cuenta real. La instancia PostgreSQL previa del equipo permanece en su puerto original.

Pruebas con base real: desde `server`, `npm run test:integration`. Crea cuentas temporales y las elimina al terminar. Comprueba sesiones, separacion entre usuarios, CRUD e importacion sin duplicados. Ejecutar solamente contra una base de desarrollo.

Esta instancia es local a este equipo; no sustituye una base alojada para publicar la aplicacion.


Actualizacion de moneda (27 de octubre de 2026): USDT es la unica moneda admitida para nuevos registros. Los importes admiten hasta ocho decimales y se muestran con la etiqueta USDT. La API rechaza otras monedas; no se convierte USD a USDT. La importacion local requiere confirmar que los importes originales son USDT. No habia apuestas almacenadas en PostgreSQL al realizar este cambio.


## Tickets, capturas y resultados

El formulario admite simples, combinadas y SGM con mercados por deporte y periodos explícitos. La captura se revisa antes de guardar. La lectura local Windows está disponible; la extracción estructurada con IA y las consultas reales a API-Sports requieren claves en el servidor. Consultar [IMPLEMENTACION.md](IMPLEMENTACION.md) para el alcance, las reglas, la configuración y los límites comprobados.
