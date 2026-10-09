import level01 from '../../levels/01.json?raw';
import level02 from '../../levels/02.json?raw';
import level03 from '../../levels/03.json?raw';

/** Niveles de la progresión disponibles (Hito 3: 01-03). */
export const LEVELS: Readonly<Record<string, string>> = {
  '01': level01,
  '02': level02,
  '03': level03,
};

export type LevelId = keyof typeof LEVELS;

export const DEFAULT_LEVEL: string = '01';

export function levelIds(): string[] {
  return Object.keys(LEVELS).sort();
}

export function hasLevel(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(LEVELS, id);
}
