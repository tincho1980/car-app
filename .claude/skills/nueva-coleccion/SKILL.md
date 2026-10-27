---
name: nueva-coleccion
description: Patrón para agregar una colección de MongoDB al proyecto (esquema Zod, repo, índices, tests). Usar siempre que haya que crear o modificar una colección.
---

# Nueva colección de MongoDB

El modelo de cada colección está en `docs/03-arquitectura.md` §4. No inventes campos: si falta uno, agregalo primero a ese doc.

## Archivos

1. **Esquema** `src/server/db/schemas/<entidad>.ts`
   - Zod, con `ownerId` (excepto subdocumentos) y fechas como `Date`.
   - Exportá `<Entidad>Schema`, `<Entidad>InputSchema` (lo que llega del formulario, sin `_id` ni campos calculados) y los tipos con `z.infer`.
   - Montos: `z.number().int()` en centavos.
2. **Repo** `src/server/db/repos/<entidades>.ts`
   - `import 'server-only'`. Usa `db` de `src/server/db/client.ts`; nunca crea un cliente.
   - Toda función recibe `ownerId` y lo incluye en el filtro.
   - Valida con Zod antes de escribir. Convierte `_id` a string al devolver.
3. **Índices** en `scripts/db-indexes.ts` (los que pide la tabla del §4). Correr `npm run db:indexes`.
4. **Server Actions** en `src/server/actions/<entidades>.ts`: `requireUser()` primero, después validación, después repo, después `revalidatePath`.

## Tests

- Esquema: casos válidos e inválidos (km negativo, monto con decimales, fecha faltante).
- Si la colección dispara recálculos (eventos, lecturas, plan), testeá esa lógica en `src/core`, no en el repo.
