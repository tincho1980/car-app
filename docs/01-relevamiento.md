# 01 · Relevamiento — App de mantenimiento de autos

_Proyecto personal · Martín · v1.2 · 27/10/2026_

## 1. Contexto

App personal para llevar el historial completo de mantenimiento de mis autos (services, preventivos, reparaciones, neumáticos, frenos, etc.), cada evento vinculado a fecha y kilometraje, con alertas automáticas cuando un ítem vence por tiempo o por km.

### Problema que resuelve

- El historial hoy está disperso (papeles, sticker del taller, memoria) → se pasan services y se pierde trazabilidad.
- Ítems de intervalo largo (correa de distribución, líquido de frenos, refrigerante) son los que más se olvidan y los más caros si fallan.
- Al vender el auto no hay un historial documentado que lo respalde.

> Vehículo inicial: **Fiat Palio 1.4 Fire, 2011, ~120.000 km** (nafta). Es el caso real para probar el plan propuesto (F04/F10) y los datos de desarrollo.

## 2. Actores y roles

| Actor | Descripción | Puede |
|---|---|---|
| Usuario (Martín) | Único usuario en v1 | Todo: autos, plan, eventos, alertas |
| IA (servicio externo) | Modelo con visión y texto | Leer tickets y proponer planes de mantenimiento. Solo propone: nunca guarda sin confirmación |
| Sistema (job diario) | Proceso programado | Recalcular estimaciones y enviar push |

Un solo usuario, sin roles ni multi-tenant ni cobro. El modelo de datos igual asocia todo a un usuario, para poder sumar otro más adelante sin migrar.

## 3. Procesos

### P1 · Alta de un auto

- Cargás marca, modelo, año, versión/motor, combustible, patente y km actual.
- La IA propone el plan de mantenimiento recomendado para ese auto (ítems, intervalo en km y/o meses, nota y nivel de confianza; ej. detecta si el motor es de cadena y no incluye correa).
- La propuesta llega marcada como "a verificar" (manual o taller). Aprobás todo o modificás/descartás ítems y después aprobás. Si la IA falla o no reconoce el modelo, se usa la plantilla genérica con el mismo flujo.
- Para cada ítem indicás cuándo se hizo por última vez (fecha/km) o "desconocido".

### P2 · Registrar un evento (en el taller, desde el celu)

- Opción A: foto del ticket/factura → la IA pre-completa fecha, km, taller, costo, ítems y repuestos → confirmás. La imagen queda guardada en el evento.
- Opción B: carga manual, sin comprobante (no siempre hay ticket). Se puede adjuntar después.
- Un evento puede cubrir varios ítems del plan (un service = aceite + filtros).
- Al guardar: se actualiza el km del auto, el promedio de uso y se recalculan todos los vencimientos.

### P3 · Actualizar odómetro

- Lectura rápida (solo km) cuando quieras, o cuando la app lo pida (cada N días).

### P4 · Recibir alerta

- Job diario evalúa cada ítem → push si pasa a "Próximo" o "Vencido" → desde la notificación: ver, registrar como hecho o posponer.

### Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Cada ítem tiene intervalo en km, en meses, o ambos. Vence lo que ocurra primero. |
| RN-02 | Próximo vencimiento = último realizado + intervalo (km y/o fecha). Sin último realizado conocido → el ítem queda "Sin dato": no tiene vencimiento ni genera alertas hasta que se carga cuándo se hizo. |
| RN-03 | Km diario promedio = (última lectura − lectura de hace ~90 días) / días entre ambas. Con menos de 2 lecturas se usa un default editable (ej. 40 km/día). |
| RN-04 | Km actual estimado = última lectura + km/día × días transcurridos. Siempre se muestra como estimado hasta que se confirma. |
| RN-05 | Fecha estimada de vencimiento por km = hoy + (km de vencimiento − km estimado) / km diario. Se compara con el vencimiento por fecha y gana la más cercana. |
| RN-06 | Estados: OK → Próximo (faltan ≤ umbral km o ≤ umbral días; default 1.000 km / 30 días, configurable por ítem) → Vencido. |
| RN-07 | El km de un evento no puede ser menor al de una lectura anterior en fecha. Excepción explícita: "cambio de odómetro/tablero". |
| RN-08 | Push solo en cambio de estado; si sigue vencido, un recordatorio semanal. Nada de spam diario. |
| RN-09 | Editar o borrar un evento recalcula todo (el "último realizado" sale siempre del historial, no se guarda a mano). |
| RN-10 | Un ítem marcado "no aplica" no genera alertas pero se conserva por si cambia. |
| RN-11 | Toda salida de la IA (datos de un ticket o plan propuesto) es un borrador: no se persiste ni afecta alertas hasta que el usuario la confirma. |
| RN-12 | Cada ítem del plan guarda su origen (IA / plantilla / manual) y si fue editado. Una nueva propuesta de la IA nunca pisa un ítem editado a mano sin confirmación explícita. |
| RN-13 | El comprobante es opcional: un evento sin foto es igual de válido. |
| RN-14 | Un plan propuesto (por IA o plantilla) no genera alertas hasta que el usuario lo aprueba. Cada ítem queda con fecha de aprobación. |

## 4. Alcance

### Entra en v1

- Autos (varios), plan de mantenimiento por auto propuesto por IA y editable, registro de eventos con costo, taller, repuestos y comprobante opcional, carga de ticket con IA, lecturas de odómetro, motor de alertas con estimación por uso, push, dashboard, historial y reporte de gastos.

### Exclusiones explícitas

- VTV, seguro, patente y vencimientos administrativos.
- Combustible / consumo.
- Otros usuarios (incluido compartir con la familia), planes, cobro, talleres como usuarios.
- App nativa en stores. Alertas por email, WhatsApp, Telegram o Calendar.
- Integración con OBD / telemetría del auto.

> Riesgo IA: los intervalos que propone un modelo de lenguaje pueden estar mal o ser de otra versión del motor, y el error más caro es justo el de la correa de distribución. Por eso: la propuesta muestra nivel de confianza, los ítems críticos (correa, líquido de frenos) piden verificación explícita contra el manual o el taller, y siempre hay plantilla genérica de respaldo.

## 5. Restricciones

- PWA mobile-first, instalable.
- Dispositivo objetivo: Android (Samsung) con Chrome. Web Push funciona sin pasos extra; iOS queda fuera de prueba en v1.
- Costo mensual objetivo ≈ $0 (planes free). La IA tiene costo por uso: centavos de dólar por ticket o por plan propuesto.
- Un único proveedor de IA (con visión) para tickets y planes.
- Datos no sensibles (patente y gastos). Igual: auth obligatoria; las fotos se guardan en storage privado.
- Stack: a definir en 03-Arquitectura.

## 6. Criterios de éxito

- Registrar un service desde el celu en menos de 30 segundos (con foto) o 60 (manual).
- Cero ítems vencidos sin aviso previo durante 6 meses de uso.
- Historial completo de cada auto exportable en un PDF presentable.

## 7. Pendientes de confirmar

| # | Pregunta | Default si no respondés |
|---|---|---|
| — | Sin pendientes | — |

Resueltos: autos → Fiat Palio 1.4 Fire 2011, ~120.000 km, nafta (sin GNC) · umbrales de aviso → 1.000 km / 30 días (confirmado) · aviso anticipado para pedir turno → lo cubre el umbral configurable por ítem.

