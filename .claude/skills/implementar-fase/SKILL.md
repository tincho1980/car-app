---
name: implementar-fase
description: Implementa una fase del plan (F00–F12) de docs/04-plan-implementacion.md. Usar cuando el usuario pida arrancar, implementar o continuar una fase.
argument-hint: "[F00-F12]"
disable-model-invocation: true
---

# Implementar fase $ARGUMENTS

## 1. Contexto (antes de tocar código)

1. Leé la sección **$ARGUMENTS** completa de `docs/04-plan-implementacion.md`.
2. Leé lo que esa fase cite: secciones de `docs/03-arquitectura.md`, reglas RN-xx de `docs/01-relevamiento.md`, RF-xx de `docs/02-requerimientos.md`, pantallas de `docs/05-pantallas.md` y sus frames en `docs/design/` (tabla en `docs/design/README.md`; mirá las capturas de `previews/`).
3. Verificá que la fase anterior esté cerrada (todos sus checkboxes marcados). Si no, frená y avisá.
4. Revisá las tareas **👤 Vos** de la fase: preguntá si ya están hechas (variables de entorno, cuentas). Si faltan, frená y listá exactamente qué falta.

## 2. Plan

- Entrá en plan mode. Proponé: archivos a crear/modificar, orden de trabajo, tests a escribir y qué queda afuera.
- Señalá cualquier contradicción entre los docs o algo que la fase no defina. No lo resuelvas por tu cuenta: preguntá.
- Esperá aprobación explícita.

## 3. Implementación

- Rama: `feat/<fase-en-minúsculas>-<slug>` (ej. `feat/f03-vehiculos`), creada desde `develop` actualizado (`git switch develop && git pull`). Nunca desde `main`.
- Respetá todas las reglas de `CLAUDE.md`.
- Commits chicos y descriptivos, en español.
- Si aparece algo fuera de alcance, anotalo en "Decisiones abiertas" del plan y seguí.

## 4. Cierre

Usá la skill `cerrar-fase`.
