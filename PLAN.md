# Desarrollo de BetTracker

Diagnóstico del 27 de octubre de 2026 basado en el código local. No se pudo recuperar el contenido del enlace de conversación compartida.

## Alcance confirmado

Web para registrar apuestas y analizar rendimiento. Deportes iniciales: fútbol, béisbol y baloncesto. Casa inicial: Stake. Se requiere registro desde imágenes y liquidación automática mediante resultados deportivos.

## Estado actual

- React, TypeScript y Vite; empaquetado Electron opcional.
- Registro y edición manual, historial, dashboard y análisis.
- Apuestas en localStorage, sin sincronización entre dispositivos ni separación por usuario.
- Login y registro visuales sin autenticación; configuración pendiente.
- Express solo expone GET /api/health. El archivo de conexión PostgreSQL está vacío.
- Frontend y servidor compilan. Vite advierte un paquete de más de 500 kB.
- El script de producción del servidor espera dist/index.js, pero su tsconfig no define outDir.

## Etapa 1: cuentas y almacenamiento

Implementar PostgreSQL usando la dependencia pg existente, migraciones, usuarios, sesiones y API de apuestas. Validar propiedad de cada apuesta en el servidor. Conectar registro, acceso, cierre de sesión y rutas protegidas. Configurar secretos en el servidor y documentar el despliegue.

Ofrecer migración explícita de apuestas locales a la cuenta, evitando duplicados y conservando los originales hasta confirmar la operación.

Aceptación: las apuestas sobreviven a un cambio de navegador y dos cuentas no pueden consultar ni modificar datos ajenos.

## Etapa 2: modelo y métricas

Centralizar tipos y cálculos repetidos. Separar tickets y selecciones para admitir combinadas. Guardar moneda, importes con precisión definida, cuotas decimales, fechas y origen. Para liquidación automática, almacenar identificador del proveedor y partido, mercado, periodo, lado o equipo y línea numérica, además del texto original.

Unificar ROI y porcentaje de acierto. El dashboard calcula ROI sobre todo lo apostado y Analytics sobre apuestas resueltas. Definir tratamiento de pendientes y anuladas y probar los mismos ejemplos en ambas pantallas.

Aceptación: métricas coherentes y apuestas con datos suficientes para evaluar sus mercados sin interpretar texto libre.

## Etapa 3: registro rápido

Reducir campos obligatorios, recordar moneda y casa, permitir duplicar apuestas y seleccionar partidos de un catálogo. Mantener registro manual para mercados sin cobertura.

Aceptación: registrar una apuesta simple sin repetir preferencias ni exigir país o liga desconocidos.

## Etapa 4: resultados automáticos

Comparar proveedores mediante documentación oficial según cobertura real de fútbol, béisbol y baloncesto, mercados, límites, presupuesto y condiciones. El proveedor de resultados no tiene que ser la casa de apuestas. No se ha seleccionado ni contratado ninguno.

Consumir la API desde el servidor, con adaptador intercambiable y consultas programadas. Asociar selecciones a partidos inequívocos; aplicar reglas por deporte, mercado, periodo y casa. El marcador final no basta para corners, tarjetas o estadísticas de jugadores.

Comenzar con mercados delimitados. Distinguir empate, prórroga, penales y entradas extra cuando corresponda. Guardar evidencia y permitir correcciones auditables. Reintentos y liquidación deben ser idempotentes.

No convertir un partido aplazado o suspendido en apuesta nula sin una regla aplicable. Mantener pendiente o enviar a revisión si faltan datos. Cash out, hándicaps asiáticos y medias ganancias/pérdidas necesitan estados o importes adicionales a los cuatro estados actuales.

Aceptación: casos de ganada, perdida, nula y pendiente comprobados; reejecución sin duplicaciones; mercados no compatibles sin liquidación automática.

## Etapa 5: capturas de Stake

Flujo: cargar imagen → extraer campos → revisar borrador → guardar.

Procesar capturas con visión desde el servidor y validar una respuesta estructurada. Extraer casa, moneda, monto, cuota, partidos, mercados y selecciones. No inventar campos ausentes o ilegibles. Distinguir simples y combinadas. Mostrar captura y borrador editable, revisar posibles duplicados y desambiguar partidos antes de guardar.

Limitar tipos y tamaño de archivos y definir retención y eliminación de imágenes. Validar con capturas representativas de Stake antes de afirmar compatibilidad.

Aceptación: una captura legible genera un borrador editable; una ilegible muestra los campos faltantes y no registra datos silenciosamente.

## Etapa 6: publicación web

Completar configuración, diseño móvil, recuperación de acceso, exportación, copias de seguridad y eliminación de datos. Desplegar con HTTPS. Comprobar el recorrido completo desde cuenta y apuesta hasta liquidación y análisis.

## Decisiones pendientes

- Ligas y mercados prioritarios dentro de los tres deportes.
- Combinadas en la primera versión o en una etapa posterior.
- Moneda inicial y necesidad de varias monedas o criptomonedas.
- Presupuesto de proveedores de resultados y visión.
- Requisitos adicionales de la conversación compartida no reflejados en el código.

## Avance de implementacion: cuentas y API

Implementados autenticacion con sesiones, almacenamiento PostgreSQL por usuario, API de apuestas y conexion de las pantallas a la API. Importacion local explicita disponible en Configuracion. USDT como moneda inicial y Stake como casa predeterminada. Instancia local de desarrollo creada en el puerto 5433; no se modifico la instancia previa.

Verificacion: compilacion web y servidor; cinco pruebas automatizadas de validacion y HTTP; integracion contra PostgreSQL con dos cuentas, aislamiento de datos, CRUD, sesiones e importacion repetida. Pendientes: revision visual en navegador, recuperacion de acceso y despliegue publico. Los bloques de resultados deportivos e imagenes siguen pendientes.


Actualizacion de moneda (27 de octubre de 2026): USDT es la unica moneda admitida para nuevos registros. Los importes admiten hasta ocho decimales y se muestran con la etiqueta USDT. La API rechaza otras monedas; no se convierte USD a USDT. La importacion local requiere confirmar que los importes originales son USDT. No habia apuestas almacenadas en PostgreSQL al realizar este cambio.

## Tres bloques implementados

Registro ampliado disponible para fútbol, béisbol y baloncesto; tickets simples, combinadas y SGM con selección estructurada. Importación revisable de capturas con OCR local Windows y conexión opcional de IA. Motor de liquidación con adaptador API-Sports, tareas programadas, evidencia e idempotencia. Las claves externas no están configuradas y sus servicios reales no se han probado. Detalles, limitaciones y comprobaciones en IMPLEMENTACION.md.
