import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseLevel, validateLevel } from '../src/logic/levelParser';

const LEVELS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'levels');
const PROGRESSION = ['01', '02', '03', '04', '05', '06', '07', '08'].filter((id) =>
  readdirSync(LEVELS_DIR).includes(`${id}.json`),
);

describe('niveles de la progresión', () => {
  it.each(PROGRESSION)('levels/%s.json valida y parsea', (id) => {
    const raw = readFileSync(join(LEVELS_DIR, `${id}.json`), 'utf8');
    expect(validateLevel(raw)).toEqual([]);
    const level = parseLevel(raw);
    expect(level.timeTarget).toBeGreaterThan(0);
    expect(level.entities.length).toBeGreaterThanOrEqual(0);
  });

  it('cada compuerta tiene un tile libre arriba para retraerse', () => {
    for (const id of PROGRESSION) {
      const raw = readFileSync(join(LEVELS_DIR, `${id}.json`), 'utf8');
      const data = JSON.parse(raw) as { grid: string[]; entities: Array<{ type: string; x: number; y: number }> };
      for (const entity of data.entities) {
        if (entity.type === 'gate') {
          expect(data.grid[entity.y - 1][entity.x]).toBe('.');
        }
      }
    }
  });
});
