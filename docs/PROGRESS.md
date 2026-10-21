# PROGRESS.md — Lumo y Umbra

Estado del avance por hito. Lo actualiza el agente al cerrar cada tarea.

## Estado general

| Hito | Estado | Notas |
| --- | --- | --- |
| 1. Esqueleto | completado | Mergeado en `main` (PR #2); pendiente solo el chequeo manual humano original |
| 2. Movimiento | en curso | Pasos 1-3 hechos en `feature/hito-2-movimiento` (`levelParser`, jugadores + `test.json`, Tab + debug); Hito 2 listo salvo prueba manual humana |
| 3. Peligros y puertas | completado | `rules.ts` + tests, pozos/abismo/puertas, muerte con reinicio, R y debug 1-8, `levels/01-03.json`; en `feature/hito-3-peligros-puertas`, listo salvo prueba manual humana |
| 4. Botones y elementos | completado | Commit `2882077` en `feature/hito-4-botones-elementos` (push); listo salvo prueba manual humana |
| 5. Pantallas y progreso | completado | Commit `5557f18` (escenas Menu/LevelSelect/Result, HUD, pausa y progreso); listo salvo prueba manual humana |
| 6. Pulido y nivel final | en curso | Juice, SFX por código, nivel `08` y build; en `feature/hito-6-pulido-nivel-final`; listo salvo prueba manual humana |
| v2. Rediseño visual y de niveles | listo salvo prueba manual (incluye v2.1: personajes chicos, atajos, botón de menú) | Arte nuevo (Canvas 2D, sol/luna), 8 niveles rediseñados, `hints`, `solve-levels`; cambios en el working tree, **sin commitear** (ver sección al final) |

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

## Hito 2: Movimiento

### Paso 1 — `levelParser` + tests (commit `428520a`, mergeado en `main` vía PR #3)

- `src/logic/levelParser.ts`: `validateLevel` + `parseLevel` (grilla → spawns, puertas, gemas, hazards, tiles estáticos, cristales, barreras) con tests en `tests/parseLevel.test.ts`.

### Paso 2 — Jugadores jugables + `levels/test.json` (rama `feature/hito-2-movimiento`)

Hecho:

- `src/config/physics.ts`: nueva constante `JUMP_CUT_FACTOR = 0.5` (salto variable) con aserción en `tests/config.test.ts`.
- `src/config/textures.ts` (nuevo): claves de textura compartidas (`wall`, `lumo`, `umbra`).
- `src/scenes/BootScene.ts`: mockups por código (`Graphics + generateTexture`) — tile de pared 32×32, Lumo (círculo amarillo + halo) y Umbra (figura violeta con contorno), colores de `config/colors.ts`.
- `src/main.ts`: gravedad del mundo a `GRAVITY` (1200 px/s²).
- `src/logic/movement.ts` (nuevo, sin Phaser): lógica pura del salto (`createJumpState` + `updateJump`) con coyote time (100 ms), jump buffer (100 ms) y corte de salto variable (una vez por salto); tests en `tests/movement.test.ts` (10 tests).
- `src/objects/Player.ts` (nuevo): extiende `Phaser.Physics.Arcade.Sprite`; hitbox 24×40 centrada, `collideWorldBounds`, arrastre 2400 px/s² y `maxVelocity.x = 200` (aceleración/desaceleración del GDD vía Arcade), salto -480 con corte ×0.5; input por teclas propias (A/D/W y ←/→/↑).
- `levels/test.json`: nivel de prueba válido (fuera de la progresión) con suelo, plataformas a 3 alturas distintas, spawns, puertas y `timeTarget: 60`.
- `src/scenes/GameScene.ts`: carga `test.json` con import `?raw`, `parseLevel`, `staticGroup` de paredes, marcadores visuales de puertas (sin lógica), crea los dos `Player` y sus colliders (**sin** colisión entre personajes, decisión B3), `update()` por frame.
- `tests/testLevel.test.ts`: `levels/test.json` parsea y tiene plataformas a distintas alturas.

Bug detectado y corregido por los tests: el estado inicial de `bufferUntil` era `0` y con `now <= bufferUntil` el frame `now = 0` disparaba un salto espurio; ahora usa `Number.NEGATIVE_INFINITY`.

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | en verde |
| `npm test` | 35/35 tests en verde (5 archivos) |
| `npm run validate-levels` | en verde (sin niveles NN.json aún) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser, preexistente) |
| `npm run dev` | OK: responde 200, `GameScene.ts` transformado sin errores |

Pendiente humano:

- [ ] Jugar con `npm run dev`: moverse ambos a la vez sin conflicto, salto tras salir de un borde (coyote), salto bajo al soltar W/↑ pronto, llegar a las puertas usando las plataformas.

### Paso 3 — Modo un jugador (Tab) + modo debug (rama `feature/hito-2-movimiento`)

Hecho:

- `src/logic/controlMode.ts` (nuevo, sin Phaser): estado de control (`ControlState` = modo 2P/1PJ + personaje activo), `createControlState()` (arranca en **2P**), `nextControlState()` (Tab cicla **2P → 1P(Lumo) → 1P(Umbra) → 2P**) y `schemeFor()` (2P: Lumo con WASD y Umbra con flechas; 1P: el activo con **WASD**, el inactivo sin esquema → `null`); tests en `tests/controlMode.test.ts` (4 tests).
- `src/objects/Player.ts`: `update(time, input: PlayerKeys | null)` — `input` es el juego de teclas a leer ese frame (resuelto por la escena); si es `null` (inactivo) pone aceleración y velocidad horizontal a 0 (**quieto** según *Personajes y controles*) y **no toca teclas ni `velocityY` ni deshabilita el body**: gravedad y colisiones siguen activas (puede caer al abismo sin control). Las teclas ya no se fijan en el constructor.
- `src/scenes/GameScene.ts`: crea dos juegos de teclas compartidos (`wasd` = A/D/W, `arrows` = ←/→/↑) y cada frame resuelve con `schemeFor` qué teclas recibe cada `Player`; Tab con `JustDown(KEY_CODES.swapCharacter)` avanza el ciclo; en 1P limpia los bordes de la tecla de salto de flechas (evita saltos fantasma al volver a 2P); con `?debug=1` muestra un indicador `2P` / `1P Lumo` / `1P Umbra` (ayuda de dev; el HUD 1P/2P oficial es del Hito 5).
- `src/config/debug.ts` (nuevo): `isDebugMode()` lee `?debug=1` de la URL (`try/catch` no aplica; solo lectura de `location.search`).
- `src/main.ts`: `arcade.debug: isDebugMode()` — con `?debug=1` Arcade dibuja hitboxes y velocidades.
- `docs/PROGRESS.md`: este apunte.

Decisión de alcance (consultada y aprobada): las **teclas 1-8 para saltar de nivel** (modo debug documentado en *Arquitectura*) se **diferieren al Hito 3**, cuando existan `levels/01.json`…`08.json`; en este paso solo se activa el debug de Arcade Physics.

Decisión de diseño (instrucción explícita del usuario, **integrada en `DESIGN.md`** con su aprobación): Tab **cicla 2P → 1P(Lumo) → 1P(Umbra) → 2P**; en **1P el personaje activo se maneja con A/D/W** —sea Lumo o Umbra— y las flechas quedan inactivas; en **2P cada uno con sus teclas** (Lumo A/D/W, Umbra flechas). Se actualizaron `DESIGN.md` → *Personajes y controles* (párrafos de teclas globales y de modo un jugador) y la tabla *Decisiones de diseño — bloque Hito 2*.

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | en verde |
| `npm test` | 40/40 tests en verde (6 archivos) |
| `npm run validate-levels` | en verde (sin niveles NN.json aún) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser, preexistente) |

Pendiente humano:

- [ ] Con `npm run dev`: verificar que ambos se mueven a la vez (2P), que Tab cicla 2P → 1P(Lumo) → 1P(Umbra) → 2P, que en 1P el activo se maneja con A/D/W —también cuando es Umbra— y las flechas no, que el inactivo queda quieto pero con física activa (dejarlo en el borde de una plataforma y comprobar que cae), y que `?debug=1` muestra el debug de Arcade + el indicador de modo.

## Hito 3: Peligros y puertas

### Reglas, peligros, puertas y niveles 1-3 (rama `feature/hito-3-peligros-puertas`)

Hecho:

- `src/logic/rules.ts`: tipos `Character`/`Hazard`; `diesIn` (pozo de luz disuelve a Umbra, pozo de sombra apaga a Lumo, abismo mata a ambos); `resolveOutcome` (la muerte gana sobre la victoria, B2); `isStandingOn` (criterio "encima" de puertas/botones, B5); `buildHazardMap` + `hazardsTouching` (detección de contacto personaje/peligro por celdas, con margen configurable).
- `tests/rules.test.ts`: 6 combinaciones personaje/peligro, prioridad de muerte y criterio "encima"; se sumaron casos de `hazardsTouching` (apoyo sobre pozo, costado, abismo sin margen).
- `src/config/textures.ts` y `src/config/colors.ts`: claves/colores de `lightPit`, `shadowPit`, `abyss` y puertas `doorLumo`/`doorUmbra`.
- `src/scenes/BootScene.ts`: `generatePitTextures` (pozo de luz `#ffe08a` y de sombra `#4b2d73`), `generateAbyssTexture` y `generateDoorTextures` por código.
- `src/config/keys.ts`: `debugLevels` (teclas 1-8) además de R (reiniciar) y Tab (swap).
- `src/logic/levelParser.ts`: `StaticTile` ahora lleva `kind` (`wall` | `lightPit` | `shadowPit`) para distinguir el piso de los pozos sólidos.
- `src/config/levels.ts`: registro `LEVELS` con `01`-`03` (import `?raw`), `DEFAULT_LEVEL`, `levelIds()` y `hasLevel()`.
- `src/objects/Door.ts`: puerta sólida 32×32; se ilumina (`setLit`) cuando su personaje está encima (`isPlayerStanding` con `isStandingOn`).
- `src/objects/Hazard.ts`: peligro por celda; pozo → cuerpo sólido (actúa de piso, A6); abismo → hueco.
- `src/scenes/GameScene.ts`: carga el nivel de la progresión (o el elegido por debug), grupo estático de paredes, pozos sólidos con collider (sin colisión entre personajes, B3), abismo como sensor, puertas sólidas; muerte con pausa de 0.5 s y reinicio automático; victoria con ambos personajes sobre sus puertas y overlay provisional "Nivel completado"; R reinicia el nivel; debug `?debug=1` con teclas 1-8 para saltar de nivel (`hasLevel`) y etiqueta de nivel/modo. El reset conserva el modo de control (B7).
- `levels/01.json` (Primeros pasos, piso plano), `levels/02.json` (piso compartido con pozo de luz y de sombra: cada uno cruza el suyo caminando y salta el opuesto), `levels/03.json` (abismo): completables en modo un jugador.

Decisión de diseño: las **puertas son tiles sólidos** y el personaje se gana **parado sobre ellas** (`isStandingOn`, B5); se colocan a ras del piso en los niveles 1-3.

Rediseño del nivel 02 (pedido del usuario): el diseño previo usaba **dos corredores aislados**, por lo que el personaje nunca podía pisar el pozo opuesto y no se podía comprobar la muerte. Ahora es un **piso compartido** con ambos pozos al alcance de los dos: se verifica que pisar el pozo opuesto mata (Lumo en sombra, Umbra en luz) y que cruzar el propio es seguro.

Ajustes **temporales de testeo** (pedido explícito del usuario; se quitarán para la build final): las teclas **1/2/3** saltan al nivel `01`/`02`/`03` **sin necesidad de `?debug=1`**, y al **completar un nivel se avanza automáticamente al siguiente** (1,5 s de overlay "Nivel completado"); en el último nivel disponible no hay avance y queda R para reiniciar. El `?debug=1` sigue controlando el dibujo de Arcade y la etiqueta de nivel/modo.

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | en verde |
| `npm test` | 54/54 tests en verde (7 archivos) |
| `npm run validate-levels` | en verde (3 niveles válidos) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser, preexistente) |

Pendiente humano:

- [ ] Con `npm run dev`: cada personaje muere solo en lo que corresponde (Lumo en pozo de sombra y abismo; Umbra en pozo de luz y abismo) y el otro cruza el pozo sin efecto. En el nivel 02, probar a propósito pisar el pozo opuesto.
- [ ] Ganar requiere a los dos sobre sus puertas al mismo tiempo (probar en 2P y en 1P con Tab).
- [ ] Niveles 1-3 completables; R reinicia el nivel.
- [ ] Teclas 1/2/3 cambian de nivel sin `?debug=1`; al completar un nivel se avanza automáticamente al siguiente.

## Hito 4: Botones y elementos

### Lógica, objetos, niveles 4-7 (rama `feature/hito-4-botones-elementos`)

Hecho:

- `src/logic/switches.ts` (sin Phaser): `SwitchId`, `LeverRuntime`, `createLever`, `toggleLeverOnContact` (alterna solo en el borde not-touching → touching) y la clase `SwitchSystem` (`setPressedButtons`, `setTouchingLevers`, `isLeverOn`, `isGateOpen` = botón pisado **o** palanca encendida del mismo ID). `tests/switches.test.ts`: 9 tests.
- `src/logic/rules.ts`: `rectsOverlap(a, b)` + tests en `tests/rules.test.ts` (usado por `cellOccupied` de compuertas).
- `src/config/colors.ts`: `import Phaser`; colores de `button`, `lever`, `gate`, `gateEdge`, `gemGold`, `gemViolet`, `crystal`, `crystalEdge`, `barrier`, `barrierEdge`; `SWITCH_COLORS` (rojo/azul/verde/amarillo), `colorForSwitch(id)`, `colorToNumber(color)`.
- `src/config/textures.ts`: claves `button`, `lever`, `gate`, `gemGold`, `gemViolet`, `crystal`, `barrier`.
- `src/config/physics.ts`: `GATE_TWEEN_MS = 200`, `DISSOLVE_MS = 300` (+ asserts en `tests/config.test.ts`).
- `src/scenes/BootScene.ts`: texturas por código para botón, palanca, compuerta, gemas (dorada/violeta), cristal y barrera.
- `src/objects/Dissolvable.ts`: bloque sólido estático que pierde la **solidez al instante** y hace el tween de disolución (300 ms) antes de destruirse; `Crystal.ts` (Lumo lo disuelve) y `Barrier.ts` (Umbra la apaga).
- `src/objects/Button.ts`: activo mientras un personaje lo pisa (`isStandingOn`, B5); tinte por ID; se hunde 3 px al pisarlo.
- `src/objects/Lever.ts`: alterna por borde de contacto; tinte encendido/apagado; cualquiera de los dos la usa.
- `src/objects/Gate.ts`: cuerpo dinámico immovable sin gravedad; fases `closed → opening → open → closing` con tween de 200 ms hacia arriba; al cerrarse, si un personaje ocupa el tile destino detiene el cierre (nunca mata, A5/B9).
- `src/objects/Gem.ts`: cuerpo estático; `kind` gold/violet, se recoge solo con su personaje y hace tween de recogida.
- `src/scenes/GameScene.ts`: `createElements` (botones/palancas/compuertas/cristales/barreras/gemas), colliders (jugadores↔compuertas; Lumo disuelve cristales y Umbra las barreras; el otro queda bloqueado), overlaps de gemas (Lumo↔doradas, Umbra↔violetas), `updateSwitches` (recolecta botones pisados y palancas tocadas, actualiza `SwitchSystem` y cada compuerta con `cellOccupied`), contador `collectedGems`/`totalGems` mostrado en la etiqueta de debug.
- `levels/04.json` (botón que Lumo mantiene para que Umbra cruce la compuerta), `05.json` (dos botones del mismo ID a ambos lados de una compuerta: se turnan para abrirse paso), `06.json` (cristales `c` y barreras `b` intercalados: Lumo disuelve, Umbra apaga, se alternan) y `07.json` (dos palancas y tres compuertas por ID, con orden de acciones reversible). `src/config/levels.ts` registra `04`-`07`.

Decisiones de diseño (a documentar/confirmar):

- **Corredor de 2 tiles** (filas 12 techo `#`, 13 libre, 14 pasillo, 15 piso, 16 piso) para los niveles 4-7: como el personaje salta ~3 tiles, un techo en la fila 12 impide saltar por encima de compuertas/cristales/barreras de 1 tile.
- **Compuerta abierta sin colisión:** al retraerse 1 tile, la compuerta comparte el tile superior con la cabeza del personaje (hitbox 40 px en un corredor de 2 tiles); por eso `Gate` **desactiva su cuerpo al quedar totalmente abierta** (leve desvío de A5 "sólido mientras existe", necesario para no hundir al jugador en el piso). Se re-habilita al empezar a cerrarse.
- La etiqueta de debug ahora muestra `nivel · modo · gemas X/Y` y se refresca cada frame.

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | en verde |
| `npm test` | 74/74 tests en verde (9 archivos) |
| `npm run validate-levels` | en verde (7 niveles válidos) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser, preexistente) |

Pendiente humano:

- [ ] Con `npm run dev`: en el nivel 04, pararse en el botón abre la compuerta y deja pasar al otro; soltarlo la cierra.
- [ ] Nivel 04: la compuerta al cerrarse no aplasta ni atrapa a nadie (B9).
- [ ] Nivel 05: se turnan usando los dos botones del mismo ID para abrir la compuerta desde cada lado.
- [ ] Nivel 06: Lumo disuelve los cristales y Umbra las barreras; el bloque disuelto deja pasar al instante.
- [ ] Nivel 07: las palancas son reversibles; el orden incorrecto agrega pasos pero no bloquea el nivel.
- [ ] Gemas: cada personaje recoge solo las suyas (dorada Lumo, violeta Umbra).
- [ ] Niveles 4-7 completables en modo un jugador (Tab).

Nota Git: `feature/hito-4-botones-elementos`; commit `2882077` push al remoto.

## Hito 5: Pantallas y progreso

Rama: `feature/hito-5-pantallas-progreso`.

Hecho:

- `src/logic/scoring.ts` (sin Phaser): `scoreLevel` (1 estrella por terminar + 1 por todas las gemas + 1 bajo el tiempo objetivo, C2), `collectedAllGems` (nivel sin gemas = estrella automática), `finishedUnderTime` (clavar el objetivo cuenta) y `formatTime` (`mm:ss`). `tests/scoring.test.ts`: 8 tests.
- `src/logic/progress.ts` (sin Phaser, storage inyectable): `StorageLike`, `Progress` (niveles desbloqueados + mejores estrellas por ID), `emptyProgress`, `sanitizeProgress`, `loadProgress`/`saveProgress` (nunca lanzan; JSON corrupto → vacío), `browserStorage` (localStorage dentro de try/catch), `isLevelUnlocked`, `starsFor` y `recordResult` (desbloquea el siguiente en orden y conserva la mejor puntuación). `tests/progress.test.ts`: 10 tests (incluye storage bloqueado).
- `src/logic/controlMode.ts`: `createControlState` (por defecto 2P), `controlStateForMode(mode)` y `switchActive` (Tab: en 2P no hace nada, en 1P alterna el personaje activo). Se eliminó `nextControlState` (el ciclo de prueba del Hito 2). `tests/controlMode.test.ts` actualizado.
- `src/scenes/ui.ts`: helper `createButton` (rect + texto con la paleta, estados habilitado/deshabilitado con hover, cursor) y `textStyle`; arte provisional por código.
- `src/scenes/MenuScene.ts`: título + **[Un jugador]** / **[Dos jugadores]** (sin botón "Jugar", M3); elige el modo y abre el selector.
- `src/scenes/LevelSelectScene.ts`: grilla de niveles (`levelIds()`, hoy 01-07) con estrellas; desbloqueo en orden con `isLevelUnlocked`; los bloqueados quedan deshabilitados; botón Volver.
- `src/scenes/ResultScene.ts`: estrellas, tiempo `mm:ss`, gemas `X/Y` y botones [Siguiente nivel] [Reintentar] [Volver al menú]; en el último nivel se omite "Siguiente" (M4).
- `src/scenes/GameScene.ts`: HUD (tiempo `mm:ss`, gemas `X/Y`, icono 1P/2P, M5); cronómetro por acumulación de `delta` (no avanza en pausa, muerte ni victoria); **pausa como overlay** (Esc) que congela física y tweens con [Reanudar] [Reiniciar] [Silencio] (B1/M4/M8, silencio vía `this.sound.mute`); la victoria calcula `scoreLevel`, guarda el progreso con `recordResult`+`localStorage` y abre `ResultScene`; se quitó el avance automático de nivel del Hito 4; las teclas 1-8 para saltar de nivel ahora solo funcionan con `?debug=1`.
- `src/main.ts`: registro de escenas `[Boot, Menu, LevelSelect, Game, Result]`; `BootScene` arranca en `Menu`.

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | en verde |
| `npm test` | 93/93 tests en verde (11 archivos) |
| `npm run validate-levels` | en verde (7 niveles válidos) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser, preexistente) |
| `npm run dev` | HTTP 200 en `/`, `MenuScene.ts`, `LevelSelectScene.ts`, `ResultScene.ts` y `GameScene.ts` |

Pendiente humano:

- [ ] Menú → [Un jugador]/[Dos jugadores] abre el selector con las estrellas guardadas; los niveles bloqueados no se pueden elegir.
- [ ] El HUD muestra `mm:ss`, gemas `X/Y` e icono 1P/2P; el tiempo se congela al pausar (Esc) y al morir/ganar.
- [ ] Pausa (Esc): congela física y animaciones; [Reiniciar] y [Silencio] funcionan; Esc reanuda; Tab y el movimiento quedan deshabilitados.
- [ ] Al ganar aparece la pantalla de resultado con tiempo, gemas y estrellas; [Siguiente]/[Reintentar]/[Volver al menú] navegan bien; en el nivel 07 se omite "Siguiente".
- [ ] El progreso y las estrellas persisten al recargar la página; los niveles se desbloquean en orden.
- [ ] R reinicia el nivel con el cronómetro a 0; la muerte reinicia mostrando los 0,5 s de pausa.

Nota Git: `feature/hito-5-pantallas-progreso`; commit `5557f18` (HUD, selector de niveles y número de jugadores).

## Hito 6: Pulido y nivel final

Rama: `feature/hito-6-pulido-nivel-final`.

Hecho:

- `scripts/generate-sfx.ts` (nuevo): sintetizador estilo jsfxr en Node que genera por código los **5 efectos** en `public/sfx/*.wav` (PCM 16-bit mono 44.1 kHz): `jump`, `gem`, `button`, `death`, `victory`. Script npm `generate-sfx`.
- `src/config/audio.ts` (nuevo): claves `SFX_KEYS`, `SFX_FILES` (rutas) y `SFX_VOLUME`; solo los 5 eventos del documento tienen sonido.
- `src/fx/sfx.ts` (nuevo): `playSfx(scene, key)`; nunca lanza (si falta el recurso o el audio no está, el juego sigue).
- `src/fx/particles.ts` (nuevo): `createTrail` (rastro) y `deathBurst` (explosión de muerte).
- `src/fx/transitions.ts` (nuevo): `fadeIn` y `fadeOutThen` (fundido entre escenas con el color de fondo).
- `src/config/textures.ts`: clave de textura `spark`.
- `src/scenes/BootScene.ts`: `preload` carga los `SFX_FILES`; nueva `generateSparkTexture` (partícula 8×8 blanca para tintar).
- `src/objects/Player.ts`: squash & stretch (salto 0.85/1.15, aterrizaje 1.18/0.82 sólo si la caída supera 120 px/s) manteniendo los pies en el suelo (offset del body por escala), sonido de salto y `depth` 20.
- `src/objects/Door.ts`: brillo con **Filters Glow** de Phaser 4 (WebGL) que se activa/desactiva con `setLit`; alpha tenue cuando apagada.
- `src/objects/Button.ts`: getter `isPressed` para detectar el borde de presión.
- `src/scenes/GameScene.ts`: rastros (destellos de Lumo, humo de Umbra) que se pausan con el overlay de pausa; SFX de salto/gema/botón/muerte/victoria; explosión de partículas del color del personaje + `shake(150, 0.012)` al morir; fundido de entrada al nivel y de salida hacia el resultado.
- `src/scenes/MenuScene.ts`, `LevelSelectScene.ts`, `ResultScene.ts`: `fadeIn` al abrir.
- `levels/08.json`: "Las ruinas", nivel final (`timeTarget: 60`); combina pozos de luz/sombra, abismo, cristal, barrera, dos botones + compuerta (rojo), palanca + compuerta (azul) y 4 gemas. Corredor de 2 tiles con techo en las columnas 13-25 (para que no se pueda saltar compuertas/cristales), con cielo abierto sobre los pozos y el abismo para saltarlos con holgura. `src/config/levels.ts` registra `08`.
- `tests/sfx.test.ts` (nuevo): los 5 `.wav` existen y son contenedores RIFF/WAVE.

Decisiones de diseño / notas:

- **SFX por código** (elección del usuario): los `.wav` se generan con Node y se versionan en `public/sfx/`.
- Ruta del nivel 08 en modo un jugador (según B10, las palancas son reversibles): Lumo cruza su pozo de luz y salta el de sombra; Umbra al revés; ambos saltan el abismo (techo abierto). Botones del mismo ID a ambos lados de la compuerta (col 13 y 18) para turnarse; luego el cristal (col 20, Lumo) y la barrera (col 22, Umbra) obligan a alternar; la palanca (col 23) abre la compuerta final (col 25) y, si el segundo personaje la re-alterna, se recupera saliendo y volviendo a entrar (sin deadlock, B10).
- El rastro de partículas se pausa junto con física y tweens (B1).

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run generate-sfx` | genera los 5 `.wav` en `public/sfx/` |
| `npm run typecheck` | en verde |
| `npm test` | 96/96 tests en verde (12 archivos) |
| `npm run validate-levels` | en verde (8 niveles válidos) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser, preexistente); `dist/sfx/*.wav` presentes |
| `npm run dev` | HTTP 200 en `/`, `GameScene.ts` y `sfx/jump.wav` |

Pendiente humano:

- [ ] `npm run preview` sin errores en consola; los 8 niveles completables en modo un jugador.
- [ ] Juice: rastro de partículas en ambos personajes, squash & stretch al saltar/aterrizar, explosión + screen shake al morir, brillo de las puertas al pisarlas, fundido entre escenas.
- [ ] Sonido: salto, gema, botón, muerte y victoria suenan; el resto no; el botón de silencio de la pausa funciona.
- [ ] Nivel 08 jugable de principio a fin en modo un jugador (ruta descrita arriba) y la estrella de tiempo alcanzable.

## Rediseño de niveles (post-Hito 6)

> **Reemplazado** por *Rediseño visual y de niveles (v2)* (al final de este archivo): los niveles y los pendientes de esta sección ya no aplican.

Rama: `feature/rediseno-niveles`.

Hecho:

- `levels/01.json` … `08.json` reescritos al estilo **multinivel** (plataformas a distintas alturas, escaleras, desniveles y puerta de salida sobre una plataforma elevada). Se conservan los elementos y la progresión de mecánicas (pozos, abismo, compuertas, cristal/barrera, palancas; nivel 8 combina todo).
- **Primera compuerta cooperativa** (dos botones del mismo ID, uno a cada lado) en el nivel **1** (antes aparecía en el 4). Decisión N2 en `DESIGN.md`.
- **Anti-salto**: cada compuerta lleva un **lintel** de 3 tiles (filas 10-12) centrado en su columna; el tramo de cristal/barrera del nivel 6 va **bajo techo** (fila 12, cols 5-22). Ninguna plataforma cercana queda a distancia de salto de un lintel. Decisión N3.
- Grillas verificadas a mano contra la física (salto ≈ 96 px = 3 tiles de alto, ≈ 160 px ≈ 5 tiles de ancho): cada escalón sube ≤ 2 tiles y cada hueco saltable mide ≤ 4 tiles.
- Constantes de posicionamiento respetadas: piso en fila 15 (fila 16 base), fila 14 de caminata, fila 13 para plataformas/puerta elevada; botones en `y:15` con 2 tiles libres encima; compuertas en `y:14` con `grid[y-1][x] === '.'`.

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run validate-levels` | en verde (8 niveles válidos) |
| `npm run typecheck` | en verde |
| `npm test` | 96/96 tests en verde (12 archivos) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser, preexistente) |

Pendiente humano:

- [ ] Jugar los 8 niveles en modo un jugador (Tab) y confirmar que son completables y que la dificultad progresa.
- [ ] Confirmar la estrella de tiempo (objetivos: 40/50/55/55/45/50/55/65 s) jugando.
- [ ] Verificar que ninguna compuerta se puede saltar por arriba (lintel/techo) y que ninguna plataforma permite saltar sobre un lintel cercano.

Nota Git: `feature/rediseno-niveles` (sin commitear todavía).

### Rediseño a pantalla completa de los niveles 01-04

Hecho:

- `levels/01.json` … `04.json` reescritos para **llenar las 30 × 17 celdas** (una sola pantalla fija, `Scale.FIT`) con un **arquetipo distinto por nivel**; los niveles **05-08 se dejan como están** por ahora. Decisión N5 en `DESIGN.md`.
- **01 — torre cooperativa:** subida en zigzag por repisas de 5 tiles (escalones de 2 tiles que no comparten columnas, para dejar los 2 tiles libres que exige la hitbox) hasta la cima; una compuerta cooperativa (rojo) con **dos botones del mismo ID**, uno a cada lado de un **muro central completo (col. 5, filas 0-12)**. Sin peligros.
- **02 — pozos:** pozos de luz y de sombra en el piso (a cielo abierto) y en repisas elevadas; el muro de la compuerta cooperativa (col. 13) obliga a cruzar los pozos antes y después del ascenso.
- **03 — abismo:** un **abismo de 10 tiles de ancho × 2 de profundidad** corta el piso; se cruza por repisas colgantes a media altura entre dos torres (izquierda con el spawn, derecha con las puertas). Sin compuerta: ambos deben hacer la travesía.
- **04 — compuertas encadenadas:** **dos compuertas** (rojo col. 7, azul col. 15) separan tres secciones con **muros completos (filas 0-12)**; cada compuerta tiene dos botones del mismo ID, uno a cada lado. Secuencia cooperativa: se mantiene el botón para que pase el otro y se turnan dos veces; luego ascenso hasta las puertas.
- **Anti-salto por muro completo (N6):** en 01, 02 y 04 la compuerta vive en una **columna de muro de filas 0-12**; la fila 13 queda libre como tile de retracción (`levelParser` exige `grid[y-1][x] === '.'`). Como la hitbox (40 px) solo llega a la fila 13 al estar parado, el personaje no puede saltar por encima de la compuerta.
- **Coop en 1P:** el personaje inactivo (Tab) sigue con física activa y **mantiene el botón pisado** mientras el activo pasa, tal como exige el modo un jugador.

Verificación de alcance: se usó un **checker de alcanzabilidad** (BFS sobre nodos "standing" con reglas conservadoras de salto de ≤5 tiles de ancho y ≤2 de alto, y caídas de hasta 4; los pozos se modelan letales y las compuertas como abiertas). Resultado: en los cuatro niveles Lumo y Umbra alcanzan **su puerta y sus 4 gemas** (01: 53 nodos; 02: 52; 03: 47; 04: 55). El checker está en archivo temporal, **no** se commitea.

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run validate-levels` | en verde (8 niveles válidos) |
| `npm run typecheck` | en verde |
| `npm test` | 96/96 tests en verde (12 archivos) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser, preexistente) |

Pendiente humano:

- [ ] Jugar los niveles 01-04 en modo un jugador (Tab) y confirmar que se sienten bien, que la compuerta cooperativa exige turnarse y que el ascenso usa toda la pantalla.
- [ ] Confirmar que no se puede saltar ninguna compuerta por arriba ni rodearla por los lados (muro completo).
- [ ] Revisar los `timeTarget` nuevos (01: 45 s, 02: 50 s, 03: 55 s, 04: 55 s) jugando; ajustar si la estrella de tiempo queda inalcanzable.
- [ ] Decidir si los niveles 05-08 se rediseñan con el mismo criterio de pantalla completa (N5, pendiente).

### Corrección de pasabilidad 01-04 (con simulador de física real)

El checker anterior de alcanzabilidad **no modelaba colisiones laterales ni techos**, así que dio por buenos saltos imposibles. Se reemplazó por un **simulador de la física real** (AABB 24 × 40, gravedad 1200, salto −480, corte por techo y colisión lateral) integrado en el mismo BFS de "nodos de pie". Al pasar los 4 niveles por el simulador, **01-04 resultaron NO pasables** (puertas inalcanzables): el primer rediseño tenía plataformas justo encima del arco de salto (el personaje golpeaba el techo y caía) y plataformas pegadas a muros.

Hecho:

- `levels/01.json` … `04.json` reescritos con **escaleras diagonales limpias**: cada escalón sube 2 filas y avanza 3-4 columnas, sin plataformas superpuestas sobre la trayectoria del salto ni pegadas a muros. Se conserva la mecánica de cada nivel (compuerta cooperativa, pozos, abismo, dos compuertas).
- Geometría resultante (verificada por el simulador): **01** puertas fila 7 (torre diagonal + compuerta cooperativa al pie); **02** puertas fila 9 (pozos de luz/sombra en el piso: `pp` cols 9-10, `ss` cols 13-14, cada uno cruza el suyo y salta el del otro); **03** puertas fila 11 (abismo de 10 tiles cruzado por escalones sobre el vacío); **04** puertas fila 11 (dos compuertas rojo/azul en columnas de muro completas, con dos botones cada una).
- Se prioriza la **pasabilidad** por encima de llenar toda la pantalla (decisión N7 en `DESIGN.md`); puede quedar la parte superior libre.
- `DESIGN.md` actualizado: *Niveles* (regla de pasabilidad, descripción del nivel 1) y *Decisiones de diseño* (N6b corregido, N7 nuevo).

Verificación (simulador): los cuatro niveles, ambos personajes alcanzan **su puerta y sus 4 gemas** por salto/gravedad:

| Nivel | Lumo | Umbra |
| --- | --- | --- |
| 01 | puerta ✓, 2 doradas ✓ | puerta ✓, 2 violetas ✓ |
| 02 | puerta ✓, 2 doradas ✓ | puerta ✓, 2 violetas ✓ |
| 03 | puerta ✓, 2 doradas ✓ | puerta ✓, 2 violetas ✓ |
| 04 | puerta ✓, 2 doradas ✓ | puerta ✓, 2 violetas ✓ |

Verificaciones del proyecto:

| Comando | Resultado |
| --- | --- |
| `npm run validate-levels` | en verde (8 niveles válidos) |
| `npm run typecheck` | en verde |
| `npm test` | 96/96 tests en verde (12 archivos) |
| `npm run build` | OK (warning de chunk >500 kB por Phaser, preexistente) |

Pendiente humano:

- [ ] Jugar 01-04 en modo un jugador (Tab): confirmar que se sienten bien, que la compuerta cooperativa exige turnarse y que ya no hay saltos imposibles.
- [ ] Confirmar que no se puede saltar ninguna compuerta por arriba ni rodearla por los lados (muro completo).
- [ ] Revisar los `timeTarget` (01: 45 s, 02: 50 s, 03: 55 s, 04: 55 s) jugando; ajustar si la estrella de tiempo queda inalcanzable.

Nota: el simulador está en un archivo temporal, **no** se commitea.

## Rediseño visual y de niveles (v2)

Pedido: mejorar el diseño de Lumo, Umbra y los pozos (que se entienda qué pisa cada uno), mejorar el diseño de los niveles y actualizar la documentación. Reemplaza los niveles del *Rediseño de niveles (post-Hito 6)* y sus pendientes.

Hecho — arte (todo por código, sin assets externos):

- `src/fx/art.ts` (nuevo): dibujo en Canvas 2D de fondo (cielo de atardecer, sol, estrellas, ruinas en dos planos), muros de piedra (3 variantes + cara superior con musgo), pozos de luz/sombra y abismo (variante de superficie), Lumo, Umbra, halos, puertas (pedestal + arco), botón, palanca, compuerta, gemas, cristal, barrera, partículas e iconos de sol y luna.
- **Convención sol = Lumo / luna = Umbra:** el emblema aparece en los pozos que cada uno pisa, en el cristal (sol, lo rompe Lumo), en la barrera (luna, la apaga Umbra) y en las puertas.
- `src/config/textures.ts`: claves nuevas (`background`, `wall0..2`, `wallTop0..2`, `*Top` de pozos y abismo, auras, arcos, `smoke`, `sunBadge`, `moonBadge`).
- `src/scenes/BootScene.ts`: genera todas las texturas con `textures.createCanvas`.
- `src/scenes/GameScene.ts`: fondo, muros con cara superior, pozos con **ola senoidal animada**, partículas ambientales por pozo (motas de luz, humo, bruma del abismo), emblema sol/luna en cada pozo, carteles `hints`, halos de los personajes; al morir el personaje desaparece tras la explosión.
- `src/objects/`: `Player` (halo + mira hacia donde se mueve + `vanish`), `Door` (arco-portal con Glow), `Button` (sobresale del piso), `Lever` (inclinación y color según estado; apagada se ve desaturada), `Gate` (translúcida al abrirse), `Gem` (flota), `Dissolvable`/`Crystal`/`Barrier` (estallido al disolverse; la barrera titila), `Hazard` (textura de superficie).
- `src/scenes/MenuScene.ts`: fondo y **leyenda** de los dos personajes (teclas, emblema, qué pisa/rompe cada uno). `LevelSelectScene` y `ResultScene` con fondo.
- `src/main.ts`: gancho `window.__lumoGame` solo en desarrollo (capturas automáticas).

Hecho — niveles:

- `levels/01.json` … `08.json` rediseñados desde cero (ver `DESIGN.md` → *Progresión de los 8 niveles*): torre y templo, carriles cruzados de luz/sombra, piedras sobre el abismo, relevo arriba/abajo, torres gemelas con botones cruzados, celdas de barrera/cristal con puente y piso disolvibles, puente de compuertas con dos palancas, y "Las ruinas" con torre en zigzag.
- `timeTarget`: 01: 40 s · 02: 40 s · 03: 45 s · 04: 45 s · 05: 70 s · 06: 45 s · 07: 60 s · 08: 80 s (estimados, a ajustar jugando).
- `src/logic/levelParser.ts`: campo opcional `hints` y validaciones nuevas (botón/palanca sobre `#`, cada compuerta con su botón/palanca y viceversa, `hints` válidos).
- `scripts/solve-levels.mjs` + script `npm run solve-levels`: simulador de física aproximado de Arcade + búsqueda de la secuencia cooperativa más corta, con física normal y conservadora (salto −455, velocidad 190).

Verificaciones:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | en verde |
| `npm test` | 100/100 tests en verde (4 tests nuevos de validación y `hints`) |
| `npm run validate-levels` | en verde (8 niveles válidos) |
| `npm run solve-levels` | 01–08 con solución en física normal y conservadora, 4/4 gemas alcanzables; en 01 y 03–08 al menos uno necesita ayuda del otro; 02 es individual a propósito |
| `npm run build` + `npm run preview` | OK, sin errores en consola (warning de chunk > 500 kB por Phaser, preexistente) |
| Capturas con Playwright (`npm run dev`) | los 8 niveles, menú y selector se ven bien y sin errores de consola; Umbra apaga la barrera de la celda del nivel 6 y las dos palancas azules del nivel 7 comparten estado |

Pendiente humano:

- [ ] Jugar los 8 niveles (en 1P con Tab y en 2P) y confirmar que se entienden y se sienten bien. El solver es aproximado: puede haber algún salto más justo de lo que parece.
- [ ] Ajustar los `timeTarget` jugando.
- [ ] Revisar que la leyenda del menú y los carteles se lean bien en la pantalla de ustedes.
- [ ] Crear la rama (por ejemplo `feature/rediseno-visual-niveles`), commitear y hacer push (los cambios están en el working tree).
- [x] `.docx` del GDD actualizado (ver v2.1).

### v2.1 — Personajes más chicos, análisis de atajos y botón de menú en la pausa

Pedido: que los dos pasen por espacios de 1 tile (achicarlos), analizar dónde se podían saltear los puzzles por el tamaño nuevo y agregar en la pausa un botón para volver al menú principal.

Hecho:

- `src/config/physics.ts`: `PLAYER_BODY_WIDTH/HEIGHT` = **20 × 26** y `PLAYER_TEXTURE_WIDTH/HEIGHT` = 24 × 30. `Player` usa esos valores (pies en el borde inferior; el squash & stretch los mantiene en el piso). `fx/art.ts` dibuja a Lumo y Umbra escalados al tamaño nuevo.
- **Atajo encontrado y corregido:** el tile libre que cada compuerta necesitaba arriba (para retraerse) dejaba un hueco de 1 tile **por encima de la compuerta cerrada**: con el tamaño nuevo, todas las compuertas de pasillo de 01, 03, 04, 05 y 08 se podían saltear. Ahora llevan un **dintel `#` justo arriba** y al abrirse se esconden en él (`Gate` se dibuja debajo de los muros). Las compuertas-puente de 07 y 08 siguen con aire arriba. `levelParser` acepta `#` o `.` arriba de una compuerta (tests actualizados).
- Ajustes de margen: 01 (repisas altas a 2 tiles de distancia), 03 (escalón de la torre de Lumo más cerca).
- `scripts/solve-levels.mjs`: cuerpo 20 × 26; arreglo de dos falsos atajos del simulador (nodos que quedaban incrustados en muros por el redondeo y en el hueco de una compuerta: ahora se los empuja al costado libre como hace Arcade); nueva opción `--atajos` (incluida en `npm run solve-levels`) que anula cada botón/palanca, cristal y barrera por separado y vuelve a resolver.
- `GameScene`: botón **[Menú principal]** en la pausa.

Resultado del análisis de atajos (`npm run solve-levels`):

| Nivel | Resultado |
| --- | --- |
| 01, 03 | botón rojo imprescindible |
| 04, 05 | todos los botones (rojo, azul, verde y en 05 amarillo) imprescindibles |
| 06 | barreras de las celdas y cristales de los muros imprescindibles; el puente de barreras y el piso de cristal "no hacen falta disolverlos" (son caminos: está bien) |
| 07 | palancas azules imprescindibles |
| 08 | palanca verde, botones rojos, cristal y barrera de la torre imprescindibles |
| 02 | sin mecanismos (nivel individual a propósito) |

Atajo menor que queda (documentado en `DESIGN.md` → N13): en las compuertas cooperativas de 01 y 08, quien pasa puede quedarse parado en el hueco para que la compuerta no se cierre y el otro cruce sin el segundo botón.

Verificaciones: `npm run typecheck` en verde · `npm test` 100/100 · `npm run validate-levels` en verde · `npm run solve-levels` en verde (normal y conservador, 4/4 gemas, ningún botón/palanca salteable) · capturas con Playwright sin errores; la pausa muestra [Menú principal] y vuelve al menú.

Pendiente humano:

- [ ] Jugar los 8 niveles con el tamaño nuevo (sobre todo pasillos y saltos con techo).
- [ ] Commit y push de los cambios.
- [x] GDD `.docx` actualizado con el rediseño (personajes, progresión de niveles, estética sol/luna, compuertas con dintel, scripts, pausa y sección final *Cambios del rediseño (v2)*). `README.md` reescrito (cómo jugar, instalar, comandos, Vercel).

