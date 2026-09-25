# Autosol · Recepción comercial

Aplicación de orientación comercial para Autosol Volkswagen: venta directa, planes de ahorro y un cuestionario breve. Incluye configuración opcional desde Google Sheets.

## Desarrollo

Requiere Node.js 22.

```sh
npm ci
npm run dev
```

## Verificación

```sh
npm run lint
npm run build
```

Cada push a `main` publica el sitio en https://nelsoncalidad15-ops.github.io/Derivacion-/ mediante GitHub Actions.

La identidad visual utiliza el logo y la fotografía de Autosol proporcionados por la empresa. `public/favicon.svg` contiene el ícono de la aplicación.

## Recepción y registro

- Cabecera compacta, sin configuración en el recorrido del cliente.
- Cierre con área de atención, agradecimiento y retorno automático a los 20 segundos.
- Las respuestas empatadas piden una elección final: no se registra un tipo mixto.
- Registro directo mediante Apps Script, sin clave por tablet, con UUID, confirmación de escritura y reintentos.
- Ronda inmediata en la tablet de recepción: orden por área, disponibilidad, rederivación y excepción de jefatura. Sheets recibe el registro en segundo plano.

La ronda se conserva en el navegador (`localStorage`). Debe operarse desde la misma tablet o PC de recepción para mantener un único orden. El botón **Ver ronda** permite cargar el equipo y marcar quién está ocupado; el resultado informa el asesor al cliente sin esperar a Google Sheets.

El equipo comercial de Tradicional y Planes está precargado en el código. Jefes y personal de Recepción no participan de la rotación automática. Desde **Ver ronda** se pueden agregar, eliminar o cambiar temporalmente la disponibilidad de los integrantes.

El selector de sucursal mantiene rondas independientes para **Jujuy** y **Salta**. Jujuy incluye el equipo inicial; Salta comienza vacío. El orden se modifica arrastrando asesores o con las flechas disponibles para pantallas táctiles.

La web usa la URL de Apps Script predefinida, sin vinculación por tablet. Requiere actualizar la implementación de Apps Script y publicar la web para activar el envío sin clave. Ver [activación y funcionamiento](apps-script/README.md).

```sh
npm test
npx playwright install chromium
npm run test:ui
```

Las pruebas incluyen lógica de derivación, registro sin duplicados y tamaños de tablet/celular. GitHub Actions ejecuta la lógica y la compilación antes de publicar.
