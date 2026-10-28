# Registro ampliado, capturas y resultados

Actualizado: 27 de octubre de 2026.

## 1. Tickets y selecciones: disponible

- Simples, combinadas de partidos y combinadas del mismo partido (SGM).
- Catálogo compartido entre cliente y servidor para fútbol, baloncesto y béisbol.
- Periodo, inclusión explícita de prórroga/entradas extra, lado, línea numérica, jugador y equipo.
- Cuotas individuales opcionales; la cuota total aceptada es la referencia, especialmente en SGM.
- Monto único por ticket en USDT con hasta ocho decimales. Pago real separado del retorno potencial.
- País y liga opcionales. Plantillas de ligas, agregación y edición de selecciones; detalle en historial.
- Los análisis cuentan tickets, no asignan el monto completo a cada selección. Una combinada de varios mercados se agrupa como combinada; una de varios deportes como varios deportes.
- ROI sobre tickets ganados o perdidos en dashboard y Analytics. Ganancia basada en pago real cuando existe, incluidas devoluciones parciales.
- Compatibilidad con los registros simples anteriores; no se reinterpreta su texto como un mercado automático.

## 2. Capturas: flujo disponible; IA externa pendiente de clave

Ruta: Nueva apuesta → Importar captura, o enlace del menú.

PNG/JPEG de hasta 6 MB. Se valida la firma del archivo y se prepara un borrador editable. Guardar requiere revisar moneda, evento, fecha, mercados e importes. Una huella por imagen/ticket evita duplicados en la misma cuenta.

### Lectura local

Funciona en este equipo con Windows OCR, sin enviar la captura a un proveedor externo. El archivo temporal se elimina al terminar. Requiere un idioma OCR instalado y dimensiones de hasta 4096 píxeles por lado. El texto reconocido puede contener errores: no se asignan importes, años, selecciones ni estados dudosos. El usuario completa el formulario comparándolo con la captura. Para varios tickets, recortar uno por imagen.

Comprobado con las imágenes suministradas: lectura de texto y borrador; la captura con dos tickets se rechaza para pedir recorte. La carga desde el navegador no pudo verificarse mediante la herramienta de automatización; el endpoint autenticado se probó con una imagen real.

### Extracción con IA

Conexión implementada mediante Responses API e imagen + JSON Schema. Configurar en `server/.env`:

```dotenv
OPENAI_API_KEY=clave_propia
OPENAI_VISION_MODEL=gpt-4.1-mini
```

Nunca usar variables VITE para las claves. El modo IA exige confirmación en la web antes de enviar la captura a OpenAI. Se solicita `store:false`; el proveedor mantiene sus propias políticas de tratamiento de datos. La aplicación no guarda el archivo de la captura. Los campos ausentes quedan vacíos y se muestran avisos. Se admiten hasta diez tickets por imagen y treinta selecciones por ticket. No se deduce el año o zona horaria cuando la captura no los muestra.

No hay clave de OpenAI configurada: la extracción con IA no se ha probado contra el servicio real ni se afirma precisión sobre capturas reales. El OCR local es una alternativa de lectura, no equivale a extracción automática estructurada.

## 3. Resultados: motor y conexión implementados; proveedor real pendiente de clave

API-Sports se conecta exclusivamente desde el servidor. Configurar una clave compartida o claves por deporte:

```dotenv
API_SPORTS_KEY=clave_propia
# API_SPORTS_FOOTBALL_KEY=...
# API_SPORTS_BASKETBALL_KEY=...
# API_SPORTS_BASEBALL_KEY=...
RESULTS_INTERVAL_MINUTES=15
RESULTS_TIMEZONE=America/Costa_Rica
```

La cobertura y cuotas dependen del plan de cada deporte. Una clave configurada no garantiza acceso a todas las ligas. No se ha contratado un plan ni consumido una API de resultados real.

En el formulario, buscar partidos por fecha y elegir el partido exacto. Activar la actualización automática para el ticket. El servidor consulta pendientes de forma programada cuando hay claves; Mis apuestas → Actualizar resultados permite una consulta manual. Hay caché de un minuto, tiempo límite, tratamiento de errores/cuotas y protección contra consultas concurrentes.

### Mercados automáticos iniciales

- Ganadores de dos o tres opciones, totales y hándicaps con datos del periodo solicitado.
- Fútbol: además doble oportunidad, empate no apuesta y ambos anotan.
- Baloncesto: partido completo, reglamentario, mitades y cuartos si el proveedor los entrega completos.
- Béisbol: primeras cinco entradas, entrada específica y partido completo. Los datos incompletos o inconsistentes y juegos acortados no se consideran suficientes para resolver el partido completo.
- Líneas enteras pueden producir nula; líneas de cuarto pueden producir media ganada o media perdida. El pago conserva el monto y devuelve la parte correspondiente.
- En SGM, una selección nula anula el conjunto. Se espera a todas las selecciones para evitar declarar perdida una SGM que pueda quedar nula. Los precios correlacionados no se recalculan multiplicando cuotas individuales.
- Una combinada con una pierna nula necesita las cuotas individuales para ajustar el precio aceptado. Si faltan, queda para revisión.

Props de jugadores, corners, tarjetas y mercados especiales se registran, pero requieren revisión manual mientras no exista un adaptador con sus estadísticas y reglas de participación. SGM con medias liquidaciones, combinaciones de grupos SGM, Stake Shield y otras promociones no se liquidan automáticamente con estas reglas iniciales. Suspendidos/cancelados no se anulan por el código de estado solamente.

La identidad incluye proveedor, deporte, identificador y equipos. Cada modificación automática conserva evidencia del marcador/periodo y datos anteriores/posteriores en `settlement_audit`. El historial de evidencia por API está limitado al propietario. Solo se procesan pendientes con consentimiento de actualización automática. Las correcciones posteriores a un ticket ya liquidado requieren revisión manual; no se promete corrección automática retroactiva.

## Validación

- Frontend y servidor compilan.
- Quince pruebas automatizadas: moneda, validación, mercados, periodos, tiempos extra, líneas de cuarto, SGM, importación e identidad del partido.
- Integración PostgreSQL: cuentas aisladas, tickets con selecciones, CRUD, duplicados de captura, importación atómica, liquidación, segunda ejecución sin duplicados y privacidad del historial de evidencia. Los resultados del proveedor en estas pruebas son fixtures sintéticos explícitos.
- Prueba del endpoint de imágenes con una captura real y OCR de Windows, sin un servicio externo.
- Navegador: registro de una combinada con prop de baloncesto + ponches de lanzador, monto USDT de ocho decimales, navegación al historial y expansión de sus selecciones.
- `npm run lint` termina sin errores; persisten avisos de React/Fast Refresh.

## Fuentes consultadas

- [Reglas oficiales de Stake](https://stake.com/es/policies/sportsbook): periodos, prórroga, nulas, participación y SGM. El ticket concreto y sus condiciones siguen siendo la referencia.
- [API-Sports Basketball](https://api-sports.io/documentation/basketball/basketball-v1.yaml), [Baseball](https://api-sports.io/documentation/baseball/v1) y [API-Football](https://www.api-football.com/documentation-v3): endpoints, estados y estructura de marcadores.
- [OpenAI: imágenes y visión](https://developers.openai.com/api/docs/guides/images-vision) y [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs): integración de lectura de imágenes.


## Mejora de lectura local por filas

El OCR ahora devuelve las palabras con sus rectángulos. El servidor reconstruye filas por alineación vertical y ordena cada fila de izquierda a derecha; los datos de la columna derecha dejan de acumularse al final del texto. Las imágenes pequeñas se amplían hasta tres veces, respetando el límite del OCR. Para capturas oscuras se prepara una copia temporal con contraste invertido; la captura original no cambia.

La unión de fragmentos decimales y la distinción O/0 e I/1 se restringen a la columna de valores en filas de importes etiquetadas. Nunca se corrigen nombres de equipos por diccionario ni se inventan cifras ausentes. Sigue siendo necesaria la revisión: escudos e iconos pueden aparecer como caracteres y algunas palabras pueden reconocerse mal.

Comprobado con la captura Torino–Como: nombres, marcadores y filas `Cuotas 2,45`, `Apuesta 1.00000000`, `Pago 2.45000000` quedan en su orden visual. La captura simple también se procesó con el flujo completo de lectura local. Se añadieron cuatro pruebas específicas de reconstrucción de filas (19 pruebas en total). La página de importación carga sus estilos explícitamente.

Referencia técnica: [BitmapDecoder.GetSoftwareBitmapAsync de Microsoft](https://learn.microsoft.com/en-us/uwp/api/windows.graphics.imaging.bitmapdecoder.getsoftwarebitmapasync).
