# 04 · Plan de desarrollo por fases

_Proyecto personal · Martín · v2 · 27/10/2026_

Plan paso a paso para construir la app con Claude Code. Cada fase es un **corte vertical deployable**: al cerrarla, la app funciona (con menos cosas) y está en producción.

## Cómo trabajamos

1. **Una fase = una rama = un PR** (`feat/f03-vehiculos`). La rama sale de `develop` y el PR va contra `develop`. No se arranca la siguiente sin mergear la anterior.
   - **Ramas:** `develop` es el entorno de desarrollo; `main` es producción. A `main` solo se llega con un PR `develop` → `main`; nunca se abre una rama ni un PR directo contra `main`.
2. En Claude Code: `/implementar-fase F03` (skill del repo; para la **F00**, que es la que las instala, pedí: _"Leé docs/skills/implementar-fase/SKILL.md y seguilo para la F00"_). Arranca en **plan mode**: lee la fase, propone un plan, y recién con tu OK escribe código.
3. Antes de cada fase, hacé vos las tareas marcadas **👤 Vos**: cuentas, claves, decisiones. Claude Code no las puede hacer.
4. Cada fase cierra cuando se cumple **Listo cuando** y pasaste por **Cómo lo pruebo** en tu celu, sobre el deploy de preview.
5. **Cada pantalla se implementa mirando su frame en `docs/design/`** (ver tabla en `docs/design/README.md`).
6. Cambios de alcance → se anotan en [Decisiones abiertas](#decisiones-abiertas) y se actualiza `02-requerimientos.md`. Nunca "de paso" en el código.

## Mapa

| Fase | Nombre | RF | Resultado | Tamaño |
|---|---|---|---|---|
| F00 | Setup e infraestructura | RNF-01..05 | App vacía en Vercel conectada a Atlas | M |
| F01 | Auth y shell PWA | RF-01, 32 | Login con Google, app instalable | M |
| F02 | Motor de alertas | RF-16, 17, 19 | `src/core` testeado, sin UI | M |
| F03 | Vehículos y odómetro | RF-03, 04, 15 | El Palio cargado, km estimado | M |
| F04 | Plan de mantenimiento (sin IA) | RF-05 (plantilla), 06, 07, 08 | Plan aprobado con vencimientos | L |
| F05 | Eventos e historial | RF-09, 10, 11, 27, 28 | Carga manual de services | L |
| F06 | Dashboard | RF-20, 26 | Semáforo de vencimientos | S |
| F07 | Push y cron diario | RF-18, 21, 22, 23, 24 | **🎯 MVP: alertas reales en el celu** | L |
| F08 | Comprobantes en R2 | RF-13 | Fotos/PDF adjuntos | S |
| F09 | IA: lectura de tickets | RF-12 | Foto → evento pre-completado | M |
| F10 | IA: plan de mantenimiento | RF-05 (IA), 34 | Plan con fuentes y confianza | M |
| F11 | Reportes y export | RF-29, 30, 31 | Gastos, PDF de venta, backup | M |
| F12 | Extras | RF-14, 25, 33, 35 | Si sobra tiempo | — |

Tamaño: S ≈ una sesión de trabajo · M ≈ 2–3 · L ≈ 4 o más.

> **La IA entra recién en F09.** Hasta F07 la app cumple su objetivo cargando todo a mano. Si la IA falla o se apaga, nada se rompe.

### Cuentas y claves: cuándo hace falta cada una

| Servicio | Para qué | Antes de |
|---|---|---|
| GitHub | Repo + CI | F00 |
| MongoDB Atlas (M0) | Base de datos | F00 |
| Vercel (Hobby) | Deploy + Cron | F00 |
| Google Cloud Console (cliente OAuth) | Login | F01 |
| Claves VAPID (se generan con `npx web-push generate-vapid-keys`) | Push | F07 |
| Cloudflare R2 | Comprobantes | F08 |
| Anthropic API (con tope de gasto mensual) | IA | F09 |

---

## F00 · Setup e infraestructura

**Objetivo:** repo listo, deploy automático, base conectada.

👤 **Vos, antes de empezar**
- [ ] Repo vacío en GitHub (`car-app`, privado).
- [ ] Cluster Atlas M0. Usuario de base con permisos solo sobre `carapp`. Network Access `0.0.0.0/0`. Anotar la región.
- [ ] Cuenta Vercel vinculada a GitHub.

🤖 **Claude Code**
- [x] `git init` en la raíz, ramas `main` (producción) y `develop` (desarrollo), remoto de GitHub.
- [ ] Copiar `docs/skills/*` a `.claude/skills/` y versionarlas.
- [ ] Scaffold con `create-next-app` (Next.js 16, App Router, TS, `src/`, Tailwind, ESLint). **Ojo:** la carpeta ya tiene `docs/` y `CLAUDE.md`, y `create-next-app` se niega a usar una carpeta con archivos. Generarlo en una carpeta temporal y mover el contenido a la raíz sin pisar nada existente.
- [ ] TypeScript `strict`, Prettier, alias `@/`.
- [ ] shadcn/ui inicializado.
- [ ] Vitest (`npm test`) con un test de ejemplo.
- [ ] `src/env.ts`: variables de entorno validadas con Zod (el build falla si falta alguna).
- [ ] `src/server/db/client.ts` según 03-arquitectura §2.1.
- [ ] `GET /api/health` → `db.command({ ping: 1 })` → `{ ok: true }`.
- [ ] `.env.example` con todas las variables (sin valores).
- [ ] GitHub Actions: `typecheck`, `lint`, `test` en cada PR.
- [ ] Scripts: `typecheck`, `db:indexes` (vacío por ahora), `db:seed` (vacío por ahora).

👤 **Vos, al cerrar**
- [ ] Importar el repo en Vercel; región de funciones igual a la del cluster; cargar `MONGODB_URI`.

**Cómo lo pruebo:** abrir `https://<proyecto>.vercel.app/api/health` → `{ ok: true }`.
**Listo cuando:** health OK en producción y el CI pasa en un PR.

## F01 · Auth y shell PWA

**Objetivo:** solo vos podés entrar y la app se instala en el celu.

👤 **Vos, antes**
- [ ] Google Cloud Console → crear cliente OAuth (tipo Web) con callbacks `http://localhost:3000/api/auth/callback/google` y `https://<proyecto>.vercel.app/api/auth/callback/google`.
- [ ] Cargar `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_EMAIL` en `.env.local` y en Vercel.

🤖 **Claude Code**
- [ ] Auth.js, proveedor Google, sesión JWT, **sin adapter**.
- [ ] Callback `signIn` que rechaza todo email ≠ `ALLOWED_EMAIL`.
- [ ] `src/proxy.ts`: sin sesión → `/login`. No consulta la base.
- [ ] `requireUser()` en `src/server/auth.ts` (devuelve `ownerId` o lanza).
- [ ] Tokens de `docs/design/README.md` como CSS variables (claro/oscuro) mapeadas en Tailwind/shadcn; fuentes Inter y JetBrains Mono con `next/font`; `lucide-react`.
- [ ] Layout mobile-first y barra inferior según 05-pantallas y el frame 00/02 del diseño (Inicio · ＋ Cargar · Ajustes); páginas placeholder.
- [ ] `manifest.webmanifest`, íconos, `public/sw.js` mínimo registrado.

**Cómo lo pruebo:** entrar desde el Samsung con tu cuenta; probar otra cuenta Google (debe rechazarla); "Agregar a pantalla de inicio".
**Listo cuando:** login OK, otra cuenta rechazada, app instalada.

## F02 · Motor de alertas (dominio puro)

**Objetivo:** el corazón de la app, testeado antes de tener UI.

🤖 **Claude Code** (tests **primero**, después la implementación)
- [ ] Tipos en `src/core/types.ts`.
- [ ] `kmPerDay` (RN-03) · `estimatedKm` (RN-04) · `itemStatus` (RN-01, 02, 05, 06, 10 + snooze) · `vehicleStatus` (RN-09) · `shouldNotify` (RN-08).
- [ ] Tests:
  - [ ] Caso de referencia (02-requerimientos §3): correa vence ~18/12/2026, pasa a "próximo" ~26/11/2026.
  - [ ] Solo por fecha · solo por km · último realizado desconocido.
  - [ ] Pospuesto por fecha y por km.
  - [ ] Cambio de odómetro · sin lecturas · km/día = 0.
  - [ ] Borrar el evento más reciente cambia el "último realizado".
  - [ ] `shouldNotify`: sin transición no notifica; vencido re-notifica a los 7 días.

**Cómo lo pruebo:** `npm test`; leer los nombres de los tests y confirmar que reflejan las reglas.
**Listo cuando:** todo verde y `src/core` no importa nada de I/O.

## F03 · Vehículos y odómetro

🤖 **Claude Code** (usar skill `/nueva-coleccion` para cada colección)
- [ ] Colecciones `vehicles` y `odometerReadings` (esquema Zod + repo + índices).
- [ ] Server Actions: crear, editar, archivar/reactivar; registrar lectura con validación RN-07.
- [ ] Al crear: lectura inicial (`source: onboarding`); recalcular `vehicle.odometer` con `src/core`.
- [ ] Pantallas: `/autos`, `/autos/nuevo`, `/autos/[id]` (encabezado con km ≈), `/autos/[id]/editar`, hoja **Cargar km**.
- [ ] `npm run db:seed`: crea el Palio de ejemplo con lecturas, solo en desarrollo.

**Cómo lo pruebo:** dar de alta el **Fiat Palio 1.4 Fire 2011, 120.000 km**; cargar una lectura; intentar cargar un km menor (debe frenar).
**Listo cuando:** el Palio existe en producción y el km estimado avanza día a día.

## F04 · Plan de mantenimiento (sin IA)

🤖 **Claude Code**
- [ ] `src/lib/template-plan.ts` con el Anexo A de 02-requerimientos.
- [ ] Colección `planProposals`; al crear un auto se genera una propuesta desde la plantilla (generador detrás de una interfaz `PlanProposer`, para enchufar la IA en F10).
- [ ] `/autos/[id]/plan/revisar` según 05-pantallas: banner, editar/descartar, críticos con check, **Aprobar plan**.
- [ ] Al aprobar: copiar a `vehicle.plan` con `origin` y `approvedAt` (RN-14).
- [ ] `/autos/[id]/plan/estado-inicial` (RF-08).
- [ ] `/autos/[id]/plan`: editar, agregar, "no aplica" (RF-06, 07).
- [ ] Recalcular `plan[].status` en cada cambio.

👤 **Vos, durante la revisión del plan del Palio:** tener a mano el manual o el último ticket del taller. Verificar especialmente el intervalo de la **correa de distribución** del motor Fire 1.4 y cuándo se cambió por última vez.

**Cómo lo pruebo:** aprobar el plan del Palio, cargar el estado inicial real, ver los vencimientos en el detalle.
**Listo cuando:** el Palio tiene plan aprobado y cada ítem muestra su próximo vencimiento.

## F05 · Eventos e historial

🤖 **Claude Code**
- [ ] Colección `events` (montos en centavos).
- [ ] `/autos/[id]/eventos/nuevo` según 05-pantallas, con `?items=` para precargar.
- [ ] Al guardar: lectura de odómetro (`source: event`) + recálculo.
- [ ] `/eventos/[id]`: editar y eliminar con confirmación y recálculo.
- [ ] `/autos/[id]/historial` con filtros y `/autos/[id]/historial/item/[itemId]`.
- [ ] Toast con el próximo vencimiento al guardar.

**Cómo lo pruebo:** cargar el último service real del Palio; ver que el cambio de aceite se reprograma; borrarlo y ver que vuelve atrás.
**Listo cuando:** un service se carga en menos de 60 s desde el celu.

## F06 · Dashboard

🤖 **Claude Code**
- [ ] `/`: con 1 auto redirige al detalle; con 2+, tarjetas.
- [ ] Detalle: vencimientos ordenados, semáforo, "faltan X km / ~Y días", **Ya lo hice**.
- [ ] Revalidación tras cada acción (RF-20).

**Cómo lo pruebo:** abrir la app y entender en 2 segundos qué necesita el Palio.
**Listo cuando:** lo anterior, y los estados coinciden con lo que da `src/core`.

## F07 · Push y cron diario → 🎯 MVP

👤 **Vos, antes**
- [ ] Generar claves VAPID y `CRON_SECRET`; cargarlas en `.env.local` y Vercel.

🤖 **Claude Code**
- [ ] Colecciones `pushSubscriptions` y `notificationLog` (TTL 180 días).
- [ ] `public/sw.js`: `push` y `notificationclick`.
- [ ] `POST /api/push/subscribe`; UI en `/ajustes` (activar, estado, **Enviar prueba**); aviso en Inicio si está desactivado.
- [ ] `GET /api/cron/daily` con `CRON_SECRET`; `vercel.json` con `0 12 * * *`.
- [ ] Cron: recalcular → `shouldNotify` → enviar → guardar `notifiedState` (idempotente). Recordatorio de km a los 30 días. Borrar suscripciones 404/410.
- [ ] Acciones **Ya lo hice** / **Posponer** desde la notificación.

**Cómo lo pruebo:** "Enviar prueba" llega al celu; forzar un ítem a "próximo" (bajar su intervalo) y llamar al cron a mano con el secret → llega la alerta una sola vez; llamarlo de nuevo → no repite.
**Listo cuando:** llega una alerta real disparada por el cron de Vercel. **Acá la app ya cumple su objetivo.**

## F08 · Comprobantes en R2

👤 **Vos, antes:** bucket R2 privado + token de API; cargar las variables `R2_*`.

🤖 **Claude Code**
- [ ] `src/server/storage/r2.ts`; `POST /api/upload-url` con validación de tipo y tamaño.
- [ ] Compresión en el cliente (~300 KB).
- [ ] Adjuntar 0..N comprobantes al evento; ver/descargar con URL firmada corta; borrar en R2 al eliminar.

**Cómo lo pruebo:** sacar foto a un ticket desde el evento; verla después; borrar el evento y confirmar que el objeto desaparece del bucket.

## F09 · IA: lectura de tickets

👤 **Vos, antes:** clave de Anthropic con tope de gasto mensual; juntar 3–5 fotos de tickets reales del Palio.

🤖 **Claude Code**
- [ ] `src/server/ai/ticket.ts` (AI SDK + Anthropic, modelo desde `AI_MODEL_TICKET`); prompt versionado.
- [ ] Salida validada con los esquemas Zod de `events`; confianza por campo.
- [ ] `aiRuns` con `finalDiff` al confirmar.
- [ ] Botón **Cargar con foto** en el formulario; campos dudosos en ámbar.
- [ ] Fallback a carga manual con la foto adjunta.
- [ ] Tests con las fotos reales como fixtures (respuesta de IA mockeada).

**Cómo lo pruebo:** cargar los tickets reales y contar cuántos campos tuviste que corregir.

## F10 · IA: plan de mantenimiento

🤖 **Claude Code**
- [ ] `src/server/ai/plan.ts` con web search (`AI_MODEL_PLAN`) que implementa `PlanProposer`; IA primero, plantilla si falla o tarda > 30 s.
- [ ] Mostrar confianza y fuentes en **Revisar plan**.
- [ ] RF-34: **Revisar plan con IA** con diferencias; nunca pisa ítems editados a mano (RN-12).

**Cómo lo pruebo:** pedir "Revisar plan con IA" sobre el Palio y comparar con lo que verificaste en F04, sobre todo la correa.

## F11 · Reportes y export

- [ ] `/autos/[id]/gastos`: por año y categoría, costo por km (RF-29).
- [ ] PDF del historial para venta (RF-30).
- [ ] Export JSON completo desde `/ajustes` (RF-31).

## F12 · Extras (Could)

- [ ] RF-14 autocompletar talleres y repuestos · RF-25 horario y pausa de notificaciones · RF-33 carga offline · RF-35 sugerencias de ajuste desde tickets.

---

## Decisiones abiertas

| # | Tema | Estado |
|---|---|---|
| 1 | Biblioteca para el PDF de RF-30 | Decidir en F11 |
