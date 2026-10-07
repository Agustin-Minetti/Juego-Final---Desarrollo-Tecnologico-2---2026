import { describe, expect, it } from 'vitest';
import { GRID_COLS, GRID_ROWS } from '../src/config/game';
import { parseLevel } from '../src/logic/levelParser';

function place(grid: string[], x: number, y: number, ch: string): void {
  const row = grid[y];
  grid[y] = row.slice(0, x) + ch + row.slice(x + 1);
}

describe('parseLevel', () => {
  it('parsea un nivel mínimo válido', () => {
    const grid = Array.from({ length: GRID_ROWS }, () => '.'.repeat(GRID_COLS));
    place(grid, 2, 1, 'L');
    place(grid, 3, 1, 'U');
    place(grid, 4, 5, 'l');
    place(grid, 5, 5, 'u');
    const raw = JSON.stringify({ timeTarget: 30, grid, entities: [] });
    const parsed = parseLevel(raw);
    expect(parsed.timeTarget).toBe(30);
    expect(parsed.spawns.lumo.x).toBe(2 * 32 + 16);
    expect(parsed.spawns.lumo.y).toBe(1 * 32 + 16);
    expect(parsed.spawns.umbra.x).toBe(3 * 32 + 16);
    expect(parsed.spawns.umbra.y).toBe(1 * 32 + 16);
    expect(parsed.doors.lumo.x).toBe(4 * 32 + 16);
    expect(parsed.doors.umbra.x).toBe(5 * 32 + 16);
    expect(parsed.gems.gold).toEqual([]);
    expect(parsed.gems.violet).toEqual([]);
    expect(parsed.hazards.abism).toEqual([]);
  });

  it('extrae gemas, hazards y tiles estáticos', () => {
    const grid = Array.from({ length: GRID_ROWS }, () => '.'.repeat(GRID_COLS));
    place(grid, 0, 0, 'L');
    place(grid, 1, 0, 'U');
    place(grid, 2, 0, 'l');
    place(grid, 3, 0, 'u');
    place(grid, 5, 2, 'd');
    place(grid, 6, 2, 'v');
    place(grid, 7, 2, 'a');
    place(grid, 8, 2, 'p');
    place(grid, 9, 2, 's');
    place(grid, 10, 2, '#');
    place(grid, 11, 2, 'c');
    place(grid, 12, 2, 'b');
    const raw = JSON.stringify({ timeTarget: 45, grid, entities: [] });
    const parsed = parseLevel(raw);
    expect(parsed.gems.gold.length).toBe(1);
    expect(parsed.gems.violet.length).toBe(1);
    expect(parsed.hazards.abism.length).toBe(1);
    expect(parsed.hazards.lightPit.length).toBe(1);
    expect(parsed.hazards.shadowPit.length).toBe(1);
    expect(parsed.staticTiles.length).toBe(3); // p, s, #
    expect(parsed.crystals.length).toBe(1);
    expect(parsed.barriers.length).toBe(1);
  });

  it('lanza error al parsear nivel inválido', () => {
    expect(() => parseLevel('{invalid')).toThrow();
  });
});
