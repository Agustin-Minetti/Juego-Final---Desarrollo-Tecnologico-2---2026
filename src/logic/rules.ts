export type Character = 'lumo' | 'umbra';

/** Peligros que pueden matar a un personaje. */
export type Hazard = 'lightPit' | 'shadowPit' | 'abyss';

/**
 * ¿Muere `character` al tocar `hazard`? (DESIGN → Mecánicas: cada pozo solo
 * afecta a su personaje opuesto; el abismo mata a ambos).
 */
export function diesIn(character: Character, hazard: Hazard): boolean {
  switch (hazard) {
    case 'lightPit':
      return character === 'umbra';
    case 'shadowPit':
      return character === 'lumo';
    case 'abyss':
      return true;
  }
}

export type FrameOutcome = 'death' | 'victory' | 'none';

/**
 * Resuelve el resultado de un frame. Prioridad de muerte (DESIGN → Victoria,
 * derrota y puntaje): si alguien muere, gana la muerte; la victoria solo si
 * ambos siguen vivos al final del frame.
 */
export function resolveOutcome(died: boolean, won: boolean): FrameOutcome {
  if (died) {
    return 'death';
  }
  if (won) {
    return 'victory';
  }
  return 'none';
}

export interface FeetRect {
  left: number;
  right: number;
  bottom: number;
}

export interface SurfaceRect {
  left: number;
  right: number;
  top: number;
}

/**
 * Criterio de "encima"/"pisar" (DESIGN → Mecánicas: la cara inferior del
 * personaje en contacto con la cara superior del elemento, con solapamiento
 * horizontal). `tolerance` absorbe el redondeo de Arcade.
 */
export function isStandingOn(feet: FeetRect, surface: SurfaceRect, tolerance = 2): boolean {
  const horizontallyOverlapping = feet.right > surface.left && feet.left < surface.right;
  const touchingTop = Math.abs(feet.bottom - surface.top) <= tolerance;
  return horizontallyOverlapping && touchingTop;
}

export interface BodyBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** ¿Se solapan dos rectángulos? (usado para saber si una celda sigue ocupada). */
export function rectsOverlap(a: BodyBounds, b: BodyBounds): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export interface HazardCell {
  tx: number;
  ty: number;
  hazard: Hazard;
}

function tileKey(tx: number, ty: number): string {
  return `${tx},${ty}`;
}

export function buildHazardMap(cells: ReadonlyArray<HazardCell>): Map<string, Hazard> {
  const map = new Map<string, Hazard>();
  for (const cell of cells) {
    map.set(tileKey(cell.tx, cell.ty), cell.hazard);
  }
  return map;
}

/**
 * Peligros cuya celda queda dentro del cuerpo (con un margen de contacto).
 * Los pozos se detectan con un margen menor a cero-uno para captar el apoyo
 * sobre su cara superior; el margen es 0 para el abismo (solo al entrar).
 */
export function hazardsTouching(
  bounds: BodyBounds,
  cells: ReadonlyMap<string, Hazard>,
  tileSize: number,
  margin: number,
): Hazard[] {
  const left = bounds.left - margin;
  const right = bounds.right + margin;
  const top = bounds.top - margin;
  const bottom = bounds.bottom + margin;

  const minTx = Math.floor(left / tileSize);
  const maxTx = Math.floor((right - 0.001) / tileSize);
  const minTy = Math.floor(top / tileSize);
  const maxTy = Math.floor((bottom - 0.001) / tileSize);

  const found: Hazard[] = [];
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const hazard = cells.get(tileKey(tx, ty));
      if (hazard !== undefined) {
        found.push(hazard);
      }
    }
  }
  return found;
}
