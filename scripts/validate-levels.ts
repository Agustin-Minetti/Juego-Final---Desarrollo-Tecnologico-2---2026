import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidLevelName, validateLevel } from '../src/logic/levelParser.ts';

const LEVELS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'levels');

const files = readdirSync(LEVELS_DIR).filter((name) => name.endsWith('.json'));
const levels = files.filter(isValidLevelName);

if (levels.length === 0) {
  console.log('validate-levels: sin niveles de progresión (NN.json) en levels/ todavía, nada que validar.');
  process.exit(0);
}

const results = levels.map((name) => ({
  name,
  errors: validateLevel(readFileSync(join(LEVELS_DIR, name), 'utf8')),
}));

const failed = results.filter((result) => result.errors.length > 0);

if (failed.length > 0) {
  console.error(`validate-levels: ${failed.length}/${levels.length} nivel(es) con errores:`);
  failed.forEach(({ name, errors }) => {
    console.error(`  ${name}:`);
    errors.forEach((error) => console.error(`    - ${error}`));
  });
  process.exit(1);
}

console.log(`validate-levels: ${levels.length} nivel(es) válidos.`);