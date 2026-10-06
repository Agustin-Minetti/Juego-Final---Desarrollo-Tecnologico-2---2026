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
- La forma exacta del JSON de nivel (`grid` de strings) es un supuesto a confirmar en el Hito 2 con `levelParser`.
- Playwright opcional no instalado (chequeo visual fuera de alcance acordado).
