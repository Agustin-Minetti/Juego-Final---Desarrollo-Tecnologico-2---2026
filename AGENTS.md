# AGENTS.md — Lumo y Umbra

Juego de plataformas cooperativo para dos jugadores en el mismo teclado.
Stack: **Phaser 4.2.1 + Vite + TypeScript (strict) + Vitest**. Corre en navegador, sin backend.
Resolución base 960 × 544 (grilla de 30 × 17 tiles de 32 px).

**Rutas reales de referencia:**

| Qué | Ruta |
| --- | --- |
| Documento principal de requisitos (GDD) | `docs/Documento de diseño lumo y umbra.docx` |
| Documentación del proyecto | `docs/` |
| Avance de hitos | `docs/PROGRESS.md` (cuando exista) |
| Skills de Phaser 4 | `docs/phaser-skills/` (cuando exista) |
| Código | `src/` (cuando exista) |
| Niveles | `levels/01.json` … `08.json` (cuando existan) |
| Tests | `tests/*.test.ts` (cuando existan) |

> El repositorio arranca solo con `README.md` y el `.docx`: `package.json`, `src/`, `docs/DESIGN.md`, `docs/PROGRESS.md` y `docs/phaser-skills/` se crean en el Hito 1. Si `docs/DESIGN.md` llega a existir y contiene el mismo diseño, **pasa a ser la referencia canónica** y este archivo debe ajustarse para citarlo.

---

## 1. Alcance y contexto

- Aplicar estas instrucciones al inicio de cada consulta y antes de modificar el proyecto.
- Responder en **español**, con la profundidad de análisis proporcional a la complejidad de la solicitud.
- Identificar las rutas reales de la documentación y del documento principal de requisitos (tabla superior) antes de citar nada; verificar que los archivos existan en el momento de la consulta.
- Revisar la información vigente en disco (documento de diseño, código, `PROGRESS.md`, estado de Git). **No depender exclusivamente de resúmenes de conversaciones anteriores**: el estado del proyecto cambia entre consultas.
- Preservar el trabajo existente del usuario: no sobrescribir, revertir ni descartar cambios locales ajenos a la tarea.
- Trabajá solo en el hito actual del **Plan por hitos**. No agregues features fuera del documento de diseño (ver sección "Fuera de alcance").

## 2. Revisar la documentación y el requisito

Antes de proponer o implementar una solución:

1. Identificar el requisito solicitado y su comportamiento esperado.
2. Revisar la carpeta de documentación del proyecto: `docs/`.
3. Consultar las secciones pertinentes del documento principal de requisitos:
   - **GDD del juego:** `docs/Documento de diseño lumo y umbra.docx`. Las secciones vigentes son: *Resumen*, *Stack técnico*, *Mecánicas* (Personajes y controles / Elementos del nivel / Victoria, derrota y puntaje / Modo un jugador), *Niveles*, *Estética, juice y sonido*, *Arquitectura*, *Fuera de alcance*, *Plan por hitos*.
4. Clasificar el requisito como:
   - **Definido:** la documentación describe suficientemente el comportamiento.
   - **Parcialmente definido:** está contemplado, pero faltan detalles necesarios.
   - **No definido:** no aparece en la documentación revisada.
   - **En contradicción:** la solicitud difiere de una regla documentada.
   - **No aplica:** es una consulta técnica o documental sin una regla funcional asociada.
5. Citar el documento y la sección que respaldan el análisis.
   - El documento de requisitos es un **`.docx`**: citar por el **título de la sección o subsección** (ej. *Mecánicas > Elementos del nivel*).
   - Si se exporta a PDF, indicar la página y distinguir la numeración del archivo de la numeración impresa si difieren.
   - Si la referencia es un Markdown (ej. `docs/DESIGN.md`, `docs/PROGRESS.md`), citar el título o número del apartado.
6. Diferenciar claramente **reglas documentadas**, **propuestas del agente** y **supuestos**.

Si la documentación no existe o no puede leerse, indicarlo claramente y no afirmar que el requisito está definido o ausente.

Un requisito no documentado puede ser una ampliación válida: identificarlo como tal y consultar las decisiones necesarias antes de implementarlo.

No modificar el documento de requisitos (`.docx`, `DESIGN.md` u otro) para justificar una implementación sin una solicitud explícita del usuario.

## 3. Analizar conflictos e impacto

Antes de modificar una funcionalidad:

- Revisar tanto las reglas documentadas como la implementación existente.
- Identificar dependencias, restricciones compartidas, excepciones, prioridades entre comportamientos y posibles regresiones.
- Analizar las interacciones con otras funcionalidades.
- Comparar el comportamiento actual con la documentación; **no asumir que el código existente es necesariamente correcto**.
- Detectar contradicciones internas de la documentación, incluidas diferencias entre texto, tablas, diagramas e imágenes del `.docx`.
- Comunicar los conflictos relevantes antes de modificar la parte afectada.

En este proyecto, considerar cuando corresponda:

- **Personajes y controles:** teclas de Lumo (A/D/W) y de Umbra (←/→/↑), teclas globales (R reinicia, Esc pausa, Tab cambia de personaje en modo un jugador); conflicto de input y modo de un jugador con personaje inactivo quieto pero con física activa.
- **Movimiento y física:** velocidad, gravedad, salto variable, coyote time (100 ms) y jump buffer (100 ms); cambios que alteren el "feel".
- **Pozos, abismo y muerte:** Lumo muere en pozo de sombra y abismo; Umbra en pozo de luz y abismo; el otro personaje atraviesa su pozo. Reinicio automático del nivel.
- **Elementos del nivel:** paredes, puertas (victoria solo con ambos encima al mismo tiempo), botones (mismo color/ID), palancas (estado permanente), compuertas (tween de 200 ms), cristal oscuro (Lumo lo disuelve), barrera de luz (Umbra la apaga), gemas doradas/violetas.
- **Encadenados y prioridades:** compuertas que se cierran al soltar un botón sin atrapar ni aplastar de forma injusta, órdenes de acciones en palancas, interacciones que habilitan camino al otro personaje.
- **Niveles:** JSON de 30 × 17 tiles, validación con `validate-levels`, progresión de los 8 niveles, completabilidad en modo un jugador.
- **Victoria, puntaje y progreso:** estrellas (1 por terminar, 1 por todas las gemas, 1 bajo el tiempo objetivo), guardado en `localStorage`.
- **Pantallas y navegación:** menú, selector de niveles, pausa, resultado; desbloqueo en orden.
- **Alcance de plataforma:** teclado de escritorio. Controles táctiles/móvil y gamepad están **fuera de alcance** en la versión 1.

## 4. Preguntar antes de avanzar ante dudas

Cuando una duda afecte el alcance, las reglas, el comportamiento, la compatibilidad o la implementación:

- Usar la herramienta de preguntas al usuario disponible en el entorno (por ejemplo, `question`).
- Formular preguntas concretas.
- Explicar qué decisión falta y por qué importa.
- Ofrecer opciones cuando faciliten la decisión.
- Incluir una recomendación fundamentada cuando corresponda.
- Esperar la respuesta antes de adoptar una decisión que cambie el comportamiento solicitado.
- No inventar reglas para resolver omisiones o contradicciones del documento de diseño.
- Continuar con tareas independientes cuyo alcance esté claro.

Si la herramienta de preguntas no está disponible, preguntar directamente en la conversación y esperar la aclaración necesaria.

## 5. Utilizar POO y patrones de diseño

- Modelar las entidades y comportamientos del dominio con programación orientada a objetos, respetando la arquitectura del proyecto (TypeScript estricto, Phaser 4 en `src/scenes/` y `src/objects/`, lógica pura en `src/logic/`).
- Encapsular el estado y las reglas en las entidades correspondientes (Player, Door, Gate, Button, Hazard, etc.).
- Mantener responsabilidades claras, alta cohesión y bajo acoplamiento.
- Favorecer composición cuando evite jerarquías de herencia innecesarias.
- Separar la lógica de negocio (`src/logic/`, sin imports de Phaser) de la presentación y la entrada del usuario (escenas de Phaser).
- Utilizar patrones de diseño cuando resuelvan una necesidad concreta, explicando brevemente su elección y utilidad.
- Evitar abstracciones innecesarias y refactorizaciones ajenas al requisito.

Ejemplos orientativos para este juego: **State** para estados del nivel o del personaje (vivo/muerto, compuerta abierta/cerrada), **Strategy** para comportamientos variables (muerte por tipo de pozo, efecto de bloque según quién lo toca), **Factory** para crear entidades desde el JSON parseado, **Observer/EventEmitter** de Phaser para actualizar HUD e interfaz ante eventos.

No imponer estos patrones cuando no aporten valor.

## 6. Reutilizar código existente

Antes de crear clases, componentes, servicios o utilidades:

1. Buscar implementaciones relacionadas en `src/` (y en `src/logic/` primero, para reglas de negocio).
2. Revisar sus contratos, comportamiento y consumidores.
3. Priorizar su reutilización o extensión cuando sean compatibles.
4. Evitar duplicar lógica de negocio.
5. Extraer lógica común solo cuando exista una necesidad real, preservando el comportamiento de sus consumidores.
6. Respetar las convenciones de estructura, nombres y estilo del proyecto (árbol de carpetas de la sección *Arquitectura*, constantes en `src/config/`, tests en `tests/`).

Si no existe código reutilizable (por ejemplo, antes del Hito 1), indicarlo y diseñar una solución coherente con la arquitectura documentada.

Repetir esta revisión en cada tarea; no asumir que la estructura permanece igual entre consultas.

## 7. Consultar sobre sprites y recursos gráficos

Contexto de este proyecto: **todo el arte se genera por código** (`Graphics + generateTexture` en la escena de carga); no hay sprites externos y el arte externo está fuera de alcance. El sonido son `.wav` generados con jsfxr en `public/sfx/`.

Cuando una tarea requiera recursos visuales o sonoros:

1. Revisar los recursos disponibles y sus convenciones de uso (texturas ya generadas, colores de `src/config/colors.ts`, archivos en `public/sfx/`).
2. Usar la herramienta de preguntas antes de implementar la parte visual para confirmar si se desea:
   - **Generar un mockup / textura provisional por código:** representación temporal para desarrollar y validar la funcionalidad.
   - **Utilizar un recurso existente:** solicitar el nombre exacto del recurso (textura generada o archivo en `public/sfx/`).
3. Si el recurso indicado no puede localizarse, pedir su ruta o el archivo correspondiente.

Además:

- No asumir qué textura, color ni sonido utilizar ni inventar nombres o rutas.
- Si se elige un mockup, aclarar que es provisional y confirmar el alcance visual necesario.
- Si se elige un recurso existente, comprobar su disponibilidad y compatibilidad con el uso previsto.
- Consultar detalles de spritesheet, fotogramas o animaciones cuando sean necesarios y no estén documentados.
- Si falta el archivo, solicitarlo antes de avanzar con la parte que depende de él; continuar con la lógica independiente de los recursos gráficos mientras se resuelve la consulta.

## 8. Definir y preparar el flujo Git

Antes de implementar:

- Comprobar que el proyecto usa Git y revisar: `git status`, rama actual, `git remote -v`, `git log --oneline -10`.
- Estrategia acordada para este repositorio: **rama base `main`, sin GitFlow y sin `develop`**.
- Crear una rama de trabajo antes de modificar el código, con nombre descriptivo:
  - `feature/<descripcion>`
  - `fix/<descripcion>`
  - `docs/<descripcion>`
  - `refactor/<descripcion>`
- Si ya existe una rama apropiada para la tarea, verificar si corresponde continuar en ella.
- No implementar directamente sobre `main`.
- Empujar la rama al remoto `origin` con seguimiento (`-u origin <rama>`).
- La creación de un pull request y la fusión en `main` requieren autorización adicional del usuario.

Si existen cambios previos del usuario:

- Preservarlos.
- Identificar si interfieren con la tarea.
- Consultar antes de operaciones que puedan moverlos, descartarlos o mezclarlos con otros cambios.

Si el proyecto no tiene repositorio Git o remoto configurado, informar la situación y consultar antes de inicializarlo o configurarlo.

## 9. Implementar y verificar

- Definir criterios de aceptación a partir del requisito, la documentación y las aclaraciones del usuario (los puntos de verificación de cada hito sirven como base).
- Realizar cambios enfocados en el alcance acordado; nada fuera del documento de diseño sin autorización.
- Reglas técnicas del proyecto:
  - **Phaser 4, NO Phaser 3.** Muchas APIs cambiaron: antes de usar un subsistema (física, partículas, filters, tweens, input), leer la skill correspondiente en `docs/phaser-skills/`; si dudás de una API, consultar la skill de migración v3 → v4. Si `docs/phaser-skills/` no existe, decirlo y consultar la documentación oficial de Phaser 4 en lugar de asumir APIs de la v3.
  - TypeScript estricto: nada de `any` sin justificar en un comentario.
  - `src/logic/` **no importa Phaser**: toda regla de juego vive ahí y tiene tests con Vitest en `tests/`.
  - Constantes de física, colores y teclas en `src/config/`, nunca hardcodeadas.
  - `localStorage` siempre dentro de `try/catch`.
  - Arte solo por código; sin assets externos.
- Ejecutar las comprobaciones disponibles y pertinentes al cambio. Antes de dar un hito por terminado: `npm run typecheck`, `npm test` y `npm run validate-levels` (verificar en `package.json` que los scripts existan antes de invocarlos; si no existen aún, informarlo).
- Verificar las interacciones identificadas durante el análisis de impacto. Modo debug: `?debug=1` en la URL y teclas 1–8 para saltar de nivel.
- Agregar pruebas cuando aporten valor para validar reglas o prevenir regresiones; evitar pruebas que solo repliquen la implementación.
- Actualizar `docs/PROGRESS.md` con lo hecho y lo pendiente cuando el archivo exista.
- Informar qué se verificó y qué quedó pendiente. **No afirmar resultados que no fueron comprobados.**

## 10. Solicitar confirmación y realizar commit y push

Cuando termine la implementación:

1. Presentar al usuario:
   - Resumen del comportamiento implementado.
   - Archivos afectados.
   - Verificaciones realizadas y sus resultados.
   - Pendientes o limitaciones reales.
   - Rama de trabajo utilizada.
   - Qué debe probar el humano manualmente, si aplica.
2. Usar la herramienta de preguntas para solicitar:
   - Confirmación de que la implementación es aceptada.
   - Autorización explícita para realizar commit y push.
3. Esperar la respuesta.
4. Si el usuario solicita ajustes: realizarlos, repetir las verificaciones afectadas y volver a solicitar confirmación.

Después de recibir autorización:

1. Revisar `git status`, `git diff` y `git log --oneline -10`.
2. Revisar los archivos nuevos que se incluirán.
3. Preparar únicamente los cambios correspondientes a la tarea, sin incluir cambios ajenos ni secretos.
4. Crear un commit descriptivo, coherente con las convenciones del repositorio.
5. Realizar push de la rama al remoto acordado, configurando su seguimiento cuando corresponda.
6. Informar nombre de la rama, identificador y mensaje del commit, y resultado del push.

No realizar commit ni push sin autorización explícita del usuario.

No hacer force push, omitir hooks, modificar la configuración de Git ni fusionar ramas sin una solicitud expresa.

Si un hook o comprobación falla, resolver el problema antes de continuar. Si el commit o el push falla, informar el resultado sin afirmar que la operación se completó.

La creación de un pull request y la integración en `main` requieren autorización adicional.

## 11. Comunicar el análisis y los resultados

Antes de implementar, presentar un análisis breve con los puntos pertinentes:

### Análisis previo

- **Requisito:** comportamiento solicitado.
- **Documentación:** estado y referencias (documento y sección).
- **Conflictos e impacto:** funcionalidades y reglas afectadas.
- **Reutilización:** código existente aprovechable.
- **Diseño:** enfoque POO y patrones pertinentes.
- **Recursos gráficos:** recursos confirmados o consulta pendiente.
- **Git:** rama base y rama de trabajo.
- **Dudas:** decisiones que requieren respuesta del usuario.

Para consultas simples, reducir el formato a los puntos aplicables.

Al finalizar, resumir:

- Cambios y archivos afectados.
- Decisiones relevantes.
- Verificaciones ejecutadas (`typecheck`, `test`, `validate-levels`, pruebas manuales).
- Pendientes reales.
- Confirmación solicitada al usuario.
- Resultado de commit y push, únicamente si fueron autorizados y ejecutados.

No presentar propuestas como funcionalidades implementadas.
