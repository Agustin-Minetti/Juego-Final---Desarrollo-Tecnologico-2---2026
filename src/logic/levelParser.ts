import { GRID_COLS, GRID_ROWS, TILE_SIZE } from '../config/game.ts';

export const VALID_TILES = new Set(['.', '#', 'L', 'U', 'l', 'u', 'p', 's', 'a', 'c', 'b', 'd', 'v']);

const LEVEL_NAME = /^\d{2}\.json$/;

export type EntityType = 'button' | 'lever' | 'gate';

export interface LevelEntity {
  type: EntityType;
  id: string;
  x: number;
  y: number;
}

export interface LevelData {
  timeTarget: number;
  grid: string[];
  entities: LevelEntity[];
}

export interface Point {
  x: number;
  y: number;
}

export interface SpawnPoints {
  lumo: Point;
  umbra: Point;
}

export interface DoorPoints {
  lumo: Point;
  umbra: Point;
}

export interface GemPoints {
  gold: Point[]; // d
  violet: Point[]; // v
}

export interface HazardPoints {
  abism: Point[]; // a
  lightPit: Point[]; // p
  shadowPit: Point[]; // s
}

export interface StaticTile {
  tx: number;
  ty: number;
}

export interface ParsedLevel extends LevelData {
  spawns: SpawnPoints;
  doors: DoorPoints;
  gems: GemPoints;
  hazards: HazardPoints;
  staticTiles: StaticTile[]; // #, p, s
  crystals: Point[]; // c
  barriers: Point[]; // b
}

export function isValidLevelName(fileName: string): boolean {
  return LEVEL_NAME.test(fileName);
}

function isEntityType(value: unknown): value is EntityType {
  return value === 'button' || value === 'lever' || value === 'gate';
}

export function validateLevel(raw: string): string[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return ['JSON inválido'];
  }

  if (typeof data !== 'object' || data === null) {
    return ['El nivel debe ser un objeto JSON'];
  }

  const level = data as Partial<LevelData>;
  const errors: string[] = [];

  if (typeof level.timeTarget !== 'number' || !Number.isFinite(level.timeTarget) || level.timeTarget <= 0) {
    errors.push('"timeTarget" debe ser un número mayor que 0');
  }

  if (!Array.isArray(level.grid)) {
    errors.push('falta el arreglo "grid"');
    return errors;
  }
  const grid = level.grid;

  if (grid.length !== GRID_ROWS) {
    errors.push(`grid tiene ${grid.length} filas, se esperan ${GRID_ROWS}`);
  }

  const count = (ch: string): number => {
    let total = 0;
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      if (typeof row !== 'string') continue;
      for (let x = 0; x < row.length; x++) {
        if (row[x] === ch) total++;
      }
    }
    return total;
  };

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (typeof row !== 'string') {
      errors.push(`fila ${y} no es texto`);
      continue;
    }
    if (row.length !== GRID_COLS) {
      errors.push(`fila ${y} tiene ${row.length} tiles, se esperan ${GRID_COLS}`);
    }
    for (let x = 0; x < row.length; x++) {
      if (!VALID_TILES.has(row[x])) {
        errors.push(`fila ${y}, tile ${x}: carácter inválido "${row[x]}"`);
      }
    }
  }

  const requiredTiles: ReadonlyArray<readonly [string, string]> = [
    ['L', 'spawn de Lumo'],
    ['U', 'spawn de Umbra'],
    ['l', 'puerta de Lumo'],
    ['u', 'puerta de Umbra'],
  ];
  for (const [tile, label] of requiredTiles) {
    const n = count(tile);
    if (n !== 1) {
      errors.push(`debe haber exactamente un "${tile}" (${label}), hay ${n}`);
    }
  }

  if (!Array.isArray(level.entities)) {
    errors.push('falta el arreglo "entities"');
    return errors;
  }

  level.entities.forEach((entity, index) => {
    const prefix = `entities[${index}]`;
    if (typeof entity !== 'object' || entity === null) {
      errors.push(`${prefix}: no es un objeto`);
      return;
    }
    const e = entity as Partial<LevelEntity>;
    const ex = e.x;
    const ey = e.y;

    if (!isEntityType(e.type)) {
      errors.push(`${prefix}: tipo inválido "${String(e.type)}" (se espera button | lever | gate)`);
    }
    if (typeof e.id !== 'string' || e.id.length === 0) {
      errors.push(`${prefix}: "id" debe ser un texto no vacío`);
    }
    if (typeof ex !== 'number' || !Number.isInteger(ex) || ex < 0 || ex >= GRID_COLS) {
      errors.push(`${prefix}: "x" debe ser un entero entre 0 y ${GRID_COLS - 1}`);
    }
    if (typeof ey !== 'number' || !Number.isInteger(ey) || ey < 0 || ey >= GRID_ROWS) {
      errors.push(`${prefix}: "y" debe ser un entero entre 0 y ${GRID_ROWS - 1}`);
    }

    if (e.type === 'gate' && typeof ex === 'number' && Number.isInteger(ex) && typeof ey === 'number' && Number.isInteger(ey)) {
      const above = typeof grid[ey - 1] === 'string' ? grid[ey - 1]?.[ex] : undefined;
      if (above !== '.') {
        errors.push(`${prefix}: compuerta en (${ex}, ${ey}) sin tile libre arriba`);
      }
    }
  });

  return errors;
}

function tileToWorld(tx: number, ty: number): Point {
  return {
    x: tx * TILE_SIZE + TILE_SIZE / 2,
    y: ty * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function parseLevel(raw: string): ParsedLevel {
  const errors = validateLevel(raw);
  if (errors.length > 0) {
    throw new Error(`Nivel inválido: ${errors.join(', ')}`);
  }

  const data = JSON.parse(raw) as LevelData;
  const grid = data.grid;

  const spawns: SpawnPoints = {
    lumo: { x: 0, y: 0 },
    umbra: { x: 0, y: 0 },
  };
  const doors: DoorPoints = {
    lumo: { x: 0, y: 0 },
    umbra: { x: 0, y: 0 },
  };
  const gems: GemPoints = {
    gold: [],
    violet: [],
  };
  const hazards: HazardPoints = {
    abism: [],
    lightPit: [],
    shadowPit: [],
  };
  const staticTiles: StaticTile[] = [];
  const crystals: Point[] = [];
  const barriers: Point[] = [];

  for (let ty = 0; ty < grid.length; ty++) {
    const row = grid[ty];
    if (typeof row !== 'string') continue;
    for (let tx = 0; tx < row.length; tx++) {
      const ch = row[tx];
      if (ch === 'L') {
        spawns.lumo = tileToWorld(tx, ty);
      } else if (ch === 'U') {
        spawns.umbra = tileToWorld(tx, ty);
      } else if (ch === 'l') {
        doors.lumo = tileToWorld(tx, ty);
      } else if (ch === 'u') {
        doors.umbra = tileToWorld(tx, ty);
      } else if (ch === 'd') {
        gems.gold.push(tileToWorld(tx, ty));
      } else if (ch === 'v') {
        gems.violet.push(tileToWorld(tx, ty));
      } else if (ch === 'a') {
        hazards.abism.push(tileToWorld(tx, ty));
      } else if (ch === 'p') {
        hazards.lightPit.push(tileToWorld(tx, ty));
        staticTiles.push({ tx, ty });
      } else if (ch === 's') {
        hazards.shadowPit.push(tileToWorld(tx, ty));
        staticTiles.push({ tx, ty });
      } else if (ch === '#') {
        staticTiles.push({ tx, ty });
      } else if (ch === 'c') {
        crystals.push(tileToWorld(tx, ty));
      } else if (ch === 'b') {
        barriers.push(tileToWorld(tx, ty));
      }
    }
  }

  return {
    timeTarget: data.timeTarget,
    grid: data.grid,
    entities: data.entities,
    spawns,
    doors,
    gems,
    hazards,
    staticTiles,
    crystals,
    barriers,
  };
}