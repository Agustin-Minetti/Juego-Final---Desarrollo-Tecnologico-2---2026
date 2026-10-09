import { describe, expect, it } from 'vitest';
import { collectedAllGems, scoreLevel } from '../src/logic/scoring';

describe('collectedAllGems', () => {
  it('es falso si faltan gemas', () => {
    expect(collectedAllGems(2, 5)).toBe(false);
  });

  it('es verdadero con todas las gemas', () => {
    expect(collectedAllGems(5, 5)).toBe(true);
  });

  it('es verdadero si el nivel no tiene gemas', () => {
    expect(collectedAllGems(0, 0)).toBe(true);
  });
});

describe('scoreLevel', () => {
  it('da 1 estrella al terminar sin gemas ni tiempo', () => {
    const score = scoreLevel({ gemsCollected: 0, totalGems: 3, elapsedMs: 60_000, timeTargetMs: 45_000 });
    expect(score.finished).toBe(true);
    expect(score.allGems).toBe(false);
    expect(score.underTime).toBe(false);
    expect(score.stars).toBe(1);
  });

  it('suma la estrella de todas las gemas', () => {
    const score = scoreLevel({ gemsCollected: 3, totalGems: 3, elapsedMs: 60_000, timeTargetMs: 45_000 });
    expect(score.allGems).toBe(true);
    expect(score.stars).toBe(2);
  });

  it('suma la estrella de tiempo al terminar justo en el objetivo', () => {
    const score = scoreLevel({ gemsCollected: 0, totalGems: 3, elapsedMs: 45_000, timeTargetMs: 45_000 });
    expect(score.underTime).toBe(true);
    expect(score.stars).toBe(2);
  });

  it('da 3 estrellas con todas las gemas y bajo el tiempo', () => {
    const score = scoreLevel({ gemsCollected: 4, totalGems: 4, elapsedMs: 30_000, timeTargetMs: 45_000 });
    expect(score.stars).toBe(3);
  });

  it('da automáticamente la estrella de gemas en un nivel sin gemas', () => {
    const score = scoreLevel({ gemsCollected: 0, totalGems: 0, elapsedMs: 60_000, timeTargetMs: 45_000 });
    expect(score.allGems).toBe(true);
    expect(score.stars).toBe(2);
  });
});
