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

### Aclaraciones de diseño — bloque Hito 3 (post-commit `4d907af`)

Cuestionario del bloque Hito 3 resuelto con el usuario e **integrado en `docs/DESIGN.md`**:

- **A6** Pozos: sólidos para ambos (actúan como piso); solo el personaje vulnerable muere por contacto; el otro lo cruza sin efecto. Abismo = hueco sin piso.
- **B1** Pausa (Esc): congela todo (física, cronómetro, animaciones); en pausa solo reanudar/reiniciar/silenciar; Tab deshabilitado.
- **B2** Muerte vs. victoria en el mismo frame: gana la muerte; la victoria requiere ambos vivos al final del frame.
- **B7** Reset (R y por muerte): total (spawns, cronómetro, gemas, switches, compuertas, cristales, barreras); mantiene modo de control.
- Alfabeto confirmado: `a` abismo, `p` pozo de luz, `s` pozo de sombra.

Pendientes: bloques de los Hitos 4, 5 y 6 (compuertas, palancas, pantallas, pulido) — listados en `DESIGN.md → Decisiones de diseño`.

### Aclaraciones de diseño — bloque Hito 4 (post-commit `8ab2368`)

Cuestionario del bloque Hito 4 resuelto con el usuario e **integrado en `docs/DESIGN.md`**:

- **A5** Compuertas: sólidas durante el tween; abren **hacia arriba** (requieren tile libre arriba, validado); nunca matan — detienen el cierre si un personaje ocupa el tile destino.
- **A7** Palanca: cualquiera de los dos; alterna **por borde de contacto** (una vez al entrar; hay que salir y volver); estado permanente hasta re-alternar o reiniciar.
- **A8** Cristal oscuro / barrera de luz: pierden solidez **al instante** del contacto; los 300 ms son solo animación.
- **B9** Compuerta "injusta": si mata/aplasta o deja atrapado sin switch/palanca alcanzable para reabrir.
- **B10** Nivel 7: palancas reversibles — el orden incorrecto agrega pasos pero nunca bloquea la resolución.
- **C3** Reset de switches: confirmado por B7 (se retiró del listado de pendientes).

Pendientes: bloques de los Hitos 5 y 6 (pantallas y progreso; pulido) — listados en `DESIGN.md → Decisiones de diseño`.

### Aclaraciones de diseño — bloque Hito 5 (en working tree, sin commitear)

Cuestionario del bloque Hito 5 resuelto con el usuario e **integrado en `docs/DESIGN.md`**:

- **C2** No existe puntaje numérico: el progreso se mide por **gemas** (X/Y), **tiempo** y **estrellas**; se reemplazó "puntaje" por "gemas" donde describía el conteo.
- **M3** Menú principal sin "Jugar": directo **[Un jugador]** y **[Dos jugadores]**; elegir modo abre el selector de niveles.
- **M4** Pausa: [Reanudar (Esc)] [Reiniciar (R)] [Silencio]. Resultado: [Siguiente nivel] [Reintentar] [Volver al menú]; en el nivel 8 se omite "Siguiente".
- **M5** HUD: tiempo `mm:ss` + gemas `X/Y` + icono 1P/2P; sin estrellas en el HUD (no spoilear el objetivo de tiempo).
- **M2** Se mantienen **solo los 5 efectos** de sonido (salto, gema, botón, muerte, victoria); compuerta, palanca, cristal, barrera y puerta no se sonorizan.

### Aclaraciones de diseño — bloque Hito 6 (en working tree, sin commitear)

Cuestionario del bloque Hito 6 resuelto con el usuario e **integrado en `docs/DESIGN.md`**:

- **M6** Objetos: `src/objects/` = { Player, Door, Gate, Button, Lever, Gem, Crystal, Barrier, Hazard }.
- **M7** Paredes/pisos/pozos sólidos: **staticGroup** de Arcade generado desde `levelParser`; sin tilemap.
- **M8** Pausa = **overlay dentro de GameScene** (no existe escena Pause); `BootScene` genera las texturas con `Graphics + generateTexture`.
- **M9** `validate-levels`: se implementa el alcance completo del documento (nombre `NN.json` ignorando `test.json`, `timeTarget` > 0, grilla 17×30, alfabeto, cuentas de `L`/`U`/`l`/`u`, `entities` válidas y tile libre arriba en cada compuerta).
- **M10** Criterio de los 8 niveles: completables en **modo un jugador**; la estrella de tiempo se verifica por **cálculo de rutas**.
- **M11** Versiones fijas sin `^`: `typescript 7.0.2`, `vite 8.3.3`, `vitest 5.0.3`, `@types/node 24.19.1` (Phaser 4.2.1 ya fija).
- **C1** Duración: se mantiene "7 a 10 días" y el plan estima "8 días hábiles" dentro de ese rango.

Con este bloque quedan **resueltas todas las ambigüedades de diseño** pendientes (Hitos 2–6) en `docs/DESIGN.md → Decisiones de diseño`.

Nota Git: los bloques de los Hitos 4, 5 y 6 están **en working tree sin commitear** (pendiente de autorización).
