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

Teclas globales: R reinicia el nivel al instante, Esc pausa, Tab cambia de personaje en modo un jugador.

Parámetros de movimiento iniciales: velocidad horizontal 200 px/s, aceleración alta para respuesta inmediata, gravedad 1200 px/s², salto -480 px/s. Incluir coyote time (100 ms para saltar después de dejar el borde) y jump buffer (100 ms para registrar el salto apretado justo antes de tocar el piso). Salto variable: soltar la tecla corta el salto.

### Elementos del nivel

| Elemento | Comportamiento |
| --- | --- |
| Pared / piso | Sólido para ambos |
| Pozo de luz | Disuelve a Umbra; Lumo lo atraviesa |
| Pozo de sombra | Apaga a Lumo; Umbra lo atraviesa |
| Abismo | Mata a ambos |
| Puerta de Lumo / de Umbra | Se ilumina cuando su personaje está encima; el nivel se gana con ambos en su puerta |
| Botón | Activo mientras algún personaje lo pisa; abre las compuertas de su mismo color/ID |
| Palanca | Se alterna al tocarla; abre o cierra compuertas de forma permanente |
| Compuerta | Bloque sólido que se desliza al abrirse (tween de 200 ms) |
| Cristal oscuro | Sólido para ambos; Lumo lo disuelve al tocarlo (desaparece en 300 ms) |
| Barrera de luz | Sólida para ambos; Umbra la apaga al tocarla (desaparece en 300 ms) |
| Gema dorada / violeta | Solo la recoge su personaje; suma al puntaje |

El cristal oscuro y la barrera de luz son simétricos a propósito: cada personaje puede abrirle camino al otro, lo que refuerza la cooperación con un solo tipo de lógica (un bloque que se elimina al contacto del personaje correcto).

### Victoria, derrota y puntaje

- Si un personaje muere, partículas de muerte durante 0,5 s y reinicio automático del nivel.
- Al ganar: pantalla de resultado con tiempo, gemas y estrellas.
- Estrellas: 1 por terminar, 1 por recoger todas las gemas, 1 por terminar bajo el tiempo objetivo del nivel.
- Progreso (niveles desbloqueados y mejores estrellas) guardado en localStorage.

### Modo un jugador

Con Tab se alterna el control entre Lumo y Umbra; el personaje inactivo queda quieto (con física activa). Sirve para jugar solo y, sobre todo, para que el agente pruebe los niveles sin otra persona.

## Niveles

Los niveles son archivos JSON con una grilla de texto de 30 × 17 tiles de 32 px (960 × 544). Así el agente los genera y valida, y se editan a mano sin herramientas extra.

### Progresión de los 8 niveles

1. **Primeros pasos:** moverse, saltar, llegar a las puertas. Sin peligros.
2. **No toques eso:** pozos de luz y de sombra; cada uno cruza el suyo.
3. **Cuidado los dos:** aparece el abismo.
4. **Mantenelo apretado:** un botón que uno pisa para abrirle paso al otro.
5. **Ida y vuelta:** botones cruzados; se turnan para avanzar.
6. **Disolver y apagar:** cristales oscuros y barreras de luz.
7. **Palancas:** cambios permanentes y orden de acciones.
8. **Las ruinas:** combina todo; nivel más largo.

Los niveles los propone el agente, pero cada uno tiene que pasar la prueba jugando en modo un jugador antes de darlo por cerrado.

## Estética, juice y sonido

Todo el arte se genera por código: formas geométricas, colores planos y efectos. No hay sprites externos, así el agente puede producir y ajustar todo solo.

Estilo visual: ruinas al atardecer (fondo #1a1626, paredes #2e2a3d con borde más claro). Lumo es un círculo amarillo cálido con un halo suave; Umbra, una figura violeta oscura con contorno claro para que se distinga del fondo. Los pozos tienen superficie animada (onda senoidal): los de luz brillan y los de sombra ondulan como humo. Las texturas se generan al iniciar con Graphics + generateTexture en una escena de carga.

Juice (en orden de prioridad):

1. Rastro de partículas: destellos para Lumo, volutas de humo violeta para Umbra.
2. Squash & stretch al saltar y aterrizar (tween de escala).
3. Explosión de partículas del color del personaje al morir + screen shake corto (150 ms).
4. Brillo en las puertas cuando su personaje está encima, usando el sistema de Filters de Phaser 4 (Glow).
5. Transición de fundido entre niveles.

Sonido: efectos cortos generados con jsfxr y exportados a .wav en `public/sfx/` (salto, gema, botón, muerte, victoria). Música: opcional y solo si sobra tiempo. Botón de silencio en la pausa.

Pantallas: menú principal (Jugar, Un jugador / Dos jugadores), selector de niveles con estrellas, HUD mínimo (tiempo y gemas), pausa y resultado.

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
