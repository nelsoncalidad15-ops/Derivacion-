# Conectar el registro privado de Autosol

Sheet previsto: https://docs.google.com/spreadsheets/d/1aCByYYdl-2qpx4-ZFtLZty5GSGffnSS3URsAvO7gpc4/edit

## Activación inicial (cuenta propietaria de Google)

1. Abrir el Sheet → **Extensiones → Apps Script**. Copiar `Code.gs` de esta carpeta al editor y guardar.
2. Ejecutar `prepararRegistro` y autorizar los permisos. Crea `Derivaciones`, `Equipo`, `Movimientos` y `Resumen` sin borrar las otras hojas. La ronda queda desactivada. Configurar la zona horaria del proyecto como Argentina.
3. Si ya existe la aplicación web, abrir **Implementar → Administrar implementaciones → Editar (lápiz) → Versión: Nueva versión → Implementar**. Así se conserva la URL `/exec` que usa la web. Configurar **Ejecutar como: Yo** y **Acceso: Cualquier persona**.
4. Publicar también la web actualizada. Usa directamente la URL de Apps Script incluida en `src/services/registrationService.ts`; no requiere clave ni configuración por tablet. Las conexiones antiguas guardadas en el navegador ya no se usan.
5. Hacer una derivación de prueba y verificar la nueva fila en **Derivaciones**. En `#configurar` se puede consultar el estado y reintentar pendientes. Las pruebas cuentan como registros.

El Sheet puede permanecer privado. El endpoint de escritura es público y no exige clave: cualquiera que conozca la URL puede enviar registros válidos. No ofrece una lectura general de la planilla. Conserva validación de datos, UUID para evitar duplicados y bloqueo para asignar números.

Si aparece un error que pide actualizar Apps Script, la URL todavía ejecuta la versión anterior que exigía clave. Guardar el código en el editor no actualiza por sí solo la implementación.

## Registro y cortes de conexión

Columnas: **Cliente | Tipo | Asesor | Reasignar: asesor ocupado | Fecha | ID | Estado | Asesor ID**.

- Tipos definitivos: `Tradicional` y `Planes`. Un empate pide al cliente elegir con qué equipo empezar.
- La numeración Cliente 1, Cliente 2… la asigna el servidor bajo un bloqueo; varias tablets comparten secuencia.
- Cada atención lleva un UUID. Los reintentos devuelven la misma fila y no la duplican.
- El navegador guarda envíos pendientes y reintenta cada 5 segundos o al volver la conexión, sin superponer envíos. Espera hasta 30 segundos por respuesta y solo elimina el pendiente al recibir confirmación válida. No borrar datos del navegador si hay pendientes.
- Si el envío falla, los registros quedan pendientes en esa tablet hasta recibir confirmación de Google Sheets. La pantalla de estado muestra pendientes y errores.
- La fecha corresponde a la finalización en la tablet. Durante cortes de red, el número sigue el orden en que el servidor recibió las atenciones.

## Ronda preparada, desactivada por defecto

Sin ronda, cada atención registra cliente y tipo; Asesor queda vacío y Estado dice `Solo área`.

Para activar más adelante:

1. Completar `Equipo`: ID único y estable, nombre, tipo (`Tradicional` o `Planes`), casillas Activo y Ocupado. Marcar Activo para quienes participen; dejar Ocupado sin marcar cuando estén disponibles.
2. Menú **Autosol → Activar ronda**. Solo asigna nuevas atenciones; las filas históricas `Solo área` no se distribuyen retrospectivamente.
3. Se elige al asesor disponible de esa área con menos asignaciones vigentes en el registro. Ante igualdad, se elige al que hace más tiempo no recibe una, luego el orden del equipo. Los recuentos son históricos: un asesor nuevo recibirá prioridad hasta equilibrarse.
4. Si no puede atender, marcar la casilla de reasignación en **Derivaciones**. El script marca al asesor como Ocupado en Equipo, busca otro de la misma área y registra el cambio en Movimientos. Esa atención cuenta solo para el asesor final.
5. Cuando quede libre, desmarcar **Ocupado** en Equipo. Vuelve a participar con prioridad según su cantidad de asignaciones. No se lo considera libre por el simple hecho de haberlo saltado.
6. Si todos están ocupados, la atención queda `Sin asesor disponible`. Al actualizar Equipo, el script intenta distribuir pendientes en orden. Recepción debe informar al cliente de los cambios posteriores; la tablet no muestra actualizaciones después de volver al inicio.

`Resumen` mide tipos y asignaciones vigentes por asesor; `Movimientos` conserva las reasignaciones. No modificar manualmente IDs ni nombres de pestañas. Las casillas de reasignación se usan de a una; los pegados masivos no disparan reasignaciones. Marcar ocupado solo afecta nuevas asignaciones; no redistribuye por sí solo las visitas ya asignadas.

## Fuentes de implementación

- Web apps: https://developers.google.com/apps-script/guides/web
- Respuestas JSON y redirecciones: https://developers.google.com/apps-script/guides/content
- Bloqueo de concurrencia: https://developers.google.com/apps-script/reference/lock/lock-service

El despliegue de Apps Script y la prueba real contra el Sheet requieren completar la activación desde la cuenta Google propietaria. Los tests locales simulan persistencia y concurrencia lógica; no sustituyen esa prueba de conexión.
