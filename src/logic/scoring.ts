export interface LevelScoreInput {
  gemsCollected: number;
  totalGems: number;
  elapsedMs: number;
  timeTargetMs: number;
}

/**
 * Estrellas de un nivel terminado (DESIGN → Victoria, derrota y puntaje):
 * 1 por terminar, 1 por todas las gemas y 1 por terminar bajo el tiempo
 * objetivo. Nunca hay puntaje numérico.
 */
export interface LevelScore {
  finished: boolean;
  allGems: boolean;
  underTime: boolean;
  stars: number;
}

/** ¿Se recogieron todas las gemas? Con 0 gemas no hay nada que perder. */
export function collectedAllGems(gemsCollected: number, totalGems: number): boolean {
  return totalGems <= 0 || gemsCollected >= totalGems;
}

/** Terminar "bajo el objetivo" incluye clavarlo exacto. */
export function finishedUnderTime(elapsedMs: number, timeTargetMs: number): boolean {
  return elapsedMs <= timeTargetMs;
}

/** Puntúa un nivel ya completado (se llama solo al ganar). */
export function scoreLevel(input: LevelScoreInput): LevelScore {
  const finished = true;
  const allGems = collectedAllGems(input.gemsCollected, input.totalGems);
  const underTime = input.elapsedMs <= input.timeTargetMs;
  return {
    finished,
    allGems,
    underTime,
    stars: (finished ? 1 : 0) + (allGems ? 1 : 0) + (underTime ? 1 : 0),
  };
}

/** Formatea milisegundos como `mm:ss` (ej. `01:23`), como en el HUD. */
export function formatTime(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
