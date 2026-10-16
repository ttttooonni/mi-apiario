# Auditoría de seguridad y protección de datos — Mi Apiario

Fecha: 2026-10-14
Rama: `audit/security-data-protection`

## Alcance y límites

Revisión estática inicial de persistencia, migración, copias JSON y CI. No es una auditoría de penetración ni certifica seguridad total. No se han leído ni modificado datos reales de apicultores.

## Hallazgos priorizados

### P1 — Restauración y recuperación previa

En `src/lib/apiary/idb.ts`, `restoreFromBackup` intenta guardar el estado actual en `localStorage` bajo `PRE_RESTORE_KEY`, pero captura e ignora el error. Ese snapshot auxiliar puede no estar disponible para una recuperación manual. Importante: `writeWholeState` ejecuta los borrados y escrituras en una única transacción IndexedDB, que debe ser atómica; no se ha demostrado pérdida parcial por fallo de esa transacción. Verificar este comportamiento con pruebas y definir cómo recuperar el estado previo si la importación termina correctamente pero el usuario necesita deshacerla. Considerar cuota, datos grandes y navegadores que bloquean almacenamiento.

### P1 — Validación de copias antiguas

En `src/lib/apiary/backup.ts`, las colecciones `health`, `yearCloses`, `tasks` y `losses` tienen valores por defecto vacíos si faltan. Esto ayuda a compatibilidad, pero también puede convertir una copia incompleta en una restauración aparentemente válida. Distinguir explícitamente formatos/versiones antiguas admitidas de copias actuales incompletas y advertir antes de reemplazar datos.

### P2 — Cobertura de pruebas de migración

Existe `src/lib/apiary/migration.test.ts`, pero el comando de pruebas de `package.json` no la incluye explícitamente. La validación debe ejecutar estas pruebas junto a las de inventario para detectar regresiones de conservación.

### P2 — Cadena de suministro

El flujo de validación usa `npm install --no-audit`. Evaluar `npm ci` con lockfile y una auditoría de dependencias separada, sin bloquear la corrección por vulnerabilidades irrelevantes o falsos positivos sin revisión.

## Controles no negociables

- No borrar, reinicializar ni sobrescribir datos como arreglo rápido.
- No cambiar esquemas sin migración compatible y pruebas.
- No restaurar una copia si no se ha validado su estructura y la recuperación del estado actual.
- No publicar cambios de persistencia sin pruebas automatizadas y revisión de la ejecución CI.
- No declarar un control verificado si solo se ha revisado estáticamente.

## Próximos pasos

1. Añadir cobertura de pruebas de migración a CI.
2. Corregir la restauración para que la copia previa sea un requisito verificable.
3. Separar la validación de versiones antiguas de la validación estricta de copias actuales.
4. Revisar dependencias con lockfile y reporte de vulnerabilidades.
5. Ejecutar pruebas y build; publicar únicamente tras revisar resultados.
