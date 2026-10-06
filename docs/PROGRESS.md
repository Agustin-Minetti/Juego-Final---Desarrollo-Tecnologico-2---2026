# PROGRESS.md — Lumo y Umbra

Estado del avance por hito. Lo actualiza el agente al cerrar cada tarea.

## Estado general

| Hito | Estado | Notas |
| --- | --- | --- |
| 1. Esqueleto | en curso | Chequeo previo de infraestructura realizado |
| 2. Movimiento | pendiente | |
| 3. Peligros y puertas | pendiente | |
| 4. Botones y elementos | pendiente | |
| 5. Pantallas y progreso | pendiente | |
| 6. Pulido y nivel final | pendiente | |

## Hito 1: Esqueleto

### Chequeo previo de infraestructura (rama `feature/hito-1-esqueleto`)

Hecho:

- Scaffold con Vite 8.3.3 + TypeScript 7.0.2 (`strict`) + Vitest 5.0.3; Phaser **4.2.1 fijada sin `^`**.
- Scripts de package.json: `dev`, `build`, `preview`, `test`, `typecheck`, `validate-levels`.
- Estructura de carpetas de la sección *Arquitectura* de DESIGN.md.
- Escenas `Boot` y `Game` (Game muestra el texto "Lumo y Umbra"); config 960 × 544 con `Scale.FIT`.
- Constantes iniciales en `src/config/` (física, colores, teclas, grilla).
- Stubs de `src/logic/` (sin Phaser) a la espera de los hitos 2-5.
- `scripts/validate-levels.ts`: valida nombre `NN.json` y grilla 17×30; pasa con 0 niveles; detecta errores (probado con JSON inválido, exit 1).
- Test de ejemplo `tests/config.test.ts` (parámetros del GDD).
- `docs/DESIGN.md` (versión Markdown del `.docx`, referencia canónica).
- `docs/phaser-skills/`: 28 skills copiadas del repo oficial `phaserjs/phaser`.
- `opencode.json` con `instructions`: DESIGN.md y PROGRESS.md.

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | en verde |
| `npm test` | 2/2 tests en verde |
| `npm run validate-levels` | en verde (sin niveles aún) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser) |
| `npm run dev` | OK: responde 200, HTML y `main.ts` transformado |

Pendiente humano:

- [ ] Abrir `npm run dev` en el navegador y confirmar que se ve "Lumo y Umbra" en 960 × 544 escalada.

Pendientes conocidos:

- `levels/` vacío (niveles desde el Hito 3); `src/objects/` y `src/fx/` con placeholder (desde Hito 2).
- Playwright opcional no instalado (chequeo visual fuera de alcance acordado).

### Aclaraciones de diseño — bloque Hito 2 (rama `feature/hito-1-esqueleto`)

Análisis de ambigüedades del documento de diseño (`.docx` + `DESIGN.md`) y cuestionario al usuario. El bloque del Hito 2 quedó resuelto y **integrado en `docs/DESIGN.md`**:

- Formato JSON de nivel: `timeTarget` + `grid` de 1 carácter (alfabeto fijo) + `entities` para botones/palancas/compuertas con `id`.
- Movimiento: aceleración/desaceleración 2400 px/s²; salto variable con corte `velocityY ×= 0.5` solo al subir.
- Hitbox 24 × 40 px; sin colisión entre personajes; inactivo con Tab quieto pero con física activa.
- Criterio "encima/pisar": contacto cara inferior del personaje con la cara superior del elemento.
- Paleta hex confirmada (ya estaba en `colors.ts`); gema dorada = Lumo, violeta = Umbra.
- Nueva sección `DESIGN.md` → *Decisiones de diseño*: registro de lo resueltí y del pendiente por hito (3 a 6).

Verificación: solo documentación; no se tocó código ni tests. Pendiente humano: revisar el `DESIGN.md` actualizado. Pendiente del agente: cuestionario de los bloques Hito 3+ (aún sin resolver: pozos, pausa, compuertas, palancas, pantallas, etc.).
