import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID_COLS, GRID_ROWS } from '../src/config/game.ts';

const LEVELS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'levels');
const LEVEL_NAME = /^\d{2}\.json$/;

interface LevelJson {
  grid?: unknown;
}

function validateLevel(fileName: string, raw: string): string[] {
  const errors: string[] = [];

  if (!LEVEL_NAME.test(fileName)) {
    errors.push(`nombre inválido (se espera NN.json): ${fileName}`);
  }

  let data: LevelJson;
  try {
    data = JSON.parse(raw) as LevelJson;
  } catch {
    return [...errors, `JSON inválido: ${fileName}`];
  }

  const grid = data.grid;
  if (!Array.isArray(grid)) {
    errors.push(`${fileName}: falta el arreglo "grid"`);
    return errors;
  }

  if (grid.length !== GRID_ROWS) {
    errors.push(`${fileName}: grid tiene ${grid.length} filas, se esperan ${GRID_ROWS}`);
  }

  grid.forEach((row, index) => {
    if (typeof row !== 'string') {
      errors.push(`${fileName}: fila ${index} no es texto`);
      return;
    }
    if (row.length !== GRID_COLS) {
      errors.push(`${fileName}: fila ${index} tiene ${row.length} tiles, se esperan ${GRID_COLS}`);
    }
  });

  return errors;
}

const files = readdirSync(LEVELS_DIR).filter((name) => name.endsWith('.json'));

if (files.length === 0) {
  console.log('validate-levels: sin niveles en levels/ todavía, nada que validar.');
  process.exit(0);
}

const allErrors = files.flatMap((name) =>
  validateLevel(name, readFileSync(join(LEVELS_DIR, name), 'utf8')),
);

if (allErrors.length > 0) {
  console.error(`validate-levels: ${allErrors.length} error(es):`);
  allErrors.forEach((error) => console.error(`  - ${error}`));
  process.exit(1);
}

console.log(`validate-levels: ${files.length} nivel(es) válidos.`);
