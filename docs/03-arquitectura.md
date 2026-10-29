# 03 · Arquitectura — App de mantenimiento de autos

_Proyecto personal · Martín · v1.1 · 24/10/2026_

Deriva de 02-requerimientos.md. Restricciones de partida: base de datos MongoDB (Supabase free ya no tiene lugar), Next.js, un único usuario, costo ≈ $0/mes salvo la IA.

## 1. Decisiones (resumen)

| # | Tema | Decisión | Por qué |
|---|---|---|---|
| D-01 | Framework | Next.js 16 (App Router) + TypeScript, una sola app | Front + back + cron en un solo deploy. Monorepo o NestJS es sobre-ingeniería para 1 usuario. |
| D-02 | Base de datos | MongoDB Atlas M0 (free) | 512 MB alcanzan de sobra: sin fotos adentro, el historial de años de varios autos pesa pocos MB. |
| D-03 | Acceso a datos | Driver oficial mongodb + Zod (sin ODM) | Prisma 7 no soporta Mongo; Prisma 8 lo tiene en early access. Prisma 6 sí lo soporta, pero es una rama vieja: pasar a la 8 implicaría reescribir el acceso a datos. Mongoose suma peso y el problema de re-registrar modelos en hot reload. Para ~7 colecciones, driver + Zod alcanza y no envejece. |
| D-04 | Hosting | Vercel Hobby (uso personal, no comercial) | Deploy de Next.js nativo, Cron incluido, attachDatabasePool para Mongo. Cloudflare Workers evaluado y descartado (ver 2.4). |
| D-05 | Auth | Auth.js v5 (`next-auth@5`, beta fijada) con Google, sesión JWT, allowlist de 1 email | Sin adapter de base: la auth no toca Mongo. Nadie más puede entrar. |
| D-06 | Fotos de tickets | Cloudflare R2 (API S3, URLs prefirmadas) | 10 GB gratis y sin costo de egreso. Las fotos NUNCA van a Mongo (GridFS se comería los 512 MB). |
| D-07 | IA | Vercel AI SDK + Anthropic (Claude) | Visión + salida estructurada con esquema + web search. El SDK permite cambiar de proveedor sin reescribir (RNF-07). |
| D-08 | Push | Web Push estándar (VAPID) con web-push + service worker propio | Funciona en Chrome Android sin servicios de terceros. Sin Firebase. |
| D-09 | Job diario | Vercel Cron → Route Handler protegido | Hobby permite 1 ejecución por día con precisión ±59 min: suficiente para alertas de mantenimiento. |
| D-10 | UI | Tailwind + shadcn/ui | Rápido de armar, mobile-first, componentes de formulario y drawer listos. |

## 2. Mongo en Next.js: lo que hay que cuidar

Tres trampas concretas al usar Mongo con Next.js en Vercel, y cómo las resolvemos:

### 2.1 Conexiones en funciones serverless

Cada función de Vercel puede levantar su propio cliente. Si se crea un MongoClient por request, se agotan las 500 conexiones del M0 y cada request paga el handshake (50–100 ms o más). Solución: un solo cliente a nivel de módulo, registrado con attachDatabasePool (Vercel lo soporta para MongoDB en Fluid compute), y cacheado en globalThis en desarrollo para que el hot reload no abra un pool nuevo en cada cambio.

```ts
// src/server/db/client.ts
import 'server-only';
import { MongoClient } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';
import { env } from '@/env';

const g = globalThis as unknown as { _mongo?: MongoClient };

export const client =
  g._mongo ?? new MongoClient(env.MONGODB_URI, { maxPoolSize: 5, ignoreUndefined: true });
if (process.env.NODE_ENV !== 'production') g._mongo = client;
attachDatabasePool(client);

export const db = client.db(env.MONGODB_DB); // carapp en Vercel, carapp-dev en local
```

### 2.2 Runtime: nada de Edge

El driver de Mongo necesita Node (sockets TCP). En Next.js 16 el proxy.ts (ex middleware) ya corre en Node por defecto, pero igual: el proxy NO consulta la base, solo verifica la cookie de sesión. Las rutas que usan Mongo nunca declaran runtime = "edge". La auth con JWT (D-05) evita además el problema clásico de los adapters de base de datos en el middleware.

### 2.3 El worker del cron

- Es un Route Handler /api/cron/daily: corre en una función Node como cualquier otra, reutiliza el mismo cliente de 2.1.
- Protegido con CRON_SECRET (Vercel lo manda en el header Authorization).
- Idempotente: cada ítem guarda el último estado notificado. Si el cron corre dos veces o se reintenta, no manda push duplicados.
- Proceso secuencial por vehículo (son 1–3 autos): no hace falta cola. Con Hobby no hay cron cada hora; si más adelante se quiere, se suma un ping externo gratis (ej. cron-job.org) al mismo endpoint.
- Atlas M0 no admite IPs fijas de Vercel: hay que habilitar 0.0.0.0/0 en Network Access con un usuario de base con contraseña larga y permisos solo sobre la base carapp (o usar la integración Atlas de Vercel, que lo configura sola).
- Región: crear el cluster M0 y fijar la región de funciones de Vercel en el mismo lugar (idealmente São Paulo, si M0 la ofrece al crearlo). Si no, la misma región de EE. UU. en ambos. Lo que importa es que coincidan. Elegido: São Paulo (Atlas `sa-east-1`, Vercel `gru1`, fijado en `vercel.json`).

### 2.4 Por qué no Cloudflare Workers

- Un Worker no puede reutilizar entre requests una conexión abierta en otro ("Cannot perform I/O on behalf of a different request"): habría que conectar a Atlas en cada request (handshake TLS cada vez) o montar un Durable Object que sostenga el pool.
- Plan free con 10 ms de CPU por request y por cron: Next.js vía OpenNext + parseo BSON + TLS lo superan con facilidad → en la práctica Workers Paid (USD 5/mes).
- Next.js corre a través del adaptador OpenNext, no nativo.
- Si algún día se migra a Cloudflare, el camino razonable es cambiar Mongo por D1 (Workers + D1 + R2 + Cron Triggers), no forzar Mongo en Workers.

> El service worker de la PWA es otra cosa: corre en el navegador y no habla nunca con Mongo. Recibe push y, si se hace RF-33 (offline), guarda borradores en IndexedDB y los envía a la API al volver la conexión.

## 3. Vista general

| Capa | Pieza | Responsabilidad |
|---|---|---|
| Cliente | PWA (Next.js, Tailwind) | UI mobile-first. Comprime la foto antes de subirla (~300 KB). |
| Cliente | Service worker (public/sw.js) | Recibir push y abrir la pantalla correcta al tocar la notificación. |
| Servidor | Server Actions | Todas las mutaciones (autos, plan, eventos, lecturas). Cada una verifica sesión. |
| Servidor | Route Handlers | Cron diario, URL prefirmada de subida, suscripción push. |
| Dominio | src/core (TS puro) | Motor de alertas y cálculo de km/día. Sin imports de Next ni Mongo → testeable con Vitest (RNF-06). |
| Servicios | db / storage / ai / push | Adaptadores a Mongo, R2, Anthropic y Web Push. |
| Externos | Atlas M0 · R2 · Anthropic · Vercel Cron | — |

### Flujo: cargar un ticket (RF-12/13)

- 1. El cliente comprime la imagen y pide una URL prefirmada → la sube directo a R2 (no pasa por la función).
- 2. Server Action extractTicket(vehicleId, key) → la IA recibe la imagen + la lista de ítems del plan del auto → devuelve un JSON validado con Zod (fecha, km, taller, total, repuestos, ítems detectados, confianza por campo).
- 3. Se guarda en aiRuns y se muestra el formulario pre-completado. Nada toca el historial todavía (RN-11).
- 4. El usuario confirma → createEvent guarda el evento, la lectura de odómetro y recalcula el estado del auto.

### Flujo: plan propuesto por IA (RF-05)

- 1. Alta del auto → proposePlan(vehicleId) → modelo con web search (para buscar el plan del fabricante de esa versión) y salida estructurada: ítems, intervalos, nota, confianza y fuentes.
- 2. Se guarda como planProposal en estado borrador. Si falla o tarda > 30 s → se genera desde la plantilla genérica.
- 3. El usuario aprueba todo o edita; los ítems críticos piden check. Al aprobar, se copian al plan del vehículo y recién ahí entran al motor de alertas (RN-14).

### Flujo: job diario (RF-18, 21, 22)

- Por cada vehículo activo: recalcula km estimado y estado de cada ítem con src/core → compara con el último estado notificado → si hay transición (o pasó una semana en "vencido") envía push → guarda el nuevo estado. Si no hay lectura en 30 días, push pidiendo el odómetro. Las suscripciones que devuelven 404/410 se borran.

## 4. Modelo de datos (MongoDB)

Criterio: embeber lo que se lee siempre junto y es acotado (el plan de un auto, ~20 ítems); separar lo que crece sin límite (eventos, lecturas). Todos los documentos llevan ownerId (email) para poder sumar usuarios después sin migrar.

| Colección | Campos principales | Índices |
|---|---|---|
| vehicles | _id, ownerId, alias, make, model, year, version, fuel, plate, purchaseDate, defaultKmPerDay, archivedAt,<br>odometer: { lastKm, lastDate, kmPerDay, readingsCount },<br>plan: [PlanItem] (embebido), planApprovedAt | { ownerId, archivedAt } |
| PlanItem (sub-doc) | itemId, name, category, intervalKm?, intervalMonths?, warnKm, warnDays, critical, active, origin (ai\|template\|manual), edited, verifiedAt?, approvedAt, note?, snooze?: { untilDate?, untilKm? },<br>initialDone?: { date, km, estimated? } | null (estado inicial, RF-08: dato fuente; null = "No sé"),<br>status: { lastDone?: { date, km, eventId?, estimated? }, dueKm?, dueDate?, estDueDate?, state (ok|soon|overdue|unknown), estimated, notifiedState?, notifiedAt? } (caché)\|soon\|overdue\|unknown), estimated, notifiedState, notifiedAt } | — |
| events | _id, ownerId, vehicleId, date, km, type (service|preventivo|reparacion|neumaticos|frenos|otro), itemIds[], totalCost? (centavos), currency ("ARS"), shop, parts: [{ desc, brand, partNumber, qty, unitPrice }], notes, attachments: [{ key, mime, size }], source (manual\|ai), aiRunId?, createdAt, updatedAt | { vehicleId, date: -1 }<br>{ vehicleId, itemIds } |
| odometerReadings | _id, ownerId, vehicleId, date, km, source (onboarding\|event\|manual), eventId?, odometerReset | { vehicleId, date: -1 } |
| planProposals | _id, ownerId, vehicleId, status (draft\|approved\|discarded), origin (ai\|template), items[] (con included, verified, edited), sources[], aiRunId?, createdAt, updatedAt | { vehicleId, status } |
| aiRuns | _id, kind (ticket\|plan\|review), vehicleId, model, promptVersion, input (refs, no la imagen), output (crudo + parseado), finalDiff (qué cambió el usuario), tokens, costUsd, ms, status, createdAt | { kind, createdAt: -1 } |
| pushSubscriptions | _id, ownerId, endpoint (único), keys { p256dh, auth }, userAgent, createdAt, lastOkAt | { endpoint } único |
| notificationLog | vehicleId, itemId?, kind (state\|odometer), state, sentAt, ok | TTL 180 días sobre sentAt |

status dentro de cada PlanItem es una caché: se puede reconstruir siempre desde eventos + lecturas + plan (RN-09). Se recalcula en cada escritura y en el cron, así el dashboard lee un solo documento por auto.

## 5. Motor de alertas (src/core)

```ts
// Funciones puras, sin I/O. Fechas = día calendario como Date a las 00:00 UTC.
kmPerDay(readings, today, defaultKmPerDay): number                 // RN-03
estimatedKm(lastReading, kmPerDay, today): number                   // RN-04
virtualOdometer(readings, defaultKmPerDay): VirtualOdometer         // cambio de tablero
itemStatus(item, lastDone, estKm, kmPerDay, today): ItemStatus      // RN-01,02,05,06 + posponer
vehicleStatus({ plan, events, readings, defaultKmPerDay }, today): VehicleStatus // RN-09, RN-10
shouldNotify(prev, next, lastNotifiedAt, snoozed, today): boolean   // RN-08
```

- **Sin último realizado → estado `unknown` ("Sin dato")**: no se calcula vencimiento ni se notifica hasta cargar el dato.
- **Umbrales (RN-06):** el de km se compara con los km que faltan; el de días, con la fecha de vencimiento por tiempo.
- **Posponer** no cambia el estado: lo marca `snoozed` y `shouldNotify` devuelve `false`.
- **Cambio de odómetro:** cada lectura con `odometerReset` suma un desfase (km estimados del tablero viejo a esa fecha − km del nuevo). Todo se compara en km totales recorridos; `vehicleStatus` devuelve los km en el tablero actual.
- **Estado inicial:** cada ítem guarda `initialDone` (cuándo se hizo antes de usar la app). `vehicleStatus` toma el más reciente entre eso y los eventos. Si solo se sabe la fecha o el km, `estimateLastDone` completa el otro con las lecturas y el km/día, y lo marca como estimado.
- **Eventos:** cada evento genera su lectura de odómetro (`source: event`, `eventId`), que se edita y se borra con él; su km se valida con RN-07 contra las demás lecturas. Después de cada cambio, `recalculateVehicle` rehace el resumen del odómetro y la caché del plan.
- **Propuesta de plan:** `PlanProposer` (`src/server/plan/proposer.ts`) con `templateProposer` (Anexo A). En F10 se suma la IA detrás de la misma interfaz. Los ítems descartados al revisar se aprueban como "no aplica".
- **Notificaciones:** solo cuando el estado empeora (a próximo o vencido) y, si sigue vencido, cada 7 días.

Tests obligatorios (Vitest): el caso de referencia de 02-requerimientos (correa), ítem solo por fecha, solo por km, "desconocido", ítem pospuesto, cambio de odómetro, auto sin lecturas, km/día = 0 (auto parado), evento borrado que cambia el "último realizado".

## 6. IA

| Uso | Modelo sugerido | Entrada → Salida | Costo aprox. |
|---|---|---|---|
| Leer ticket | Claude, gama rápida (Haiku) | Imagen + ítems del plan → JSON de evento con confianza por campo | Centavos de USD por ticket |
| Proponer / revisar plan | Claude, gama media (Sonnet) + web search | Datos del auto → ítems con intervalos, confianza y fuentes | Decenas de centavos por plan (pocas veces por auto) |

- Salida estructurada siempre validada con el mismo esquema Zod que usa la base. Si no valida: un reintento y después fallback (carga manual o plantilla).
- Prompts versionados en src/server/ai/prompts/* y promptVersion guardado en aiRuns para poder comparar aciertos (RNF-08).
- Tope de gasto: límite mensual configurado en la consola de Anthropic + contador en aiRuns.

> Los modelos y precios cambian seguido: se fijan en una variable de entorno, no en el código.

## 7. Estructura del proyecto

```ts
carapp/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/
│  │  ├─ (app)/                  # dashboard, vehiculos/[id], eventos, plan, reportes
│  │  └─ api/
│  │     ├─ cron/daily/route.ts
│  │     ├─ upload-url/route.ts
│  │     └─ push/subscribe/route.ts
│  ├─ core/                      # motor de alertas (puro) + tests
│  ├─ server/
│  │  ├─ db/  (client.ts, repos/*, schemas/* con Zod)
│  │  ├─ actions/                # Server Actions
│  │  ├─ ai/  (ticket.ts, plan.ts, prompts/)
│  │  ├─ storage/r2.ts
│  │  └─ push/send.ts
│  ├─ components/
│  ├─ lib/template-plan.ts       # Anexo A de 02-requerimientos
│  └─ proxy.ts                   # solo verifica sesión, no toca la DB
├─ public/ (sw.js, manifest, íconos)
└─ vercel.json                   # cron: "0 12 * * *" (≈ 9:00 ART)
```

## 8. Seguridad

- Allowlist de email en el callback de Auth.js: cualquier otra cuenta Google es rechazada.
- Cada Server Action y Route Handler vuelve a verificar la sesión y filtra por ownerId (no se confía solo en el proxy).
- Bucket R2 privado; lectura con URLs firmadas de vida corta. Validación de tipo y tamaño antes de firmar la subida.
- Secretos solo en variables de entorno de Vercel. Usuario de Atlas con permisos únicamente sobre carapp.

## 9. Variables de entorno

`src/env.ts` las valida con Zod y `next.config.ts` lo importa, así el build falla si falta alguna. Valida solo las que la app ya usa: cada fase suma las suyas. `.env.example` lista todas. En local van en `.env.local`.

| Variable | Para qué |
|---|---|
| MONGODB_URI, MONGODB_DB | Conexión a Atlas y base: `carapp` en Vercel, `carapp-dev` en local (el seed solo corre sobre una base `-dev`) |
| AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, ALLOWED_EMAIL | Auth |
| R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET | Fotos |
| ANTHROPIC_API_KEY, AI_MODEL_TICKET, AI_MODEL_PLAN | IA |
| VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT | Push |
| CRON_SECRET | Proteger el cron |

## 10. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La IA propone un intervalo incorrecto | Alto (correa) | Confianza + fuentes + check obligatorio en críticos + aprobación (RN-14). |
| Cron Hobby impreciso o que no corre | Bajo | Idempotencia; ±1 h no importa. Log en notificationLog para detectar días sin ejecución. |
| Chrome revoca la suscripción push | Medio | Borrar suscripciones 410 y avisar en el dashboard "no estás recibiendo alertas". |
| Atlas M0 pausado por inactividad o cambios del plan free | Medio | El cron diario genera actividad; export JSON (RF-31) como backup propio. |
| Vercel Hobby es solo para uso no comercial | Bajo hoy | Si algún día se vuelve producto: Vercel Pro o mover a Railway (la app no depende de nada exclusivo salvo Cron y attachDatabasePool). |

