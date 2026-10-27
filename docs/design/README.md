# Diseño UX/UI — carApp

- **Fuente de verdad:** [`car-app.pen`](car-app.pen) (Pencil). Abrilo con Pencil para ver o editar.
- **Referencia rápida:** `previews/*.png` (capturas de cada pantalla, para leer sin Pencil).
- Si el `.pen` y una captura difieren, manda el `.pen`. Si el diseño y `05-pantallas.md` difieren en **qué** hay en una pantalla, manda `05-pantallas.md`. El diseño manda en el **cómo se ve**.

## Pantallas

| Frame | Pantalla | Ruta (05-pantallas) | Fase |
|---|---|---|---|
| 00 | Sistema de diseño: tokens, tipografía, componentes | — | F01 |
| 01 | Login | `/login` | F01 |
| 02 | Detalle del auto = Inicio con 1 auto | `/autos/[id]` | F03 → F06 |
| 03 | Hoja **Cargar** | botón ＋ | F05 |
| 04 | Hoja **Cargar km**, con error de km menor | hoja | F03 |
| 05 | Alta de auto | `/autos/nuevo` | F03 |
| 06 | Revisar plan (críticos con check) | `/autos/[id]/plan/revisar` | F04 |
| 07 | Estado inicial (wizard) | `/autos/[id]/plan/estado-inicial` | F04 |
| 08 | Registrar service | `/autos/[id]/eventos/nuevo` | F05 |
| 09 | Toast tras guardar, con deshacer | — | F05 |
| 10 | Historial | `/autos/[id]/historial` | F05 |
| 11 | Ajustes | `/ajustes` | F07 |
| 12 | Notificaciones push (alerta + recordatorio de km) | — | F07 |
| 13 | Detalle en modo oscuro | — | F01 (tokens) |

## Dirección visual

- **Concepto "tablero":** el km estimado se muestra como un odómetro (dígitos en cajas, tipografía mono). Es lo primero que se ve.
- **Barra de consumo por ítem:** cada vencimiento muestra qué parte del intervalo ya se usó. Se lee de un vistazo, sin hacer cuentas.
- **Semáforo único** en toda la app: rojo vencido · ámbar próximo · verde ok · gris sin dato.
- **Lo estimado lleva `≈`.**
- Acciones principales abajo y al alcance del pulgar (botón ＋ central, hojas inferiores).

## Tokens → Tailwind

Los colores son variables del `.pen` con modo claro/oscuro. En código van como CSS variables (`:root` y `.dark`) mapeadas en Tailwind/shadcn con los **mismos nombres**:

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#F3F4F6` | `#0D0F12` | Fondo de pantalla |
| `--surface` | `#FFFFFF` | `#16191E` | Tarjetas, campos, hojas |
| `--surface-2` | `#ECEEF2` | `#1E2229` | Pistas de barras, tabs, íconos neutros |
| `--border` | `#E2E5EA` | `#2A2F37` | Bordes 1 px |
| `--text` | `#0D0F12` | `#F2F4F7` | Texto principal |
| `--text-2` | `#5A6370` | `#9AA3AF` | Texto secundario |
| `--text-3` | `#8A93A0` | `#6B7480` | Etiquetas, placeholders |
| `--accent` | `#2F5BFF` | `#7088FF` | Acción principal, selección |
| `--accent-soft` | `#E7ECFF` | `#1C2447` | Fondos de acento |
| `--danger` / `-soft` | `#DC3B41` / `#FDECEC` | `#FF6369` / `#3A1C1F` | Vencido, errores |
| `--warn` / `-soft` | `#D97F00` / `#FFF3DD` | `#FFB224` / `#3A2A10` | Próximo, ítems críticos |
| `--ok` / `-soft` | `#23955A` / `#E4F5EA` | `#3DD68C` / `#13301F` | Al día |
| `--muted` / `-soft` | `#9AA3AF` / `#ECEEF2` | `#5F6772` / `#22262D` | Sin dato |
| `--odo` / `--odo-digit` | `#0D0F12` / `#1E2229` | `#1E2229` / `#2A2F37` | Tarjeta odómetro |

**Tipografía:** Inter (UI) y JetBrains Mono (km, montos, intervalos), ambas con `next/font/google`. Escala: título 24/700 · cuerpo 15/400 · secundario 13/400 · etiqueta 12/700 con tracking 0.8 · odómetro 34/700 mono.

**Forma:** radios de 12 (campos), 14 (botones), 16 (filas), 18–22 (tarjetas), 26 (hojas). Alto mínimo táctil: 44 px; botones de 52 px. Íconos: **lucide** (`lucide-react`), los mismos nombres que en el `.pen`.

## Componentes base (en el `.pen`, reutilizables)

`Status Bar` (solo maqueta) · `Button/Primary` · `Button/Secondary` · `Status Pill` · `Bottom Nav`. La fila de vencimiento (`Item · …`), los campos y los chips se repiten con la misma estructura en todas las pantallas: implementarlos como componentes React únicos.

## Nota

El `.pen` se generó por código siguiendo el schema oficial v2.21, y las capturas salen de un renderizador propio. Puede haber diferencias menores con lo que muestra Pencil. Si algo se ve roto al abrirlo, corregilo en Pencil y volvé a exportar las capturas.
