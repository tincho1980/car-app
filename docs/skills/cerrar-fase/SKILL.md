---
name: cerrar-fase
description: Verifica y cierra una fase del plan de desarrollo — checks, docs, checkboxes y PR. Usar al terminar de implementar una fase o cuando el usuario pida cerrarla.
argument-hint: "[F00-F12]"
---

# Cerrar fase $ARGUMENTS

1. **Checks:** `npm run typecheck && npm run lint && npm test`. Todo en verde; si algo falla, se arregla antes de seguir.
2. **Reglas de CLAUDE.md:** revisá el diff buscando:
   - `new MongoClient` fuera de `src/server/db/client.ts`;
   - `runtime = 'edge'`;
   - imports de I/O dentro de `src/core`;
   - Server Actions o Route Handlers sin `requireUser()` (salvo `/api/health` y el cron, que valida `CRON_SECRET`);
   - montos que no estén en centavos;
   - salida de IA guardada sin confirmación.
3. **Listo cuando:** confirmá uno por uno los criterios de la fase en `docs/04-plan-implementacion.md`. Lo que no puedas verificar vos (celu, deploy), listalo para que lo pruebe el usuario en **Cómo lo pruebo**.
4. **Docs:** marcá los checkboxes hechos. Si cambió una decisión o un requerimiento, actualizá `docs/02`, `docs/03` o `docs/05` en el mismo PR. Variables nuevas → `.env.example`.
5. **PR:** título `F0X · <nombre de la fase>`. En el cuerpo: qué se hizo, qué quedó afuera, qué tiene que probar el usuario y qué variables de entorno hay que cargar en Vercel.
