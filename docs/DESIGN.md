# Documento de diseño: Lumo y Umbra

> Fuente canónica: `docs/Documento de diseño lumo y umbra.docx`. Este Markdown es la versión de referencia para el agente y el equipo.

## Resumen

Lumo y Umbra es un plataformero cooperativo de puzzles para dos jugadores en el mismo teclado, con 8 niveles y una duración de desarrollo objetivo de 7 a 10 días (el Plan por hitos estima 8 días hábiles dentro de ese rango). Lumo es un espíritu de luz que se apaga en la sombra; Umbra es un espíritu de sombra que se disuelve en la luz. Los dos tienen que llegar a sus puertas para ganar.

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

Teclas según el modo de control: en **dos jugadores** cada personaje usa las teclas de la tabla (Lumo A/D/W, Umbra flechas). En **un jugador** solo se usa el juego de teclas **A/D/W**, que maneja al personaje activo — sea Lumo o Umbra — y Tab alterna cuál de los dos está activo; las flechas quedan inactivas. Hasta que exista el selector de niveles con elección de modo (Hito 5), Tab cicla **2P → 1P(Lumo) → 1P(Umbra) → 2P** para poder probar los tres estados.

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

Hitbox de ambos personajes: rectángulo de colisión de **20 × 26 px** (menos de 1 tile en ancho y alto), con los pies en el borde inferior del sprite (24 × 30 px). **Los dos pasan por huecos y pasillos de 1 tile** (32 px). Valores en `src/config/physics.ts` (`PLAYER_BODY_*`, `PLAYER_TEXTURE_*`).

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

**Compuertas:** bloque sólido mientras existe (no se atraviesan a medio abrir/cerrar). Abren deslizándose **hacia arriba**: se retraen en el tile superior y su hueco queda libre apenas comienza la apertura. Arriba de cada compuerta tiene que haber un **dintel `#`** (compuerta de pasillo: al abrirse se esconde dentro del muro) o un **tile libre `.`** (compuerta usada como piso o puente: abierta queda translúcida en el aire); `validate-levels` lo verifica. Como los personajes caben en 1 tile, una compuerta de pasillo **nunca** puede tener un hueco libre arriba: el personaje pasaría por encima de la compuerta cerrada. Al cerrarse, si un personaje ocupa el tile destino, la compuerta **detiene el cierre** (se queda en su posición o se reabre) hasta que el tile quede libre: **nunca aplasta ni mata**. Criterio de "injusto" del checklist del Hito 4: una compuerta es injusta si (a) mata o aplasta a un personaje, o (b) deja a un personaje atrapado en un compartimento sin ningún switch o palanca alcanzable para reabrirlo.

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

Con Tab se alterna el control entre Lumo y Umbra: el activo se maneja con A/D/W (las flechas quedan inactivas) y el inactivo queda quieto (con física activa). En dos jugadores cada uno usa sus teclas. Sirve para jugar solo y, sobre todo, para que el agente pruebe los niveles sin otra persona.

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

- **`entities`** (array): botones, palancas y compuertas, que necesitan **ID** para vincularse entre sí. Cada entidad tiene `type` (`button` \| `lever` \| `gate`), `id` (string compartido entre los elementos que se controlan entre sí) y `x` / `y` (columna y fila en la grilla, 0-based). Las compuertas se deslizan hacia arriba al abrirse (ver *Mecánicas > Elementos del nivel*). Los botones y palancas se ubican **sobre el tile de piso** que se pisa (`x`/`y` apuntan a un `#`). IDs con color propio: `rojo`, `azul`, `verde`, `amarillo`. Una compuerta también puede usarse como **piso** (por ejemplo, un puente sobre el abismo): cerrada se pisa; abierta deja un hueco.
- **`hints`** (array, opcional): carteles de ayuda que se dibujan en el nivel, `{ "x": 4, "y": 2, "text": "..." }` (columna/fila de la esquina superior izquierda del texto, 1–80 caracteres). Se usan en los niveles que introducen una mecánica.

Asignación de gemas: **dorada (`d`) = Lumo**, **violeta (`v`) = Umbra**. Un personaje que toca la gema del otro simplemente la ignora (no la recoge, no hay penalización).

`validate-levels` valida los archivos `NN.json` (01–08): nombre, `timeTarget`, grilla 17×30, alfabeto permitido, exactamente un `L` y un `U`, exactamente una `l` y una `u`, coherencia de `entities` (tipos válidos, IDs no vacíos, coordenadas dentro de la grilla), que cada compuerta tenga arriba un dintel `#` o un tile libre `.`, que botones y palancas estén sobre un piso `#`, que cada compuerta tenga un botón o palanca con su ID (y viceversa) y que los `hints` sean válidos.

Además, `npm run solve-levels` (`scripts/solve-levels.mjs`) **resuelve** cada nivel: simula la física de Arcade (cuerpo 20 × 26, gravedad 1200, salto −480, velocidad 200, salto variable, techos, colisión lateral, pozos con margen de 2 px) y busca la secuencia cooperativa más corta (quién pisa qué botón, palancas, cristales y barreras). Lo corre dos veces: con la física normal y con una **conservadora** (salto −455, velocidad 190) para dejar margen. Informa si hay solución, cuántas gemas se alcanzan y si cada personaje podría llegar solo a su puerta (en los niveles cooperativos debe ser que no). Con `--atajos` (lo incluye `npm run solve-levels`) además **anula cada mecanismo por separado** (cada ID de botón/palanca, cada grupo de cristal y de barrera) y vuelve a resolver: si el nivel sigue teniendo solución sin ese botón o palanca, el puzzle **se puede saltear** y el comando falla. El archivo `levels/test.json` del Hito 2 es un nivel de prueba **fuera de la progresión**: el validador lo ignora (no exige el patrón `NN.json` ni lo cuenta).

### Progresión de los 8 niveles

Cada nivel usa la pantalla completa (30 × 17) con un **arquetipo distinto** y enseña o combina una idea. Los niveles que presentan una mecánica traen carteles (`hints`). Reglas de construcción (verificadas con `solve-levels`):

- **Saltos:** un escalón sube como máximo **2 tiles**; un hueco que se debe saltar mide como máximo **4 tiles**. Una plataforma no puede quedar 2 o 4 filas por encima del punto desde donde se salta (el techo corta el salto); 6 filas de separación es seguro.
- **Lo que bloquea tiene que bloquear de verdad:** un pozo que el otro personaje no debe poder saltar mide **≥ 5 tiles**; un abismo que no se debe poder saltar mide **≥ 6 tiles** (con 5 se cruza parado en el borde). En pasillos de 2 tiles de alto no se puede saltar nada.
- **Pozos sobre la cabeza:** un pozo del elemento contrario a menos de 6 filas por encima de donde camina un personaje lo mata al saltar (el contacto con la cara inferior también cuenta).
- **Tamaño de los personajes:** caben en 1 tile, así que **cualquier hueco de 1 tile es un pasaje**. Lo que deba bloquear tiene que cerrar el hueco entero (muros, bloques macizos, cristales/barreras que tapen todo el pasillo).
- **Compuertas:** dintel `#` justo arriba (la compuerta tapa todo el pasillo y al abrirse se esconde en el dintel); botones a los dos lados cuando hace falta volver. Las compuertas-puente (piso sobre el abismo) llevan aire arriba.

1. **Primeros pasos (torre y templo):** escalones para aprender a saltar, una gema de cada color en cada sector y un **muro con compuerta cooperativa** (botón a cada lado): uno pisa el botón y el otro pasa, después al revés. Escalera hasta el templo con las dos puertas.
2. **No toques eso (carriles cruzados):** abajo, un **pozo de luz** de 6 tiles que solo cruza Lumo; arriba, un carril con **pozo de sombra** que solo cruza Umbra. En el centro se **cruzan**: Lumo sube al carril de luz de la derecha (su puerta) y Umbra baja al pozo de sombra (la suya). Sin cooperación obligatoria: es el nivel para aprender qué pisa cada uno.
3. **Cuidado los dos (piedras sobre el abismo):** un abismo de 17 tiles. Lumo cruza saltando **piedras de luz** altas y Umbra **piedras de sombra** bajas (cada uno muere en las del otro). Al final, Lumo pisa un botón en su plataforma para abrirle a Umbra la compuerta de su puerta.
4. **Mantenelo apretado (relevo arriba/abajo):** Lumo va por un camino alto (entrada de luz) y Umbra por un túnel bajo (entrada de sombra). **Tres compuertas en relevo**: el botón de cada uno abre el camino del otro (rojo → azul → verde).
5. **Ida y vuelta (torres gemelas):** dos torres en zigzag separadas por un muro, cada una con 3 compuertas. **Los botones de cada torre abren las compuertas de la otra**, así que suben turnándose seis veces.
6. **Disolver y apagar:** Lumo empieza **encerrado por una barrera de luz** que Umbra apaga; después Lumo disuelve el **muro de cristal** que frena a Umbra. Sobre el abismo, Lumo cruza un **puente de barreras** (si Umbra lo toca, lo apaga) y Umbra un **piso de cristal** (si Lumo lo toca, lo rompe). Cada puerta está en una celda del material que abre el otro.
7. **Palancas (el puente que se abre):** **dos palancas azules** (una de cada lado) controlan a la vez la compuerta del muro y el **puente de compuertas** sobre el abismo: encendida abre el muro pero deja el puente abierto (hueco). Hay que encenderla, pasar, apagarla, cruzar y repetir desde el otro lado: el orden importa, pero nunca hay *deadlock* (las palancas se pueden volver a mover).
8. **Las ruinas (todo junto):** carriles de luz y sombra, abismo con piedra de luz y **piedras-compuerta verdes**, compuerta cooperativa y una **torre en zigzag** con barrera, cristal y una compuerta verde. La palanca verde (al inicio) abre la torre **pero también las piedras verdes**: Umbra tiene que cruzar el abismo antes de que la enciendan.

Los niveles 01–08 pasan `solve-levels` con la física normal y la conservadora, con las 4 gemas alcanzables. Los `timeTarget` son estimados y se ajustan jugando.

## Estética, juice y sonido

Todo el arte se genera por código: formas, degradés y efectos dibujados con **Canvas 2D** (`src/fx/art.ts`) y volcados a texturas con `textures.createCanvas` en `BootScene`. No hay sprites externos, así el agente puede producir y ajustar todo solo.

Estilo visual: ruinas al atardecer. Fondo con cielo en degradé, sol bajo, estrellas y siluetas de arcos y columnas en dos planos (tenues, para no competir con el nivel). Muros de piedra en ladrillos con 3 variantes y una cara superior iluminada con musgo cuando el tile está expuesto.

- **Lumo:** espíritu redondo, cálido, con una llamita, ojos y mejillas; contorno ámbar para que se lea sobre la luz. Lleva un **halo de luz aditivo** que late suavemente.
- **Umbra:** espíritu encapuchado violeta con borde inferior ondulado, contorno lavanda y **ojos brillantes**; lo rodea una penumbra. Los dos miran hacia donde se mueven.

**Lenguaje visual: sol = Lumo, luna = Umbra.** Todo lo que lleva **sol** lo puede tocar Lumo (pisarlo sin peligro o romperlo); todo lo que lleva **luna**, Umbra. Así se lee de un vistazo:

| Elemento | Cómo se ve | Emblema |
| --- | --- | --- |
| Pozo de luz | Líquido dorado brillante, superficie con ola senoidal, motas que suben | ☀ (lo pisa Lumo) |
| Pozo de sombra | Humo violeta oscuro con borde lavanda, volutas que suben | ☾ (lo pisa Umbra) |
| Abismo | Vacío casi negro con bruma violeta | — (nadie) |
| Cristal oscuro | Bloque facetado de amatista negra | ☀ (lo rompe Lumo) |
| Barrera de luz | Cortina de rayos dorados que titila | ☾ (la apaga Umbra) |
| Puertas | Pedestal con el emblema y un arco-portal encima | ☀ Lumo / ☾ Umbra |
| Botones, palancas, compuertas | Piezas grises teñidas con el color del ID; la palanca apagada se ve desaturada e inclinada a la izquierda, encendida a todo color e inclinada a la derecha; la compuerta abierta queda translúcida | color del ID |
| Gemas | Diamantes facetados dorados (Lumo) y violetas (Umbra) que flotan | color |

El menú muestra una leyenda con los dos personajes, sus teclas, su emblema y qué pisa/rompe cada uno.

Paleta base de UI y mecánicas (vive en `src/config/colors.ts`; la paleta del arte dibujado está en `ART_COLORS` de `src/fx/art.ts`):

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

1. Rastro de partículas: destellos para Lumo, volutas de humo violeta para Umbra. Además, partículas ambientales en cada pozo (motas de luz, humo de sombra, bruma del abismo) y estallido de partículas al disolverse un cristal o una barrera.
2. Squash & stretch al saltar y aterrizar (tween de escala).
3. Explosión de partículas del color del personaje al morir + screen shake corto (150 ms).
4. Brillo en las puertas cuando su personaje está encima, usando el sistema de Filters de Phaser 4 (Glow).
5. Transición de fundido entre niveles.

Sonido: efectos cortos generados con jsfxr y exportados a .wav en `public/sfx/`. Solo estos cinco eventos tienen sonido: **salto, gema, botón, muerte y victoria**; los demás elementos (compuerta, palanca, cristal, barrera y puerta) no se sonorizan. Música: opcional y solo si sobra tiempo. Botón de silencio en la pausa.

Pantallas:

- **Menú principal:** [Un jugador] y [Dos jugadores] (no existe botón "Jugar"). Elegir el modo abre el **selector de niveles**.
- **Selector de niveles:** niveles 01–08 con sus estrellas; desbloqueo en orden; solo se puede elegir el nivel más alto desbloqueado o los ya completados.
- **HUD (durante el nivel):** tiempo en `mm:ss` (ej. `01:23`), gemas como `X/Y` (ej. `3/5`) e icono del modo (1P/2P). Sin estrellas en el HUD (no spoilear el objetivo de tiempo).
- **Pausa:** [Reanudar (Esc)] [Reiniciar (R)] [Silencio] [Menú principal].
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
│   ├── validate-levels.ts
│   ├── solve-levels.mjs    simulador de física + solver cooperativo de niveles
│   └── generate-sfx.ts
├── src/
│   ├── main.ts             config de Phaser y lista de escenas
│   ├── config/             physics.ts, colors.ts, keys.ts
│   ├── logic/              SIN imports de Phaser
│   │   ├── levelParser.ts   grilla de texto → entidades tipadas
│   │   ├── rules.ts         quién muere en qué pozo, quién disuelve qué bloque
│   │   ├── switches.ts      botones, palancas, compuertas
│   │   ├── scoring.ts       estrellas y tiempos
│   │   └── progress.ts      guardado (recibe un storage inyectable)
│   ├── scenes/             Boot, Menu, LevelSelect, Game, Result (la pausa es un overlay de GameScene)
│   ├── objects/            Player, Door, Gate, Button, Lever, Gem, Crystal, Barrier, Hazard
│   └── fx/                 art.ts (arte en Canvas 2D), partículas, sonido, transiciones
├── tests/                  *.test.ts de src/logic
```

Notas de arquitectura:

- **Paredes, pisos y pozos sólidos:** grupo estático de Arcade (`staticGroup`) generado desde `levelParser` a partir de la grilla (sin tilemap).
- **Pausa:** overlay dentro de `GameScene` (rectángulo oscuro + botones); congela todo con `physics.pause()` y deteniendo cronómetro y tweens. No existe una escena `Pause`.
- **Carga de texturas:** `BootScene` genera todo el arte por código (Canvas 2D de `src/fx/art.ts` → `textures.createCanvas`) antes de arrancar el menú.
- **Gancho de desarrollo:** solo con `npm run dev` (`import.meta.env.DEV`), `main.ts` expone `window.__lumoGame` para que las capturas automáticas (Playwright) abran niveles. No existe en el build.

Scripts de package.json: `dev`, `build`, `preview`, `test`, `validate-levels`, `solve-levels`, `generate-sfx`, `typecheck` (`tsc --noEmit`). El agente debe correr `typecheck`, `test` y `validate-levels` antes de dar un hito por terminado, y `solve-levels` cada vez que cambie un nivel.

Escena de juego: carga el JSON, lo pasa por `levelParser`, crea un grupo estático de Arcade con las paredes y los pozos sólidos, y grupos para compuertas y gemas. Las colisiones y solapamientos llaman a funciones de `rules.ts` para decidir el resultado.

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
- [ ] Los 8 niveles completables en modo un jugador; la estrella de tiempo se verifica por cálculo de rutas (existe una ruta que recoge todas las gemas bajo el objetivo).

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
| B4 | Hitbox de los personajes | Rectángulo de colisión de 24 × 40 px centrado en el sprite. **Reemplazado por V5** (20 × 26 px). |
| B5 | Criterio de "encima"/"pisar" | Contacto de la cara inferior del personaje con la cara superior del elemento. |
| B3 | Colisión entre personajes | No colisionan entre sí; se ignoran en la física. |
| B8 | Personaje inactivo (Tab) | Velocidad horizontal a 0, física activa: puede caer y morir sin control. |
| — | Teclas en modo un jugador | En 1P el personaje **activo** (Lumo o Umbra) se maneja con **A/D/W** y las flechas quedan inactivas; Tab alterna quién está activo. En 2P cada uno con sus teclas. Hito 2 (sin menú): Tab cicla 2P → 1P(Lumo) → 1P(Umbra) → 2P. |
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

### Resueltas — bloque del Hito 6

| # | Ambigüedad | Decisión |
| --- | --- | --- |
| M6 | Objetos del nivel | `src/objects/` = { Player, Door, Gate, Button, Lever, Gem, Crystal, Barrier, Hazard }. Cada objeto con su lógica y su visual; Crystal y Barrier comparten una base mínima de bloque que se disuelve al contacto con el personaje correcto. |
| M7 | Paredes/pisos/pozos sólidos | **staticGroup** de Arcade generado desde `levelParser` a partir de la grilla; sin tilemap. |
| M8 | Pausa y carga de texturas | Pausa = **overlay dentro de `GameScene`** (`physics.pause()` + cronómetro y tweens detenidos); no existe escena Pause. `BootScene` genera el arte por código antes de arrancar (desde V1: Canvas 2D en vez de `Graphics + generateTexture`). |
| M9 | Alcance de `validate-levels` | Confirmado el alcance completo documentado: nombre `NN.json` (ignora `test.json` y no-NN), `timeTarget` número > 0, grilla 17×30, alfabeto permitido, exactamente un `L`/`U`/`l`/`u`, `entities` válidas (type `button\|lever\|gate`, id no vacío, x/y dentro de la grilla) y tile libre arriba en cada compuerta. |
| M10 | Criterio de los 8 niveles | Completabilidad probada en **modo un jugador**; la estrella de tiempo se verifica por **cálculo de rutas** (no hace falta que el agente baje el cronómetro jugando). |
| M11 | Versiones en `package.json` | Se fijan **sin `^`**: `typescript 7.0.2`, `vite 8.3.3`, `vitest 5.0.3`, `@types/node 24.19.1` (Phaser ya estaba en 4.2.1). |
| C1 | Duraciones (*Resumen* vs. *Plan*) | Se mantiene "7 a 10 días" y se aclara que el plan estima "8 días hábiles" dentro de ese rango. |

### Resueltas — rediseño de niveles (post-Hito 6)

| # | Ambigüedad | Decisión |
| --- | --- | --- |
| N1 | Niveles planos | Los 8 niveles se rediseñan **multinivel** (plataformas a distintas alturas, escaleras y desniveles) al estilo *Fireboy and Watergirl*, conservando los elementos y la progresión de mecánicas. |
| N2 | Progresión de mecánicas | Se relaja: la **primera compuerta cooperativa** (dos botones del mismo ID, uno a cada lado) aparece en el nivel **1**, en vez de introducirse recién en el 4. |
| N3 | Anti-salto de compuertas/bloques | Cada compuerta, y cada cristal/barrera que deba bloquear, lleva encima un bloque sólido (**lintel** o **techo/tramo bajo techo**) que impide saltarlo por arriba. Verificado por la geometría del salto (≈3 tiles de alto). |
| N4 | Cajas y plataformas móviles | Siguen **fuera de alcance**; el rediseño no las introduce. |
| N5 | Uso de la pantalla | Los niveles **1 a 4** se rediseñan para **llenar las 30 × 17 celdas** en ancho y alto (una sola pantalla, `Scale.FIT`, sin scroll) y **variar el arquetipo por nivel** (torre, pozos, abismo, compuertas encadenadas). Los niveles 5-8 quedan pendientes de revisión con el mismo criterio. |
| N6 | Bloqueo de compuertas cooperativas | El muro que aloja la compuerta ocupa la **columna completa (filas 0-12)**, de modo que no se puede rodear la compuerta ni por arriba ni por los lados; la fila 13 queda libre como tile de retracción (la exige `levelParser`). |
| N6b | Verificación de alcance | Para los niveles 1-4 se comprobó con un **simulador de la física real** (AABB 24 × 40, gravedad 1200, salto −480, techo y colisión lateral) que ambos spawns alcanzan sus puertas y sus 4 gemas. El checker anterior (sin colisión lateral) daba falsos positivos; el simulador detectó que el primer rediseño de 01-04 no era pasable (techos de plataformas sobre el arco de salto y plataformas pegadas a muros). Los niveles 5–8 quedan pendientes de ese pase. |
| N7 | Pasabilidad por encima del llenado de pantalla | Ante el conflicto entre "llenar las 30 × 17 celdas" y una geometría saltable, se **prioriza la pasabilidad**: escalones de **≤2 tiles** de altura y **≤4 tiles** de ancho, sin plataformas superpuestas sobre la trayectoria del salto. Puede quedar la parte superior libre. Los `timeTarget` (01: 45 s, 02: 50 s, 03: 55 s, 04: 55 s) quedan a revisar jugando. |

### Resueltas — rediseño visual y de niveles (v2)

| # | Problema | Decisión |
| --- | --- | --- |
| V1 | Con formas planas no se entendía qué era cada cosa | El arte pasa a **Canvas 2D** (`src/fx/art.ts`): degradés, brillos y detalles. Sigue siendo 100 % por código, sin assets externos. Reemplaza a `Graphics + generateTexture` (que no soporta degradés en la textura generada). |
| V2 | No se sabía qué pozo pisaba cada uno | **Sol = Lumo, luna = Umbra** en todo lo que cada uno puede tocar: pozos, cristal (sol), barrera (luna) y puertas. Pozo de luz = líquido dorado brillante con motas; pozo de sombra = humo violeta oscuro con borde lavanda. Leyenda en el menú. |
| V3 | Personajes poco expresivos | Lumo con llamita, ojos y halo aditivo; Umbra encapuchado con ojos brillantes y penumbra. Miran hacia donde se mueven y desaparecen tras la explosión al morir. |
| V4 | Mecanismos poco legibles | Botón que sobresale del piso; palanca inclinada (izquierda = apagada y desaturada, derecha = encendida a color); compuerta tipo rastrillo que queda **translúcida** al abrirse; puerta con arco-portal. |
| N8 | Niveles poco interesantes | Los **8 niveles se rediseñan desde cero** con un arquetipo por nivel (ver *Progresión*) y más cooperación real: relevos, torres gemelas con botones cruzados, celdas de barrera/cristal, puente de compuertas con palancas y orden de acciones. |
| N9 | Verificación de pasabilidad | Nuevo `npm run solve-levels` (ya no es un archivo temporal): física aproximada de Arcade + búsqueda de la secuencia cooperativa. Los 8 niveles tienen solución con física normal y conservadora y las 4 gemas son alcanzables. Reemplaza los criterios N5–N7. |
| N10 | Explicar mecánicas nuevas | Campo opcional **`hints`** en el JSON del nivel (carteles dibujados en el escenario). |
| N11 | Reglas de construcción | Pozos que deben bloquear: ≥ 5 tiles; abismos que deben bloquear: ≥ 6 tiles; pozos del elemento contrario a ≥ 6 filas por encima de donde se camina; botones/palancas sobre `#`; cada compuerta con su botón/palanca (lo valida `validate-levels`). |
| V5 | Los personajes no pasaban por huecos de 1 tile | Personajes más chicos: hitbox **20 × 26 px** y sprite 24 × 30 px (antes 24 × 40). Pasan por pasillos y huecos de 1 tile. El squash & stretch mantiene los pies en el piso. |
| N12 | Atajos por el tamaño reducido | Con 1 tile de alto, el tile libre de retracción encima de cada compuerta dejaba pasar **por encima de la compuerta cerrada** en todos los niveles. Se cambia la regla: las compuertas de pasillo llevan **dintel `#` justo arriba** y se esconden en él al abrirse (dibujadas por debajo de los muros); las compuertas-puente siguen con aire arriba. `validate-levels` acepta `#` o `.` arriba. `solve-levels --atajos` confirma que ningún botón ni palanca se puede saltear en 01–08. |
| N13 | Quedarse parado en el hueco de una compuerta | Regla vigente (A5): una compuerta no se cierra mientras alguien ocupa su tile. Por eso, en las compuertas cooperativas de 1 y 8, quien pasa puede quedarse en el hueco para que el otro cruce sin usar el segundo botón. Es un atajo menor (el primer botón sigue siendo obligatorio) y se mantiene para no arriesgar que la compuerta atrape o aplaste a alguien. |
| U1 | Salir del nivel desde la pausa | La pausa suma **[Menú principal]**: vuelve al menú sin guardar el intento en curso (el progreso ya ganado no se toca). |

