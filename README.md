# Lumo y Umbra

Juego realizado por Agustín Minetti y Sebastián Sujeros para Desarrollo Tecnológico 2 (2026).

Plataformero cooperativo de puzzles para dos jugadores en el mismo teclado. Lumo es un espíritu de luz que se apaga en la sombra; Umbra es un espíritu de sombra que se disuelve en la luz. Los dos tienen que llegar a sus puertas para ganar cada uno de los 8 niveles.

Hecho con **Phaser 4.2.1 + Vite + TypeScript**. Corre en el navegador de escritorio, sin backend.

## Cómo jugar

| | Lumo | Umbra |
| --- | --- | --- |
| Moverse | A / D | ← / → |
| Saltar | W | ↑ |
| Puede pisar o romper lo que lleva un | ☀ sol (pozo de luz, cristal oscuro) | ☾ luna (pozo de sombra, barrera de luz) |
| Muere en | pozo de sombra y abismo | pozo de luz y abismo |

- **R** reinicia el nivel, **Esc** pausa (Reanudar, Reiniciar, Silencio, Menú principal).
- **Tab** cambia de personaje en modo un jugador.
- Los botones abren las compuertas de su mismo color mientras alguien los pisa; las palancas las dejan abiertas hasta volver a moverlas.
- Estrellas por nivel: 1 por terminar, 1 por juntar todas las gemas y 1 por terminar bajo el tiempo objetivo. El progreso se guarda en el navegador.

## Instalación y uso

Requiere Node.js (LTS vigente).

```bash
npm install        # solo la primera vez
npm run dev        # servidor de desarrollo → http://localhost:5173
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Juego en modo desarrollo (con recarga automática) |
| `npm run build` | Typecheck + build de producción en `dist/` |
| `npm run preview` | Sirve el build de `dist/` para probarlo |
| `npm test` | Tests de la lógica (Vitest) |
| `npm run typecheck` | Chequeo de tipos (`tsc --noEmit`) |
| `npm run validate-levels` | Valida el formato de `levels/01.json` … `08.json` |
| `npm run solve-levels` | Comprueba que cada nivel tenga solución y que ningún botón o palanca se pueda saltear (tarda unos minutos) |
| `npm run generate-sfx` | Regenera los efectos de sonido en `public/sfx/` |

Modo debug: agregar `?debug=1` a la URL muestra las hitbox de Arcade y permite saltar de nivel con las teclas 1–8.

## Publicar en Vercel

Vercel detecta Vite solo: comando de build `npm run build` y carpeta de salida `dist`.

## Estructura

```
docs/       DESIGN.md (diseño), PROGRESS.md (avance), GDD en .docx, skills de Phaser
levels/     niveles en JSON (grilla de 30 × 17 tiles)
public/sfx/ efectos de sonido
scripts/    validate-levels, solve-levels, generate-sfx
src/        config, logic (sin Phaser, con tests), scenes, objects, fx (arte por código)
tests/      tests de Vitest
```

Todo el arte se dibuja por código (Canvas 2D); no hay imágenes externas. El detalle del diseño está en [`docs/DESIGN.md`](docs/DESIGN.md).
