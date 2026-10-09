export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Progreso guardado (DESIGN → Victoria, derrota y puntaje): niveles
 * desbloqueados en orden y mejores estrellas por nivel.
 */
export interface Progress {
  /** Cantidad de niveles desbloqueados desde el inicio; siempre >= 1. */
  unlockedCount: number;
  /** Mejor cantidad de estrellas por id de nivel. */
  stars: Record<string, number>;
}

export const PROGRESS_KEY = 'lumo-umbra:progress';
export const MAX_STARS = 3;

export function emptyProgress(): Progress {
  return { unlockedCount: 1, stars: {} };
}

function clampStars(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(MAX_STARS, Math.floor(value)));
}

/** Normaliza datos posiblemente corruptos a un `Progress` válido. */
export function sanitizeProgress(data: unknown): Progress {
  if (typeof data !== 'object' || data === null) {
    return emptyProgress();
  }
  const record = data as Partial<Progress>;
  const unlockedCount =
    typeof record.unlockedCount === 'number' && Number.isFinite(record.unlockedCount)
      ? Math.max(1, Math.floor(record.unlockedCount))
      : 1;

  const stars: Record<string, number> = {};
  if (typeof record.stars === 'object' && record.stars !== null) {
    for (const [id, value] of Object.entries(record.stars)) {
      stars[id] = clampStars(value);
    }
  }
  return { unlockedCount, stars };
}

/** Carga el progreso; nunca lanza (storage caído o JSON corrupto → vacío). */
export function loadProgress(storage: StorageLike | null): Progress {
  if (!storage) {
    return emptyProgress();
  }
  let raw: string | null;
  try {
    raw = storage.getItem(PROGRESS_KEY);
  } catch {
    return emptyProgress();
  }
  if (!raw) {
    return emptyProgress();
  }
  try {
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

/** Guarda el progreso; nunca lanza. */
export function saveProgress(storage: StorageLike | null, progress: Progress): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // storage lleno o bloqueado: se ignora, el progreso no es crítico
  }
}

/** `localStorage` del navegador o null si no está disponible/está bloqueado. */
export function browserStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function isLevelUnlocked(progress: Progress, levelIndex: number): boolean {
  return levelIndex < progress.unlockedCount;
}

export function starsFor(progress: Progress, levelId: string): number {
  return progress.stars[levelId] ?? 0;
}

/** Registra el resultado de un nivel: mejores estrellas y desbloquea el siguiente. */
export function recordResult(
  progress: Progress,
  levelId: string,
  levelIndex: number,
  stars: number,
  levelCount: number,
): Progress {
  const bestStars = Math.max(starsFor(progress, levelId), clampStars(stars));
  const unlockedCount = Math.min(levelCount, Math.max(progress.unlockedCount, levelIndex + 2));
  return {
    unlockedCount,
    stars: { ...progress.stars, [levelId]: bestStars },
  };
}
