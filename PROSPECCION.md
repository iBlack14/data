# Recopilación de empresas

En **Empresas → Extraer de Google Maps**, indica rubro, país y al menos una subdivisión: región/departamento, provincia, ciudad o distrito. Pulsa **Extraer empresas**. Se consulta una página de hasta 20 fichas; **Obtener siguiente página** permite continuar de forma explícita hasta seis páginas. La fuente puede devolver menos resultados o incluir negocios cercanos.

El servidor lee la respuesta pública de búsqueda de Maps sin clave API, navegadores, proxies ni servicios de pago. Es un formato no oficial, por lo que Google puede cambiarlo o limitar su acceso. Si hay CAPTCHA, redirección de consentimiento, bloqueo o HTTP 429, se informa el error y se detiene esa consulta. No hay mecanismos para eludirlos.

La opción de correos consulta la página de la empresa y, cuando no encuentra ninguno, un enlace de contacto del mismo sitio. Solo conserva correos publicados; no adivina direcciones ni comprueba que el buzón pueda recibir mensajes. Los dominios y las redirecciones se validan antes de consultarlos; se rechazan destinos locales y privados. Una web que bloquea la lectura se muestra como tal sin interrumpir las demás fichas.

Selecciona resultados y usa **Guardar en Empresas**. La importación conserva ID de Maps, URL, dirección publicada, teléfono, web, fuentes de correo y fecha de extracción. No se sobrescriben fichas existentes con el mismo ID. Los permisos publicitarios quedan desactivados. La extracción no equivale a verificar que el teléfono o correo siguen atendidos: `verified` queda vacío. Las subdivisiones administrativas se copian del territorio consultado y deben revisarse contra la dirección publicada.

## Ejecución y verificación

- `npm run dev`: inicia el CRM local en el puerto 5173 con la misma base D1 local.
- `node --test tests/prospecting.test.mjs`: comprueba parsing, límites, bloqueo, correos y destinos privados sin acceder a empresas reales.
- `node node_modules/typescript/bin/tsc --noEmit`: comprobación de tipos.

Las rutas `/api/prospect/search`, `/api/prospect/enrich` y `/api/prospect/import` requieren sesión. No se necesitan secretos adicionales. En producción, la IP del alojamiento puede recibir restricciones distintas a la conexión local.

Referencia técnica del formato de respuesta: [parser público de Google Maps](https://github.com/sonagara-vashram/google-maps-scraper/blob/main/google_maps_scraper/parser.py). La implementación está acotada a las búsquedas que inicia el usuario y no usa las funciones de evasión del proyecto de referencia.
