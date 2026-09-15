# Conectar el registro privado de Autosol

Sheet previsto: https://docs.google.com/spreadsheets/d/1aCByYYdl-2qpx4-ZFtLZty5GSGffnSS3URsAvO7gpc4/edit

## Activación inicial (cuenta propietaria de Google)

1. Abrir el Sheet → **Extensiones → Apps Script**. Copiar `Code.gs` de esta carpeta al editor y guardar.
2. Ejecutar `prepararRegistro` y autorizar los permisos. Crea `Derivaciones`, `Equipo`, `Movimientos` y `Resumen` sin borrar las otras hojas. La ronda queda desactivada. Configurar la zona horaria del proyecto como Argentina.
3. **Implementar → Nueva implementación → Aplicación web**: ejecutar como propietario, acceso **Cualquier persona**. Copiar la URL que termina en `/exec`. El Sheet debe permanecer privado. El acceso público permite llegar al script; cada escritura exige la clave de tablet validada por el servidor. No se expone ninguna lectura de filas.
4. Volver al Sheet y recargar. Menú **Autosol → Ver clave de conexión**.
5. En cada tablet abrir https://nelsoncalidad15-ops.github.io/Derivacion-/#configurar. Pegar URL y clave, guardar y volver al inicio. La clave se guarda solo en ese navegador; no se publica en GitHub ni en el código del sitio. El enlace de configuración no es una autenticación: se necesita la clave para escribir.
6. Hacer una derivación de prueba por cada área. Verificar las filas y que en la configuración queden cero envíos pendientes. Las pruebas cuentan como registros; identificarlas por su fecha antes de usarlo con clientes.

No hay que publicar el Sheet ni compartirlo con los clientes. La clave permite agregar registros, no leer ni administrar el Sheet. Para revocarla, cambiar `TABLET_KEY` en Propiedades del script y configurar nuevamente las tablets. Usar tablets controladas: quien acceda a su almacenamiento puede recuperar esta clave. No usarla como contraseña personal.

## Registro y cortes de conexión

Columnas: **Cliente | Tipo | Asesor | Reasignar: asesor ocupado | Fecha | ID | Estado | Asesor ID**.

- Tipos definitivos: `Tradicional` y `Planes`. Un empate pide al cliente elegir con qué equipo empezar.
- La numeración Cliente 1, Cliente 2… la asigna el servidor bajo un bloqueo; varias tablets comparten secuencia.
- Cada atención lleva un UUID. Los reintentos devuelven la misma fila y no la duplican.
- El navegador guarda envíos pendientes y reintenta cada 15 segundos o al volver la conexión. Solo elimina el pendiente al recibir confirmación válida. No borrar datos del navegador si hay pendientes.
- Sin URL/clave, los registros quedan en esa tablet; **no están todavía en Google Sheets**. La pantalla de configuración muestra pendientes y errores.
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
