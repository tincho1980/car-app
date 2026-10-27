# 05 · Pantallas y flujos

_Proyecto personal · Martín · v1 · 27/10/2026_

Define qué pantallas existen, qué muestra cada una y cómo se navega. El diseño visual de cada una está en [`design/`](design/README.md) (archivo Pencil + capturas). Claude Code no inventa pantallas ni rutas fuera de esta lista: si hace falta una nueva, se agrega acá primero.

## Principios de UI

- **Una mano, en el taller.** Botones grandes (mín. 44 px), acciones principales abajo, formularios cortos.
- **Km siempre con teclado numérico** (`inputMode="numeric"`) y formato `120.000`. Fechas `dd/mm/aaaa`. Montos `$ 85.000`.
- **Lo estimado se ve estimado:** todo km o fecha calculado lleva `≈` y la fecha de la última lectura real.
- **Semáforo único en toda la app:** rojo = vencido, ámbar = próximo, verde = ok, gris = desconocido / sin aprobar.
- **Un solo auto activo → Inicio muestra directamente ese auto.** La lista de autos aparece recién con 2 o más.
- Tema claro/oscuro según el sistema. Español rioplatense en todos los textos.

## Navegación

Barra inferior fija con 3 elementos: **Inicio** · **＋ Cargar** (botón central) · **Ajustes**.

`＋ Cargar` abre una hoja inferior (bottom sheet) con: **Cargar km** · **Registrar service / trabajo** · **Cargar con foto del ticket** (desde F09). Si hay más de un auto, primero pide elegir cuál.

## Rutas

| Ruta | Pantalla | Fase |
|---|---|---|
| `/login` | Login con Google | F01 |
| `/` | Inicio (dashboard) | F06 (placeholder desde F01) |
| `/autos` | Lista de autos (activos y archivados) | F03 |
| `/autos/nuevo` | Alta de auto | F03 |
| `/autos/[id]` | Detalle del auto: vencimientos | F03 → F06 |
| `/autos/[id]/editar` | Editar datos del auto / archivar | F03 |
| `/autos/[id]/plan/revisar` | Revisar y aprobar propuesta de plan | F04 |
| `/autos/[id]/plan/estado-inicial` | Wizard "cuándo se hizo por última vez" | F04 |
| `/autos/[id]/plan` | Plan aprobado: ver, editar, agregar ítems | F04 |
| `/autos/[id]/historial` | Timeline de eventos | F05 |
| `/autos/[id]/historial/item/[itemId]` | Historial de un ítem | F05 |
| `/autos/[id]/eventos/nuevo` | Formulario de evento (acepta `?items=` y `?foto=`) | F05 / F09 |
| `/eventos/[id]` | Detalle de evento, comprobantes, editar, eliminar | F05 / F08 |
| `/autos/[id]/gastos` | Reporte de gastos | F11 |
| `/ajustes` | Notificaciones, export, cuenta | F07 / F11 |

## Pantallas

### Inicio `/`

- Con 1 auto: redirige a `/autos/[id]`.
- Con 2+: una tarjeta por auto → alias, km `≈`, semáforo general, el vencimiento más urgente ("Correa de distribución · faltan ~2.465 km").
- Aviso fijo arriba si las notificaciones están desactivadas o denegadas.

### Alta de auto `/autos/nuevo`

Campos obligatorios: marca, modelo, año, versión/motor, combustible, km actual. Opcionales (colapsados): alias, patente, fecha de compra, km/día estimado (default 40).
Al guardar → se genera la propuesta de plan → redirige a **Revisar plan**.

### Revisar plan `/autos/[id]/plan/revisar`

- Banner fijo: **"Plan sugerido — verificalo con el manual o tu taller antes de aprobar."**
- Lista de ítems agrupados por categoría. Cada fila: nombre, intervalo (`10.000 km o 12 meses`), confianza (desde F10), toggle incluir/descartar, tocar = editar en drawer.
- Ítems críticos con borde ámbar y checkbox **"Verificado con manual o taller"**.
- Desde F10: link "Fuentes" por ítem.
- Botón inferior **Aprobar plan** (deshabilitado hasta tildar los críticos incluidos) → redirige al wizard de estado inicial.

### Estado inicial `/autos/[id]/plan/estado-inicial`

Un ítem por paso: "¿Cuándo se hizo por última vez el **cambio de aceite**?" → fecha + km, o **No sé**. Botón "Saltar todos (marcar como desconocido)". Al terminar → detalle del auto.

### Detalle del auto `/autos/[id]`

- Encabezado: alias / modelo, **km ≈ 121.350**, "última lectura 120.000 el 27/10", botón **Cargar km**.
- Lista de vencimientos ordenada: vencidos → próximos → ok → desconocidos. Cada fila: ícono de categoría, nombre, estado, "faltan X km / ~Y días" o "vencido hace…", acción rápida **Ya lo hice** (abre evento con el ítem precargado).
- Pestañas: **Vencimientos** · **Historial** · **Plan** · (**Gastos** desde F11).
- Si el plan no está aprobado: estado vacío con botón "Revisar plan".

### Cargar km (hoja inferior)

Un solo campo km + fecha (hoy por defecto). Si el km es menor al último: error con opción "Cambié el tablero / odómetro".

### Formulario de evento `/autos/[id]/eventos/nuevo`

Orden de campos: tipo (chips) · ítems del plan cubiertos (multi-selección con buscador) · fecha · km · costo total · taller · repuestos (lista: descripción, marca, n.º de parte, cantidad, precio) colapsada · notas · comprobantes (F08).
Desde F09, botón arriba **Cargar con foto**: al volver de la IA, los campos detectados se marcan con un punto y los dudosos en ámbar.
Guardar → vuelve al detalle con un toast "Service registrado · próximo cambio de aceite a los 130.000 km".

### Historial `/autos/[id]/historial`

Timeline invertido agrupado por año. Cada entrada: fecha, km, tipo, ítems, costo, ícono si tiene comprobante. Filtros: tipo, ítem, rango de fechas.

### Historial de un ítem `/autos/[id]/historial/item/[itemId]`

Lista de cada vez que se hizo, con km recorridos entre cambios y promedio. Botón "Ajustar intervalo".

### Plan `/autos/[id]/plan`

Ítems aprobados con su intervalo, origen (IA / plantilla / manual) y estado. Editar en drawer, **Agregar ítem**, marcar **No aplica**. Desde F10: **Revisar plan con IA** (muestra diferencias).

### Ajustes `/ajustes`

Notificaciones (activar, estado del permiso, **Enviar prueba**) · Autos archivados · Exportar datos (F11) · Cerrar sesión.

## Flujos clave

1. **Primera vez:** Login → Alta de auto → Revisar plan → Aprobar → Estado inicial → Detalle → activar notificaciones.
2. **Service en el taller:** ＋ Cargar → Registrar service (o Foto del ticket) → confirmar → toast con el próximo vencimiento.
3. **Alerta:** push "Cambio de aceite: faltan ~800 km" → tocar abre el detalle → **Ya lo hice** (evento precargado) o **Posponer** (7 días / 500 km).
4. **Recordatorio de km:** push "¿Cuántos km tiene el Palio?" → abre la hoja de Cargar km.
