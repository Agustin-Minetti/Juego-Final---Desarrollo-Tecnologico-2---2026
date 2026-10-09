import { describe, expect, it } from 'vitest';
import {
  browserStorage,
  emptyProgress,
  isLevelUnlocked,
  loadProgress,
  PROGRESS_KEY,
  recordResult,
  sanitizeProgress,
  saveProgress,
  starsFor,
  type StorageLike,
} from '../src/logic/progress';

class FakeStorage implements StorageLike {
  private readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

class ThrowingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('bloqueado');
  }
  setItem(): void {
    throw new Error('bloqueado');
  }
}

describe('loadProgress / saveProgress', () => {
  it('sin storage devuelve el progreso vacío', () => {
    expect(loadProgress(null)).toEqual(emptyProgress());
  });

  it('persiste y recupera el progreso', () => {
    const storage = new FakeStorage();
    const progress = recordResult(emptyProgress(), '01', 0, 3, 8);
    saveProgress(storage, progress);
    expect(loadProgress(storage)).toEqual(progress);
  });

  it('ignora JSON corrupto y vuelve al progreso vacío', () => {
    const storage = new FakeStorage();
    storage.setItem(PROGRESS_KEY, '{no es json');
    expect(loadProgress(storage)).toEqual(emptyProgress());
  });

  it('no lanza si el storage está bloqueado', () => {
    const storage = new ThrowingStorage();
    expect(loadProgress(storage)).toEqual(emptyProgress());
    expect(() => saveProgress(storage, emptyProgress())).not.toThrow();
  });
});

describe('sanitizeProgress', () => {
  it('normaliza datos inválidos', () => {
    expect(sanitizeProgress(null)).toEqual(emptyProgress());
    expect(sanitizeProgress({ unlockedCount: -5, stars: 'x' })).toEqual({ unlockedCount: 1, stars: {} });
  });

  it('recorta las estrellas al rango 0..3', () => {
    expect(sanitizeProgress({ unlockedCount: 2, stars: { '01': 9, '02': -1 } })).toEqual({
      unlockedCount: 2,
      stars: { '01': 3, '02': 0 },
    });
  });
});

describe('recordResult', () => {
  it('desbloquea el siguiente nivel en orden', () => {
    const progress = recordResult(emptyProgress(), '01', 0, 1, 8);
    expect(progress.unlockedCount).toBe(2);
    expect(isLevelUnlocked(progress, 0)).toBe(true);
    expect(isLevelUnlocked(progress, 1)).toBe(true);
    expect(isLevelUnlocked(progress, 2)).toBe(false);
  });

  it('no baja las mejores estrellas de un nivel', () => {
    const first = recordResult(emptyProgress(), '01', 0, 3, 8);
    const second = recordResult(first, '01', 0, 1, 8);
    expect(starsFor(second, '01')).toBe(3);
  });

  it('no desbloquea más allá del último nivel', () => {
    const progress = recordResult(emptyProgress(), '08', 7, 1, 8);
    expect(progress.unlockedCount).toBe(8);
  });
});

describe('browserStorage', () => {
  it('devuelve algo o null sin lanzar', () => {
    expect(() => browserStorage()).not.toThrow();
  });
});
