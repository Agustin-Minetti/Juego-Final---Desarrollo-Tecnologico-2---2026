# PROGRESS.md — Lumo y Umbra

Estado del avance por hito. Lo actualiza el agente al cerrar cada tarea.

## Estado general

| Hito | Estado | Notas |
| --- | --- | --- |
| 1. Esqueleto | completado | Mergeado en `main` (PR #2); pendiente solo el chequeo manual humano original |
| 2. Movimiento | en curso | Pasos 1-3 hechos en `feature/hito-2-movimiento` (`levelParser`, jugadores + `test.json`, Tab + debug); Hito 2 listo salvo prueba manual humana |
| 3. Peligros y puertas | completado | `rules.ts` + tests, pozos/abismo/puertas, muerte con reinicio, R y debug 1-8, `levels/01-03.json`; en `feature/hito-3-peligros-puertas`, listo salvo prueba manual humana |
| 4. Botones y elementos | en curso | `switches.ts` + tests, botones/palancas/compuertas, cristal/barrera, gemas y niveles 4-7; en `feature/hito-4-botones-elementos`; listo salvo prueba manual humana |
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

Nota Git: `feature/hito-4-botones-elementos`; cambios en working tree sin commitear (pendiente de autorización).
