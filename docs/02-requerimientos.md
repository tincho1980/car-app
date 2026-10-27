# 02 · Requerimientos funcionales — App de mantenimiento de autos

_Proyecto personal · Martín · v1.1 · 24/10/2026_

Derivado de 01-relevamiento.md. Prioridades MoSCoW: Must = MVP, Should = v1 completa, Could = si sobra tiempo, Won’t = fuera de v1. Los IDs se mantienen estables entre versiones (los nuevos van al final). Actor por defecto: Usuario; "Sistema" cuando es automático. Las reglas RN-xx están definidas en el relevamiento.

## 1. Requerimientos funcionales

### M1 · Acceso y garage

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-01 | Login con Google o magic link por email. | Sin contraseña propia. Sesión persistente en la PWA (no pide login cada vez). | Must |
| RF-02 | Compartir autos con otro usuario (ej. familia). | Fuera de v1: único usuario. El modelo de datos lo deja preparado. | Won't |

### M2 · Vehículos

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-03 | ABM de vehículo: alias, marca, modelo, año, versión/motor, combustible, patente, km actual, fecha de compra, km/día default. | Obligatorios: marca, modelo, año, versión/motor, combustible y km (son el input de la IA en RF-05). Al crearlo se registra la primera lectura de odómetro. | Must |
| RF-04 | Archivar vehículo (vendido/baja) conservando historial. | No genera alertas; aparece en "Archivados"; se puede reactivar. | Should |

### M3 · Plan de mantenimiento

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-05 | Al crear un vehículo, la IA propone su plan de mantenimiento a partir de marca, modelo, año, versión/motor, combustible y km. | Devuelve ítems con intervalo km y/o meses, nota y confianza (alta/media/baja). La propuesta se muestra con aviso visible: "Sugerido por IA — verificalo con el manual o tu taller". El usuario puede aprobar todo, o modificar/descartar ítems y luego aprobar. Ítems críticos (correa, líquido de frenos) resaltados y con check de verificado. Mientras el plan no esté aprobado, no genera alertas (RN-14). Si la IA falla o tarda > 30 s → plantilla genérica (Anexo A), con el mismo flujo de aprobación. El plan es por vehículo. | Must |
| RF-06 | Editar ítem: nombre, categoría, intervalo km, intervalo meses, umbral de aviso, activo / no aplica. | Al menos uno de los dos intervalos es obligatorio. Guardar recalcula vencimientos (RN-09). | Must |
| RF-07 | Agregar ítems personalizados. | Se comportan igual que los propuestos (origen = manual, RN-12). | Must |
| RF-08 | Estado inicial por ítem: último realizado (fecha/km) o "desconocido". | Wizard post-alta recorre los ítems activos; "desconocido" aplica RN-02 y marca el vencimiento como estimado. | Must |

### M4 · Eventos (historial)

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-09 | Registrar evento: fecha, km, tipo (service, preventivo, reparación, neumáticos, frenos, otro), ítems del plan cubiertos (0..N), costo total, taller, repuestos (descripción, marca, nº de parte, cantidad, precio), notas. | Fecha default hoy, km default = km estimado. Un evento sin ítems del plan es válido (reparación imprevista). Guardar dispara RF-15 y recálculo. | Must |
| RF-10 | Editar y eliminar evento. | Recalcula vencimientos y promedio de uso. Eliminar pide confirmación. | Must |
| RF-11 | Validación de km (RN-07). | Bloquea km menor a una lectura anterior salvo marcar "cambio de odómetro". | Must |
| RF-12 | Carga por foto de ticket/factura con IA. | Sacás/subís foto → en < 15 s se pre-completa el formulario de RF-09 con lo detectado y se mapean los trabajos a ítems del plan; campos dudosos resaltados; nada se guarda sin confirmación (RN-11). Si falla, cae a carga manual con la foto adjunta. | Must |
| RF-13 | Adjuntar comprobantes (0..N fotos/PDF) al evento. | Opcional (RN-13): un evento sin comprobante es válido y se puede adjuntar después. Las fotos de RF-12 quedan guardadas automáticamente. Visible y descargable desde el detalle. | Must |
| RF-14 | Autocompletar talleres y repuestos ya usados. | Sugiere mientras escribís; sin ABM aparte. | Could |

### M5 · Kilometraje

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-15 | Lectura rápida de odómetro (solo km + fecha). | Accesible en 1 toque desde el dashboard del auto. | Must |
| RF-16 | Calcular km/día promedio (RN-03). | Se recalcula con cada lectura o evento. Visible en el auto. | Must |
| RF-17 | Mostrar km actual estimado (RN-04). | Rotulado "≈ estimado" con fecha de la última lectura real. | Must |
| RF-18 | Sistema pide confirmar odómetro si pasaron N días (default 30) sin lectura. | Push con acceso directo a RF-15. | Should |

### M6 · Motor de alertas

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-19 | Sistema calcula por ítem: vencimiento por km, por fecha, fecha estimada por km (RN-05) y estado (RN-06). | Ejemplo de test en sección 3. Sin intervalo km → solo fecha, y viceversa. | Must |
| RF-20 | Recálculo en cada alta/edición/baja de evento, lectura o cambio del plan. | El dashboard refleja el cambio sin recargar. | Must |
| RF-21 | Job diario (Sistema) re-evalúa estados con el km estimado del día y envía push. | Corre 1 vez/día en horario fijo (default 9:00 ART). | Must |
| RF-22 | Anti-spam (RN-08). | Una push por transición OK→Próximo y Próximo→Vencido; recordatorio semanal mientras siga vencido. | Must |
| RF-23 | Acciones desde la alerta: "Ya lo hice" (abre RF-09 con el ítem precargado) y "Posponer" (X días o X km). | Posponer no modifica el plan, solo silencia hasta esa fecha/km. | Should |

### M7 · Notificaciones push

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-24 | Suscripción push por dispositivo (Web Push). | Probado en Android/Chrome (Samsung). Pide permiso en el primer uso; si se deniega, el dashboard avisa que no habrá alertas. | Must |
| RF-25 | Preferencias: horario de envío, pausar notificaciones. | — | Could |

### M8 · Consultas y reportes

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-26 | Dashboard: lista de autos con km estimado y semáforo; por auto, próximos vencimientos ordenados por urgencia. | Lo vencido arriba en rojo, próximo en amarillo, con "faltan X km / ~Y días". | Must |
| RF-27 | Historial del auto en timeline, filtrable por tipo, ítem y rango de fechas. | Cada entrada muestra fecha, km, tipo, ítems, costo. | Must |
| RF-28 | Historial por ítem: cada vez que se hizo, km entre cambios. | Ej.: pastillas → 3 cambios, cada ~32.000 km. Sirve para ajustar el intervalo real. | Should |
| RF-29 | Reporte de gastos por auto / año / categoría y costo por km. | Montos en ARS, sin conversión. | Should |
| RF-30 | Exportar historial del auto a PDF (para venta). | Incluye datos del auto, timeline y totales. | Could |
| RF-31 | Backup/export de todos los datos a CSV/JSON. | Un botón; descarga completa. | Should |

### M9 · Transversal

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-32 | PWA instalable, mobile-first. | Lighthouse PWA OK; usable con una mano en 360 px. | Must |
| RF-33 | Carga offline: eventos/lecturas sin señal se encolan y sincronizan al volver. | Indicador de "pendiente de sincronizar". | Could |

### M10 · Asistente IA (nuevo v1.1)

| ID | Requerimiento | Criterio de aceptación | Prio |
|---|---|---|---|
| RF-34 | Revisar el plan con IA a demanda (ej. cambió el uso del auto o querés una segunda opinión). | Muestra diferencias contra el plan actual (agrega / cambia intervalo / quita). No pisa ítems editados a mano sin confirmación (RN-12). | Should |
| RF-35 | Al leer un ticket, la IA sugiere ajustes al plan si detecta algo relevante: un insumo que cambia el intervalo (aceite sintético, bujías de iridio) o un trabajo que no está en el plan. | Sugerencia aparte del evento, aceptable o descartable. No bloquea guardar el evento. | Could |

## 2. Requerimientos no funcionales

| ID | Requerimiento |
|---|---|
| RNF-01 | Costo de infraestructura ≈ $0/mes con un usuario (excluye IA: centavos por ticket o plan). |
| RNF-02 | Seguridad: auth obligatoria; datos y fotos asociados al usuario (aislamiento en base y storage privado). |
| RNF-03 | Backups automáticos de la base (los provee el hosting) + export manual RF-31. |
| RNF-04 | Primera carga < 3 s en 4G; acciones < 500 ms. |
| RNF-05 | Unidades: km, ARS, fechas dd/mm/aaaa, zona horaria America/Buenos_Aires. |
| RNF-06 | El motor de alertas es lógica pura testeable (función sin dependencias), con tests unitarios de los casos borde. |
| RNF-07 | IA detrás de un servicio propio (un proveedor, intercambiable). Respuestas en JSON validado con esquema; si no valida, se trata como fallo y se usa el fallback. |
| RNF-08 | Se registran prompt, respuesta y lo que el usuario terminó confirmando, para medir qué tan seguido acierta la IA y mejorar el prompt. |

## 3. Caso de prueba de referencia (motor de alertas)

Correa de distribución: intervalo 60.000 km o 48 meses, umbral 1.000 km / 30 días. Último cambio: 10/03/2023 a 82.000 km. Hoy: 24/10/2026. Última lectura: 138.500 km el 01/10/2026. Promedio: 45 km/día.

- Vencimiento por km: 142.000 km. Km estimado hoy: 138.500 + 45 × 23 = 139.535 → faltan 2.465 km → ~55 días → ~18/12/2026.
- Vencimiento por fecha: 10/03/2027.
- Gana el km (más cercano): vence ~18/12/2026. Estado: OK. Pasa a "Próximo" cuando falten ≤ 1.000 km (en ~33 días, hacia el 26/11/2026) → push.

> Esto es exactamente lo que hoy se olvida: por fecha parecería que falta medio año; por uso, faltan menos de dos meses.

## Anexo A · Plantilla genérica de respaldo

Se usa solo si la IA falla o no reconoce el modelo (RF-05). También sirve de lista mínima: la propuesta de la IA debería cubrir al menos estas categorías. Valores orientativos; no reemplazan el manual.

| Ítem | Categoría | Km | Meses | Nota |
|---|---|---|---|---|
| Aceite y filtro de aceite | Service | 10.000 | 12 | Sintético puede ir a 15.000 |
| Filtro de aire | Service | 20.000 | 24 |  |
| Filtro de habitáculo | Service | 15.000 | 12 |  |
| Filtro de combustible | Service | 40.000 | 48 | Diésel: bastante menos |
| Bujías | Encendido | 30.000 | 36 | Solo nafta; iridio ~60.000 |
| Correa de distribución (+ tensor/bomba) | Motor | 60.000 | 48 | Muy variable; "no aplica" si es cadena |
| Correa de accesorios | Motor | 60.000 | 48 |  |
| Líquido refrigerante | Motor | 40.000 | 24 |  |
| Líquido de frenos | Frenos | — | 24 | Solo por tiempo |
| Pastillas de freno (revisión) | Frenos | 20.000 | — | Revisión; cambio según desgaste |
| Discos de freno (revisión) | Frenos | 60.000 | — |  |
| Rotación de cubiertas | Neumáticos | 10.000 | — |  |
| Alineación y balanceo | Neumáticos | 10.000 | 12 |  |
| Cubiertas (reemplazo) | Neumáticos | 50.000 | 60 | Revisar dibujo y antigüedad |
| Aceite de caja | Transmisión | 60.000 | — | Muchas cajas "de por vida": revisar manual |
| Batería (revisión) | Eléctrico | — | 36 |  |
| Amortiguadores (revisión) | Suspensión | 60.000 | — |  |

