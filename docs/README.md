# Documentación — carApp

App personal para llevar el historial de mantenimiento de mis autos y recibir alertas por km o por tiempo.

| Documento | Contenido |
|---|---|
| [01-relevamiento.md](01-relevamiento.md) | Contexto, actores, procesos, reglas de negocio (RN-xx), alcance y exclusiones |
| [02-requerimientos.md](02-requerimientos.md) | Requerimientos funcionales (RF-xx) y no funcionales (RNF-xx), caso de prueba del motor, plantilla de mantenimiento |
| [03-arquitectura.md](03-arquitectura.md) | Decisiones técnicas, Mongo en Vercel, flujos, modelo de datos, estructura del proyecto |
| [04-plan-implementacion.md](04-plan-implementacion.md) | Plan de desarrollo: fases F00–F12, tareas tuyas y de Claude Code, cómo probar cada una |
| [05-pantallas.md](05-pantallas.md) | Rutas, contenido de cada pantalla, navegación y flujos clave |
| [design/](design/README.md) | Diseño UX/UI en Pencil (`car-app.pen`), capturas y tokens |

Orden de lectura para implementar: 04 (qué hacer ahora) → 03 y 05 (cómo y qué se ve) → 02 y 01 (por qué y reglas).

Las skills de Claude Code están en `docs/skills/`; en F00 se copian a `.claude/skills/` (Claude Code solo las detecta ahí), y las reglas generales en `CLAUDE.md`, en la raíz.
