import { describe, expect, it } from 'vitest';
import {
  buildHazardMap,
  diesIn,
  hazardsTouching,
  isStandingOn,
  resolveOutcome,
  type Character,
  type Hazard,
} from '../src/logic/rules';

describe('diesIn', () => {
  const expected: Record<Character, Record<Hazard, boolean>> = {
    lumo: { lightPit: false, shadowPit: true, abyss: true },
    umbra: { lightPit: true, shadowPit: false, abyss: true },
  };

  for (const character of ['lumo', 'umbra'] as const) {
    for (const hazard of ['lightPit', 'shadowPit', 'abyss'] as const) {
      it(`${character} en ${hazard} → ${expected[character][hazard]}`, () => {
        expect(diesIn(character, hazard)).toBe(expected[character][hazard]);
      });
    }
  }
});

describe('resolveOutcome', () => {
  it('la muerte gana sobre la victoria en el mismo frame', () => {
    expect(resolveOutcome(true, true)).toBe('death');
    expect(resolveOutcome(true, false)).toBe('death');
  });

  it('victoria solo si no hubo muerte', () => {
    expect(resolveOutcome(false, true)).toBe('victory');
    expect(resolveOutcome(false, false)).toBe('none');
  });
});

describe('isStandingOn', () => {
  const surface = { left: 100, right: 132, top: 200 };

  it('verdadero con la cara inferior apoyada en la superior y solape horizontal', () => {
    expect(isStandingOn({ left: 108, right: 132, bottom: 200 }, surface)).toBe(true);
    expect(isStandingOn({ left: 108, right: 132, bottom: 201 }, surface)).toBe(true);
  });

  it('falso si los pies están por encima o por debajo de la superficie', () => {
    expect(isStandingOn({ left: 108, right: 132, bottom: 180 }, surface)).toBe(false);
    expect(isStandingOn({ left: 108, right: 132, bottom: 220 }, surface)).toBe(false);
  });

  it('falso si no hay solape horizontal', () => {
    expect(isStandingOn({ left: 40, right: 60, bottom: 200 }, surface)).toBe(false);
    expect(isStandingOn({ left: 132, right: 156, bottom: 200 }, surface)).toBe(false);
  });
});

describe('hazardsTouching', () => {
  const tileSize = 32;
  const cells = buildHazardMap([
    { tx: 2, ty: 3, hazard: 'lightPit' },
    { tx: 5, ty: 3, hazard: 'abyss' },
  ]);

  it('detecta un cuerpo apoyado sobre la cara superior del pozo (margen de contacto)', () => {
    const feetOnTile = { left: 70, right: 94, top: 72, bottom: 96 };
    expect(hazardsTouching(feetOnTile, cells, tileSize, 2)).toContain('lightPit');
  });

  it('no detecta un cuerpo que solo está al lado', () => {
    const beside = { left: 96, right: 120, top: 64, bottom: 88 };
    expect(hazardsTouching(beside, cells, tileSize, 2)).toEqual([]);
  });

  it('sin margen, no detecta el abismo si el cuerpo no entra en la celda', () => {
    const edge = { left: 136, right: 160, top: 96, bottom: 120 };
    expect(hazardsTouching(edge, cells, tileSize, 0)).toEqual([]);
    const inside = { left: 164, right: 184, top: 100, bottom: 120 };
    expect(hazardsTouching(inside, cells, tileSize, 0)).toContain('abyss');
  });
});
