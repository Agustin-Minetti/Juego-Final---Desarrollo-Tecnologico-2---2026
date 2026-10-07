# Documento de diseño: Lumo y Umbra

> Fuente canónica: `docs/Documento de diseño lumo y umbra.docx`. Este Markdown es la versión de referencia para el agente y el equipo.

## Resumen

Lumo y Umbra es un plataformero cooperativo de puzzles para dos jugadores en el mismo teclado, con 8 niveles y una duración de desarrollo objetivo de 7 a 10 días. Lumo es un espíritu de luz que se apaga en la sombra; Umbra es un espíritu de sombra que se disuelve en la luz. Los dos tienen que llegar a sus puertas para ganar.

Pitch: "Una luz y una sombra escapan juntas de unas ruinas al atardecer, donde lo que salva a una puede borrar a la otra."

Objetivos del proyecto:

- Juego completo y pulido en el navegador, sin backend.
- Alcance cerrado: nada fuera de este documento entra hasta terminar el hito 6.
- Desarrollado casi íntegramente por un agente (OpenCode), con revisión humana al final de cada hito.
- Identidad propia: nombres, personajes y arte originales; solo se toma la idea general de dos elementos opuestos.
- Plataforma: navegador de escritorio, teclado. Resolución base 960 × 544.

## Stack técnico

El juego usa Phaser 4.2.1, la última versión estable al día de hoy, sobre Vite y TypeScript.

| Herramienta | Versión | Uso |
| --- | --- | --- |
| Phaser | 4.2.1 (fijada en package.json, sin ^) | Motor, Arcade Physics, tweens, partículas |
| Vite | última estable | Servidor de desarrollo y build |
| TypeScript | última estable, `strict: true` | Lenguaje |
| Node.js | LTS vigente | Tooling (no hay servidor de juego) |
| Vitest | última estable | Tests de la lógica pura |
| Playwright | opcional | Capturas de pantalla para que el agente verifique visualmente |
| OpenCode | última | Agente de desarrollo |

## Mecánicas

El núcleo son dos personajes con física de plataformas, tres tipos de pozo, puertas de salida y botones que abren compuertas. Todo lo demás se apoya en eso.

### Personajes y controles

| Personaje | Naturaleza | Controles | Muere en |
| --- | --- | --- | --- |
| Lumo | Luz (amarillo cálido) | A / D mover, W saltar | Pozos de sombra y abismo |
| Umbra | Sombra (violeta) | ← / → mover, ↑ saltar | Pozos de luz y abismo |

Teclas globales: R reinicia el nivel al instante (reset total, ver *Victoria, derrota y puntaje*), Esc pausa, Tab cambia de personaje en modo un jugador.

Pausa (Esc): **congela todo** — física, cronómetro y animaciones. Mientras está activa solo se permite reanudar (Esc), reiniciar (R) o silenciar; Tab y las teclas de movimiento quedan deshabilitadas. El cronómetro de las estrellas nunca avanza pausado.

Parámetros de movimiento iniciales:

| Parámetro | Valor |
| --- | --- |
| Velocidad horizontal máxima | 200 px/s |
| Aceleración | 2400 px/s² |
| Desaceleración al soltar las teclas | 2400 px/s² (misma magnitud: respuesta casi sin deslizamiento) |
| Gravedad | 1200 px/s² |
| Velocidad de salto inicial | -480 px/s |
| Coyote time | 100 ms para saltar después de dejar el borde |
| Jump buffer | 100 ms para registrar el salto apretado justo antes de tocar el piso |
| Salto variable | Al soltar la tecla de salto estando en ascenso (`velocityY < 0`), se multiplica `velocityY` por 0.5. Si se mantiene, salto completo; si se suelta pronto, salto bajo. |

Hitbox de ambos personajes: rectángulo de colisión de **24 × 40 px** (0,75 × 1,25 tiles), centrado en el sprite.

Colisión entre personajes: **Lumo y Umbra no colisionan entre sí**. Se ignoran mutuamente en la física; interactúan solo a través de botones, palancas, pozos, gemas y demás elementos del nivel.

Modo un jugador (Tab): el personaje inactivo **queda quieto** (se le pone la velocidad horizontal a 0) pero **con física activa**: la gravedad y las colisiones siguen corriendo, de modo que si está sobre un pozo o el abismo puede caer y morir sin control. El jugador debe dejarlo en zona segura antes de cambiar.

### Elementos del nivel

| Elemento | Comportamiento |
| --- | --- |
| Pared / piso | Sólido para ambos |
| Pozo de luz | Sólido para ambos (actúa como piso); disuelve a Umbra al tocarlo; Lumo lo cruza sin efecto |
| Pozo de sombra | Sólido para ambos (actúa como piso); apaga a Lumo al tocarlo; Umbra lo cruza sin efecto |
| Abismo | Hueco sin piso; mata a ambos |
| Puerta de Lumo / de Umbra | Se ilumina cuando su personaje está encima; el nivel se gana con ambos en su puerta |
| Botón | Activo mientras algún personaje lo pisa; abre las compuertas de su mismo color/ID |
| Palanca | Se alterna por borde de contacto (ver abajo); cualquiera de los dos puede usarla; abre o cierra compuertas de forma permanente hasta volver a alternarse |
| Compuerta | Bloque sólido que se desliza **hacia arriba** al abrirse (tween de 200 ms); nunca mata y detiene el cierre si un personaje ocupa el tile destino (ver abajo) |
| Cristal oscuro | Sólido para ambos; Lumo lo disuelve al tocarlo: pierde solidez al instante y la animación de desaparición dura 300 ms |
| Barrera de luz | Sólida para ambos; Umbra la apaga al tocarla: pierde solidez al instante y la animación de desaparición dura 300 ms |
| Gema dorada / violeta | Solo la recoge su personaje; cuenta en el total de gemas del nivel |

El cristal oscuro y la barrera de luz son simétricos a propósito: cada personaje puede abrirle camino al otro, lo que refuerza la cooperación con un solo tipo de lógica (un bloque que se elimina al contacto del personaje correcto).

Criterio geométrico de "encima" / "pisar" (puertas y botones): se considera que un personaje está **encima** de la puerta, o **pisando** el botón, cuando la **cara inferior del personaje está en contacto con la cara superior del elemento** (colisión de suelo clásica de plataformas, la que produce Arcade Physics con los colliders). Rozar el lateral del elemento no cuenta.

**Compuertas:** bloque sólido mientras existe (no se atraviesan a medio abrir/cerrar). Abren deslizándose **hacia arriba**: se retraen en el tile superior y su hueco queda libre apenas comienza la apertura; requieren un tile libre arriba, que `validate-levels` verifica. Al cerrarse, si un personaje ocupa el tile destino, la compuerta **detiene el cierre** (se queda en su posición o se reabre) hasta que el tile quede libre: **nunca aplasta ni mata**. Criterio de "injusto" del checklist del Hito 4: una compuerta es injusta si (a) mata o aplasta a un personaje, o (b) deja a un personaje atrapado en un compartimento sin ningún switch o palanca alcanzable para reabrirlo.

**Palancas:** cualquiera de los dos personajes puede accionarlas. Alternan **por borde de contacto**: al entrar en contacto con un personaje alternan una sola vez, y no vuelven a alternar mientras se mantenga el contacto; hay que salir y volver a entrar para alternar de nuevo. El estado es **permanente** en el sentido de que dura hasta que se vuelve a alternar la palanca (o hasta el reinicio del nivel, ver *Victoria, derrota y puntaje*).

**Cristal oscuro y barrera de luz:** al tocarlos el personaje correcto, **pierden la solidez en el mismo instante** (ya se puede pasar); los 300 ms son solo la animación de disolución.

### Victoria, derrota y puntaje

- Si un personaje muere, partículas de muerte durante 0,5 s y reinicio automático del nivel.
- Prioridad de muerte: si en un mismo frame un personaje muere y el otro cumple la condición de victoria, **gana la muerte** y se reinicia el nivel. La victoria solo se evalúa si ambos personajes están vivos al final del frame.
- Reseteo (R y por muerte): **reset total del nivel** — spawns de ambos, cronómetro a 0, gemas sin recoger, botones sin pisar, palancas en su estado inicial, compuertas cerradas, cristales y barreras restaurados. Se mantiene el modo de control (1PJ/2PJ) y el progreso desbloqueado.
- Al ganar: pantalla de resultado con tiempo, gemas y estrellas.
- No existe puntaje numérico: el progreso se mide por **gemas recogidas** (contador X/Y), el **tiempo final** y las **estrellas**.
- Estrellas: 1 por terminar, 1 por recoger todas las gemas, 1 por terminar bajo el tiempo objetivo del nivel.
- Progreso (niveles desbloqueados y mejores estrellas) guardado en localStorage.

### Modo un jugador

Con Tab se alterna el control entre Lumo y Umbra; el personaje inactivo queda quieto (con física activa). Sirve para jugar solo y, sobre todo, para que el agente pruebe los niveles sin otra persona.

## Niveles

Los niveles son archivos JSON con una grilla de texto de 30 × 17 tiles de 32 px (960 × 544). Así el agente los genera y valida, y se editan a mano sin herramientas extra.

### Formato JSON del nivel

Cada `levels/NN.json` tiene esta estructura:

```json
{
  "timeTarget": 45,
  "grid": [
    "..............................",
    "  (17 filas de 30 caracteres)  ",
    ".............................."
  ],
  "entities": [
    { "type": "button", "id": "rojo", "x": 5, "y": 12 },
    { "type": "gate",   "id": "rojo", "x": 10, "y": 9 },
    { "type": "lever",  "id": "azul", "x": 20, "y": 12 }
  ]
}
```

- **`timeTarget`** (number, segundos): tiempo objetivo del nivel para la estrella de tiempo. Obligatorio; `validate-levels` lo exige y debe ser `> 0`.
- **`grid`** (array de 17 strings de 30 caracteres): terreno y elementos estáticos. Alfabeto de un carácter por tile:

| Carácter | Significado |
| --- | --- |
| `.` | Vacío |
| `#` | Pared / piso sólido (sólido para ambos) |
| `L` | Spawn de Lumo (exactamente uno por nivel) |
| `U` | Spawn de Umbra (exactamente uno por nivel) |
| `l` | Puerta de Lumo (exactamente una por nivel) |
| `u` | Puerta de Umbra (exactamente una por nivel) |
| `p` | Pozo de luz (disuelve a Umbra; Lumo lo atraviesa) |
| `s` | Pozo de sombra (apaga a Lumo; Umbra lo atraviesa) |
| `a` | Abismo (mata a ambos) |
| `c` | Cristal oscuro (Lumo lo disuelve) |
| `b` | Barrera de luz (Umbra la apaga) |
| `d` | Gema dorada (la recoge Lumo) |
| `v` | Gema violeta (la recoge Umbra) |

- **`entities`** (array): botones, palancas y compuertas, que necesitan **ID** para vincularse entre sí. Cada entidad tiene `type` (`button` \| `lever` \| `gate`), `id` (string compartido entre los elementos que se controlan entre sí) y `x` / `y` (columna y fila en la grilla, 0-based). Las compuertas se deslizan hacia arriba al abrirse (ver *Mecánicas > Elementos del nivel*).

Asignación de gemas: **dorada (`d`) = Lumo**, **violeta (`v`) = Umbra**. Un personaje que toca la gema del otro simplemente la ignora (no la recoge, no hay penalización).

`validate-levels` valida los archivos `NN.json` (01–08): nombre, `timeTarget`, grilla 17×30, alfabeto permitido, exactamente un `L` y un `U`, exactamente una `l` y una `u`, coherencia de `entities` (tipos válidos, IDs no vacíos, coordenadas dentro de la grilla) y que cada compuerta tenga un tile libre arriba para deslizarse. El archivo `levels/test.json` del Hito 2 es un nivel de prueba **fuera de la progresión**: el validador lo ignora (no exige el patrón `NN.json` ni lo cuenta).

### Progresión de los 8 niveles

1. **Primeros pasos:** moverse, saltar, llegar a las puertas. Sin peligros.
2. **No toques eso:** pozos de luz y de sombra; cada uno cruza el suyo.
3. **Cuidado los dos:** aparece el abismo.
4. **Mantenelo apretado:** un botón que uno pisa para abrirle paso al otro.
5. **Ida y vuelta:** botones cruzados; se turnan para avanzar.
6. **Disolver y apagar:** cristales oscuros y barreras de luz.
7. **Palancas:** cambios permanentes y orden de acciones. Las palancas son reversibles (se pueden re-alternar): el orden incorrecto agrega pasos o cambia el camino, pero **nunca** deja el nivel sin resolver (sin deadlock).
8. **Las ruinas:** combina todo; nivel más largo.

Los niveles los propone el agente, pero cada uno tiene que pasar la prueba jugando en modo un jugador antes de darlo por cerrado.

## Estética, juice y sonido

Todo el arte se genera por código: formas geométricas, colores planos y efectos. No hay sprites externos, así el agente puede producir y ajustar todo solo.

Estilo visual: ruinas al atardecer (fondo #1a1626, paredes #2e2a3d con borde más claro). Lumo es un círculo amarillo cálido con un halo suave; Umbra, una figura violeta oscura con contorno claro para que se distinga del fondo. Los pozos tienen superficie animada (onda senoidal): los de luz brillan y los de sombra ondulan como humo. Las texturas se generan al iniciar con Graphics + generateTexture en una escena de carga.

Paleta confirmada (vive en `src/config/colors.ts`):

| Elemento | Hex |
| --- | --- |
| Fondo | `#1a1626` |
| Pared | `#2e2a3d` |
| Borde de pared | `#4a4463` |
| Texto | `#f5efe0` |
| Lumo | `#ffd166` |
| Halo de Lumo | `#ffe9a8` |
| Umbra | `#7b4bbd` |
| Contorno de Umbra | `#c9a6ff` |
| Pozo de luz | `#ffe08a` |
| Pozo de sombra | `#4b2d73` |

Juice (en orden de prioridad):

1. Rastro de partículas: destellos para Lumo, volutas de humo violeta para Umbra.
2. Squash & stretch al saltar y aterrizar (tween de escala).
3. Explosión de partículas del color del personaje al morir + screen shake corto (150 ms).
4. Brillo en las puertas cuando su personaje está encima, usando el sistema de Filters de Phaser 4 (Glow).
5. Transición de fundido entre niveles.

Sonido: efectos cortos generados con jsfxr y exportados a .wav en `public/sfx/`. Solo estos cinco eventos tienen sonido: **salto, gema, botón, muerte y victoria**; los demás elementos (compuerta, palanca, cristal, barrera y puerta) no se sonorizan. Música: opcional y solo si sobra tiempo. Botón de silencio en la pausa.

Pantallas:

- **Menú principal:** [Un jugador] y [Dos jugadores] (no existe botón "Jugar"). Elegir el modo abre el **selector de niveles**.
- **Selector de niveles:** niveles 01–08 con sus estrellas; desbloqueo en orden; solo se puede elegir el nivel más alto desbloqueado o los ya completados.
- **HUD (durante el nivel):** tiempo en `mm:ss` (ej. `01:23`), gemas como `X/Y` (ej. `3/5`) e icono del modo (1P/2P). Sin estrellas en el HUD (no spoilear el objetivo de tiempo).
- **Pausa:** [Reanudar (Esc)] [Reiniciar (R)] [Silencio].
- **Resultado:** tiempo, gemas y estrellas, y los botones [Siguiente nivel] [Reintentar] [Volver al menú]. En el nivel 8 se omite "Siguiente" (queda [Reintentar] [Volver al menú]).

## Arquitectura

La regla central: la lógica del juego vive en `src/logic/` y no importa Phaser. Las escenas de Phaser solo dibujan, leen input y llaman a esa lógica. Así se pueden testear reglas con Vitest sin abrir el navegador.

```
lumo-y-umbra/
├── AGENTS.md              reglas para OpenCode
├── opencode.json
├── docs/
│   ├── DESIGN.md           este documento
│   ├── PROGRESS.md         hitos completados y pendientes (lo actualiza el agente)
│   └── phaser-skills/      copia de skills/ del repo oficial de Phaser
├── public/
│   └── sfx/
├── levels/                01.json … 08.json
├── scripts/
│   └── validate-levels.ts
├── src/
│   ├── main.ts             config de Phaser y lista de escenas
│   ├── config/             physics.ts, colors.ts, keys.ts
│   ├── logic/              SIN imports de Phaser
│   │   ├── levelParser.ts   grilla de texto → entidades tipadas
│   │   ├── rules.ts         quién muere en qué pozo, quién disuelve qué bloque
│   │   ├── switches.ts      botones, palancas, compuertas
│   │   ├── scoring.ts       estrellas y tiempos
│   │   └── progress.ts      guardado (recibe un storage inyectable)
│   ├── scenes/             Boot, Menu, LevelSelect, Game, Pause, Result
│   ├── objects/            Player, Door, Gate, Button, Hazard
│   └── fx/                 partículas, shake, transiciones
├── tests/                  *.test.ts de src/logic
```

Scripts de package.json: `dev`, `build`, `preview`, `test`, `validate-levels`, `typecheck` (`tsc --noEmit`). El agente debe correr `typecheck`, `test` y `validate-levels` antes de dar un hito por terminado.

Escena de juego: carga el JSON, lo pasa por `levelParser`, crea un tilemap o grupo estático de Arcade para paredes, y grupos para pozos, compuertas y gemas. Las colisiones y solapamientos llaman a funciones de `rules.ts` para decidir el resultado.

Modo debug: `?debug=1` en la URL activa el debug de Arcade Physics y permite saltar de nivel con las teclas 1-8.

## Fuera de alcance

Nada de esta lista entra en la versión 1, aunque el agente lo sugiera. Si sobra tiempo después del hito 6, se evalúa de a una cosa.

- Multijugador online o servidor de juego.
- Controles táctiles / mobile y soporte de gamepad.
- Editor de niveles dentro del juego.
- Cajas empujables, plataformas móviles, ascensores, ventiladores.
- Sprites o arte externo; música compuesta.
- Más de 8 niveles.
- Tablas de puntaje online, cuentas de usuario.

Primer candidato si sobra tiempo: una plataforma móvil simple que va y viene entre dos puntos.

## Plan por hitos

Son 6 hitos en unos 8 días hábiles. Cada hito termina con `typecheck`, `test` y `validate-levels` en verde, `docs/PROGRESS.md` actualizado, un commit, y prueba manual humana.

| Hito | Días | Entregable |
| --- | --- | --- |
| 1. Esqueleto | 0,5 | Proyecto que corre y muestra una escena |
| 2. Movimiento | 1,5 | Dos personajes que se sienten bien en un nivel de prueba |
| 3. Peligros y puertas | 1 | Niveles 1-3 jugables de principio a fin |
| 4. Botones y elementos | 1,5 | Niveles 4-7 jugables |
| 5. Pantallas y progreso | 1 | Menú, selector, resultado, guardado |
| 6. Pulido y nivel final | 2 | Juice, sonido, nivel 8, build final |

### Hito 1: Esqueleto

Prompt: "Leé docs/DESIGN.md y AGENTS.md. Creá el proyecto con Vite + TypeScript estricto y Phaser 4.2.1 fijado. Configurá Vitest, los scripts de package.json y la estructura de carpetas de la sección Arquitectura. Creá las escenas Boot y Game vacías; Game muestra el texto 'Lumo y Umbra'. Creá docs/PROGRESS.md."

- [ ] `npm run dev` muestra la escena en 960 × 544 escalada.
- [ ] `npm run typecheck` y `npm test` pasan (con un test de ejemplo).

### Hito 2: Movimiento

Prompt: "Implementá levelParser con tests, y los dos personajes con Arcade Physics según Mecánicas > Personajes y controles, incluyendo coyote time, jump buffer y salto variable. Creá levels/test.json con plataformas a distintas alturas. Agregá el modo un jugador con Tab y el modo debug."

- [ ] Los dos se mueven a la vez con sus teclas sin conflicto.
- [ ] Se puede saltar justo después de dejar un borde.
- [ ] Tab alterna el control.

### Hito 3: Peligros y puertas

Prompt: "Implementá rules.ts con tests para cada combinación personaje/pozo. Agregá pozos, muerte con reinicio, puertas, condición de victoria, la tecla R y el script validate-levels. Creá los niveles 1 a 3 según la Progresión."

- [ ] Cada personaje muere solo en lo que corresponde.
- [ ] Ganar requiere a los dos en sus puertas al mismo tiempo.
- [ ] Niveles 1-3 completables.

### Hito 4: Botones y elementos

Prompt: "Implementá switches.ts con tests (botones, palancas, compuertas por ID), y el cristal oscuro, la barrera de luz y las gemas. Creá los niveles 4 a 7 y verificá con validate-levels."

- [ ] Una compuerta se cierra al soltar su botón y no aplasta ni atrapa a nadie de forma injusta.
- [ ] Niveles 4-7 completables en modo un jugador.

### Hito 5: Pantallas y progreso

Prompt: "Agregá las escenas Menu, LevelSelect, Pause y Result, el HUD, scoring.ts y progress.ts con tests (storage inyectable, en el juego se usa localStorage dentro de try/catch)."

- [ ] El progreso y las estrellas persisten al recargar.
- [ ] Los niveles se desbloquean en orden.

### Hito 6: Pulido y nivel final

Prompt: "Implementá el juice en el orden de la sección Estética, los efectos de sonido y el nivel 8. Revisá que no queden console.log ni código muerto y que npm run build funcione."

- [ ] El build corre con `npm run preview` sin errores en consola.
- [ ] Los 8 niveles completables con 3 estrellas.

Si el agente se traba: pedirle que relea la skill de Phaser del subsistema afectado en `docs/phaser-skills/`, que agregue un test que reproduzca el problema si es lógica, o que active `?debug=1` y describa lo que pasa si es física.

## Decisiones de diseño (aclaraciones al documento)

Esta sección registra las ambigüedades detectadas en el análisis del documento y su resolución. Las decisiones **ya integradas** en las secciones correspondientes aparecen como resueltas; las **pendientes** se van resolviendo con el usuario antes del hito que las necesita. El `.docx` original no se modifica: esta sección y el cuerpo actualizado de `DESIGN.md` son la referencia vigente.

### Resueltas — bloque del Hito 2

| # | Ambigüedad | Decisión |
| --- | --- | --- |
| A1 | Formato del JSON de nivel | Grilla de 1 carácter por tile + array `entities` (botones/palancas/compuertas con `type`, `id`, `x`, `y`) + campo `timeTarget`. Alfabeto fijo en *Niveles > Formato JSON del nivel*. |
| A2 | Tiempo objetivo por nivel | Campo `timeTarget` (segundos) en cada `levels/NN.json`; obligatorio y validado por `validate-levels`. |
| A3 | "Aceleración alta" sin número | Aceleración 2400 px/s² y desaceleración 2400 px/s² al soltar las teclas. |
| A4 | Mecánica del salto variable | Al soltar la tecla en ascenso, `velocityY ×= 0.5` (solo si `velocityY < 0`). |
| B4 | Hitbox de los personajes | Rectángulo de colisión de 24 × 40 px centrado en el sprite. |
| B5 | Criterio de "encima"/"pisar" | Contacto de la cara inferior del personaje con la cara superior del elemento. |
| B3 | Colisión entre personajes | No colisionan entre sí; se ignoran en la física. |
| B8 | Personaje inactivo (Tab) | Velocidad horizontal a 0, física activa: puede caer y morir sin control. |
| M1 | Colores cualitativos | Paleta hex confirmada (ver *Estética*); vive en `src/config/colors.ts`. |
| — | Asignación de gemas | Dorada (`d`) = Lumo; violeta (`v`) = Umbra. El personaje equivocado la ignora. |
| — | `levels/test.json` | Nivel de prueba del Hito 2, fuera de la progresión; `validate-levels` lo ignora. |

### Resueltas — bloque del Hito 3

| # | Ambigüedad | Decisión |
| --- | --- | --- |
| A6 | Pozo para el personaje que no muere | El pozo es **sólido para ambos** (actúa como piso): el personaje vulnerable muere por contacto y el otro lo cruza sin efecto. "Atraviesa" = pasa por encima sin morir. El abismo es un hueco sin piso. |
| B1 | Efecto de la pausa (Esc) | Congela todo (física, cronómetro, animaciones); en pausa solo reanudar (Esc), reiniciar (R) o silenciar; Tab deshabilitado. |
| B2 | Muerte y victoria en el mismo frame | Gana la muerte: se reinicia el nivel. La victoria requiere ambos personajes vivos al final del frame. |
| B7 | Alcance del reseteo (R y por muerte) | Reset total del nivel (spawns, cronómetro, gemas, botones, palancas, compuertas, cristales, barreras); se mantiene el modo de control. |
| — | Letras del alfabeto | Confirmadas: `a` = abismo, `p` = pozo de luz, `s` = pozo de sombra. |

### Resueltas — bloque del Hito 4

| # | Ambigüedad | Decisión |
| --- | --- | --- |
| A5 | Compuertas | Bloque sólido mientras existe (con colisión durante el tween de 200 ms). Abren **hacia arriba** (se retraen 1 tile; require un tile libre arriba que `validate-levels` verifica). Nunca matan: al cerrarse, si un personaje ocupa el tile destino, **detienen el cierre** hasta que quede libre. |
| A7 | Palanca | Cualquiera de los dos puede usarla. Alterna **por borde de contacto** (una vez al entrar en contacto; no vuelve a alternar hasta salir y volver a entrar). Estado permanente hasta re-alternar o reiniciar el nivel. |
| A8 | Cristal oscuro / barrera de luz | Pierden la solidez **al instante** del contacto con el personaje correcto; los 300 ms son solo la animación de disolución. |
| B9 | Compuerta "injusta" (checklist Hito 4) | Injusta si (a) mata o aplasta a un personaje, o (b) deja a un personaje atrapado en un compartimento sin ningún switch/palanca alcanzable para reabrirlo. |
| B10 | Nivel 7: orden de acciones | Palancas reversibles (se pueden re-alternar): el orden incorrecto agrega pasos pero **nunca** deja el nivel sin resolver. |
| C3 | Reset de switches | Confirmado por B7: botones, palancas, compuertas, cristales, barreras y gemas se restauran con R y por muerte. |

### Resueltas — bloque del Hito 5

| # | Ambigüedad | Decisión |
| --- | --- | --- |
| C2 | Puntaje numérico vs. gemas + estrellas | No existe puntaje numérico: el progreso se mide por **gemas recogidas** (contador X/Y), **tiempo** y **estrellas**. En el documento se usa "gemas", no "puntaje". |
| M3 | Botón "Jugar" en el menú | No existe: el menú principal ofrece directamente **[Un jugador]** y **[Dos jugadores]**; elegir el modo abre el selector de niveles. |
| M4 | Botones de pausa y de resultado | Pausa: [Reanudar (Esc)] [Reiniciar (R)] [Silencio]. Resultado: [Siguiente nivel] [Reintentar] [Volver al menú]; en el nivel 8 se omite "Siguiente". |
| M5 | Formato del HUD | Tiempo en `mm:ss` (ej. `01:23`) + gemas `X/Y` (ej. `3/5`) + icono del modo (1P/2P). Sin estrellas en el HUD (no spoilear el objetivo de tiempo). |
| M2 | Efectos de sonido faltantes | Se mantienen **solo los 5 efectos** del documento (salto, gema, botón, muerte, victoria). Compuerta, palanca, cristal, barrera y puerta **no se sonorizan**. |

### Pendientes — resolver antes del hito indicado

**Hito 6 — Pulido (pueden quedar como convención del agente):**

| # | Ambigüedad |
| --- | --- |
| M6 | `objects/`: dónde viven palanca, cristal, barrera y gema respecto a la lista actual. |
| M7 | Tilemap vs. grupo estático de Arcade para las paredes. |
| M8 | Pause como escena separada u overlay; si Boot es la escena de carga de `generateTexture`. |
| M9 | Alcance final de `validate-levels` una vez cerrado el formato del JSON. |
| M10 | Criterio de "los 8 niveles completables con 3 estrellas" (por el agente en modo un jugador vs. por un jugador razon). |
| M11 | Fijar versiones de Vite, TypeScript y Vitest en `package.json` (solo Phaser está fija hoy). |
| C1 | Unificar "7 a 10 días" (*Resumen*) vs. "unos 8 días hábiles" (*Plan por hitos*). |
