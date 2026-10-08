import { describe, expect, it } from 'vitest';
import {
  createControlState,
  nextControlState,
  schemeFor,
  type ControlState,
} from '../src/logic/controlMode';

describe('createControlState', () => {
  it('arranca en modo dos jugadores', () => {
    const state = createControlState();
    expect(state.mode).toBe('two-player');
  });
});

describe('nextControlState', () => {
  it('cicla 2P → 1P(Lumo) → 1P(Umbra) → 2P', () => {
    let state: ControlState = createControlState();

    state = nextControlState(state);
    expect(state).toEqual({ mode: 'one-player', active: 'lumo' });

    state = nextControlState(state);
    expect(state).toEqual({ mode: 'one-player', active: 'umbra' });

    state = nextControlState(state);
    expect(state).toEqual({ mode: 'two-player', active: 'lumo' });
  });

  it('vuelve a empezar el ciclo tras completarlo', () => {
    let state = createControlState();
    for (let i = 0; i < 3; i++) {
      state = nextControlState(state);
    }
    expect(nextControlState(state)).toEqual({ mode: 'one-player', active: 'lumo' });
  });
});

describe('schemeFor', () => {
  it('en 2P cada uno usa sus propias teclas', () => {
    const state = createControlState();
    expect(schemeFor(state, 'lumo')).toBe('wasd');
    expect(schemeFor(state, 'umbra')).toBe('arrows');
  });

  it('en 1P el personaje activo se maneja con WASD y el inactivo queda sin esquema', () => {
    const lumoTurn: ControlState = { mode: 'one-player', active: 'lumo' };
    expect(schemeFor(lumoTurn, 'lumo')).toBe('wasd');
    expect(schemeFor(lumoTurn, 'umbra')).toBeNull();

    const umbraTurn: ControlState = { mode: 'one-player', active: 'umbra' };
    expect(schemeFor(umbraTurn, 'umbra')).toBe('wasd');
    expect(schemeFor(umbraTurn, 'lumo')).toBeNull();
  });
});
