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
- Registro privado mediante Apps Script, con UUID, confirmación de escritura y reintentos.
- Ronda opcional por área, desactivada por defecto, con disponibilidad y recuentos por asesor.

La integración está preparada, pero requiere desplegar Apps Script y configurar cada tablet antes de enviar datos al Sheet. Ver [activación y funcionamiento](apps-script/README.md).

```sh
npm test
npx playwright install chromium
npm run test:ui
```

Las pruebas incluyen lógica de derivación, registro sin duplicados y tamaños de tablet/celular. GitHub Actions ejecuta la lógica y la compilación antes de publicar.
