import { describe, expect, it } from 'vitest';
import { GRID_COLS, GRID_ROWS } from '../src/config/game';
import { isValidLevelName, validateLevel, VALID_TILES } from '../src/logic/levelParser';

function place(grid: string[], x: number, y: number, ch: string): void {
  const row = grid[y];
  grid[y] = row.slice(0, x) + ch + row.slice(x + 1);
}

function buildLevelJson(overrides: Record<string, unknown> = {}): string {
  const grid = Array.from({ length: GRID_ROWS }, () => '.'.repeat(GRID_COLS));
  place(grid, 0, 0, 'L');
  place(grid, 1, 0, 'U');
  place(grid, 2, 0, 'l');
  place(grid, 3, 0, 'u');
  return JSON.stringify({ timeTarget: 45, grid, entities: [], ...overrides });
}

describe('isValidLevelName', () => {
  it('acepta solo el patrón NN.json', () => {
    expect(isValidLevelName('01.json')).toBe(true);
    expect(isValidLevelName('08.json')).toBe(true);
    expect(isValidLevelName('test.json')).toBe(false);
    expect(isValidLevelName('1.json')).toBe(false);
    expect(isValidLevelName('01-jefe.json')).toBe(false);
  });
});

describe('validateLevel', () => {
  it('acepta un nivel válido sin errores', () => {
    expect(validateLevel(buildLevelJson())).toEqual([]);
  });

  it('reporta JSON inválido', () => {
    expect(validateLevel('{no es json')).toEqual(['JSON inválido']);
  });

  it('exige timeTarget numérico mayor que 0', () => {
    expect(validateLevel(buildLevelJson({ timeTarget: 0 }))).toContain('"timeTarget" debe ser un número mayor que 0');
    expect(validateLevel(buildLevelJson({ timeTarget: -5 }))).toContain('"timeTarget" debe ser un número mayor que 0');
    expect(validateLevel(buildLevelJson({ timeTarget: '45' }))).toContain('"timeTarget" debe ser un número mayor que 0');
  });

  it('exige el arreglo grid', () => {
    expect(validateLevel(buildLevelJson({ grid: undefined }))).toContain('falta el arreglo "grid"');
  });

  it('valida la cantidad de filas', () => {
    const grid = Array.from({ length: GRID_ROWS - 1 }, () => '.'.repeat(GRID_COLS));
    const errors = validateLevel(buildLevelJson({ grid }));
    expect(errors.join('\n')).toContain(`grid tiene ${GRID_ROWS - 1} filas, se esperan ${GRID_ROWS}`);
  });

  it('valida el ancho de cada fila', () => {
    const grid = Array.from({ length: GRID_ROWS }, () => '.'.repeat(GRID_COLS - 1));
    const errors = validateLevel(buildLevelJson({ grid }));
    expect(errors.join('\n')).toContain(`fila 0 tiene ${GRID_COLS - 1} tiles, se esperan ${GRID_COLS}`);
  });

  it('rechaza caracteres fuera del alfabeto', () => {
    const grid = Array.from({ length: GRID_ROWS }, () => '.'.repeat(GRID_COLS));
    place(grid, 0, 0, 'L');
    place(grid, 1, 0, 'U');
    place(grid, 2, 0, 'l');
    place(grid, 3, 0, 'u');
    place(grid, 5, 5, 'Z');
    const errors = validateLevel(JSON.stringify({ timeTarget: 45, grid, entities: [] }));
    expect(errors.join('\n')).toContain('carácter inválido "Z"');
  });

  it('conocer el alfabeto documentado', () => {
    expect([...VALID_TILES].sort()).toEqual(['.', '#', 'L', 'U', 'l', 'u', 'a', 'b', 'c', 'd', 'p', 's', 'v'].sort());
  });

  it('exige exactamente un spawn y una puerta de cada tipo', () => {
    const grid = Array.from({ length: GRID_ROWS }, () => '.'.repeat(GRID_COLS));
    place(grid, 0, 0, 'L');
    const errors = validateLevel(JSON.stringify({ timeTarget: 45, grid, entities: [] }));
    const joined = errors.join('\n');
    expect(joined).toContain('debe haber exactamente un "U" (spawn de Umbra)');
    expect(joined).toContain('debe haber exactamente un "l" (puerta de Lumo)');
    expect(joined).toContain('debe haber exactamente un "u" (puerta de Umbra)');
  });

  it('rechaza duplicados de spawn', () => {
    const grid = Array.from({ length: GRID_ROWS }, () => '.'.repeat(GRID_COLS));
    place(grid, 0, 0, 'L');
    place(grid, 1, 0, 'U');
    place(grid, 2, 0, 'l');
    place(grid, 3, 0, 'u');
    place(grid, 5, 5, 'L');
    const errors = validateLevel(JSON.stringify({ timeTarget: 45, grid, entities: [] }));
    expect(errors.join('\n')).toContain('debe haber exactamente un "L" (spawn de Lumo), hay 2');
  });

  it('valida los tipos de entities', () => {
    const errors = validateLevel(
      buildLevelJson({ entities: [{ type: 'caja', id: 'x', x: 0, y: 5 }] }),
    );
    expect(errors.join('\n')).toContain('tipo inválido "caja" (se espera button | lever | gate)');
  });

  it('exige id no vacío en cada entity', () => {
    const errors = validateLevel(
      buildLevelJson({ entities: [{ type: 'button', id: '', x: 0, y: 5 }] }),
    );
    expect(errors.join('\n')).toContain('"id" debe ser un texto no vacío');
  });

  it('valida coordenadas dentro de la grilla', () => {
    const errors = validateLevel(
      buildLevelJson({ entities: [{ type: 'lever', id: 'a', x: GRID_COLS, y: 5 }] }),
    );
    expect(errors.join('\n')).toContain(`"x" debe ser un entero entre 0 y ${GRID_COLS - 1}`);
  });

  it('exige que cada compuerta tenga tile libre arriba', () => {
    const grid = Array.from({ length: GRID_ROWS }, () => '.'.repeat(GRID_COLS));
    place(grid, 0, 0, 'L');
    place(grid, 1, 0, 'U');
    place(grid, 2, 0, 'l');
    place(grid, 3, 0, 'u');
    place(grid, 5, 5, '#');
    const errors = validateLevel(
      JSON.stringify({
        timeTarget: 45,
        grid,
        entities: [
          { type: 'gate', id: 'a', x: 5, y: 6 },
          { type: 'gate', id: 'b', x: 0, y: 0 },
        ],
      }),
    );
    const joined = errors.join('\n');
    expect(joined).toContain('compuerta en (5, 6) sin tile libre arriba');
    expect(joined).toContain('compuerta en (0, 0) sin tile libre arriba');
  });

  it('acepta una compuerta con tile libre arriba', () => {
    const errors = validateLevel(
      buildLevelJson({ entities: [{ type: 'gate', id: 'a', x: 5, y: 6 }] }),
    );
    expect(errors).toEqual([]);
  });

  it('exige el arreglo entities', () => {
    expect(validateLevel(buildLevelJson({ entities: undefined }))).toContain('falta el arreglo "entities"');
  });
});