# carApp

App personal (un solo usuario) para registrar el mantenimiento de mis autos con alertas por km y por tiempo. PWA mobile-first, uso principal en Chrome Android.

La especificación completa está en `docs/` (empezá por `docs/README.md`). Antes de implementar algo, leé la fase correspondiente en `docs/04-plan-implementacion.md` y lo que cite de `docs/03-arquitectura.md` y `docs/05-pantallas.md`.

Auto real para probar: **Fiat Palio 1.4 Fire, 2011, ~120.000 km, nafta.**

## Skills del repo (`.claude/skills/`)

La fuente está en `docs/skills/`; en F00 se copian a `.claude/skills/`, que es donde Claude Code las detecta. Si editás una skill, editá las dos copias.


- `/implementar-fase F0X` — flujo completo para arrancar una fase (contexto → plan → código).
- `cerrar-fase` — checks, revisión de reglas, docs y PR.
- `nueva-coleccion` — patrón para colecciones de Mongo (esquema Zod, repo, índices).

## Stack

Next.js 16 (App Router, `src/`) · TypeScript strict · Tailwind + shadcn/ui · MongoDB Atlas con el driver oficial `mongodb` + Zod (sin ORM/ODM) · Auth.js (Google, JWT) · Cloudflare R2 · Vercel AI SDK + Anthropic · Web Push (`web-push`) · Vercel (Hobby) + Vercel Cron · Vitest.

## Ramas

`develop` es el entorno de desarrollo y `main` es producción. Toda rama nueva sale de `develop` y se mergea a `develop` por PR. A `main` solo se llega con un PR `develop` → `main`.

## Comandos

```bash
npm run dev        # desarrollo
npm test           # Vitest
npm run typecheck
npm run lint
npm run db:indexes # crea índices en Mongo
```

## Reglas del proyecto

- **Dominio puro:** `src/core` no importa nada de Next, Mongo, fetch ni `Date.now()`. La fecha "hoy" entra como parámetro. Todo cambio en `src/core` va con tests.
- **Mongo:** el único `MongoClient` vive en `src/server/db/client.ts`. Nunca crear otro. Ningún archivo que use la base declara `runtime = 'edge'`.
- **Proxy:** `src/proxy.ts` solo verifica la cookie de sesión. No consulta la base.
- **Auth en cada mutación:** cada Server Action y Route Handler llama a `requireUser()` y filtra por `ownerId`. No confiar solo en el proxy.
- **Esquemas Zod únicos:** los esquemas de `src/server/db/schemas/` validan lo que entra a la base y también la salida de la IA. No duplicar tipos a mano: usar `z.infer`.
- **IA = borrador:** nada que devuelva la IA se guarda en el historial ni afecta alertas sin confirmación del usuario (RN-11, RN-14). Toda llamada se registra en `aiRuns`.
- **Fotos fuera de Mongo:** los comprobantes van a R2; en Mongo solo la `key`.
- **Montos:** en centavos, como enteros, en ARS. **Fechas:** se guardan en UTC; se muestran en `America/Buenos_Aires`, formato dd/mm/aaaa.
- **Idioma:** código e identificadores en inglés; UI, mensajes y docs en español rioplatense.
- **Pantallas y rutas:** solo las de `docs/05-pantallas.md`. Una pantalla nueva se agrega primero ahí.
- **Diseño:** implementá cada pantalla mirando su frame en `docs/design/` (`car-app.pen` o `previews/*.png`). Colores solo con tokens (`bg-surface`, `text-text-2`…), nunca hex sueltos. Íconos con `lucide-react`, los mismos que en el diseño.
- **Alcance:** si algo no está en la fase actual, no lo implementes; anotalo en "Decisiones abiertas" de `docs/04-plan-implementacion.md`.

## Al terminar una tarea

1. `npm run typecheck && npm run lint && npm test` en verde.
2. Marcar los checkboxes completados en `docs/04-plan-implementacion.md`.
3. Si cambió una decisión de arquitectura, un requerimiento o una pantalla, actualizar `docs/03`, `docs/02` o `docs/05` en el mismo PR.
