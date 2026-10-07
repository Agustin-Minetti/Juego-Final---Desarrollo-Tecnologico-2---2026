import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GRID_COLS, GRID_ROWS } from '../src/config/game';
import { parseLevel } from '../src/logic/levelParser';

const testLevelRaw = readFileSync(fileURLToPath(new URL('../levels/test.json', import.meta.url)), 'utf8');

describe('levels/test.json', () => {
  const parsed = parseLevel(testLevelRaw);

  it('es un nivel válido para parseLevel', () => {
    expect(parsed.timeTarget).toBeGreaterThan(0);
    expect(parsed.grid).toHaveLength(GRID_ROWS);
    expect(parsed.grid.every((row) => row.length === GRID_COLS)).toBe(true);
    expect(parsed.entities).toEqual([]);
  });

  it('tiene spawns y puertas para ambos personajes', () => {
    expect(parsed.spawns.lumo).toEqual({ x: 2 * 32 + 16, y: 14 * 32 + 16 });
    expect(parsed.spawns.umbra).toEqual({ x: 3 * 32 + 16, y: 14 * 32 + 16 });
    expect(parsed.doors.lumo).toEqual({ x: 26 * 32 + 16, y: 8 * 32 + 16 });
    expect(parsed.doors.umbra).toEqual({ x: 27 * 32 + 16, y: 8 * 32 + 16 });
  });

  it('tiene plataformas a distintas alturas para probar el salto', () => {
    const rows = new Set(parsed.staticTiles.map((tile) => tile.ty));
    expect(rows.size).toBeGreaterThanOrEqual(4);
    expect(parsed.staticTiles.length).toBeGreaterThan(0);
  });
});
