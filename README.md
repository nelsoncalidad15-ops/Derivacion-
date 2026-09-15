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
