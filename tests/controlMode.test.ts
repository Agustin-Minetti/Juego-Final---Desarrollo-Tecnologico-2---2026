import { describe, expect, it } from 'vitest';
import {
  controlStateForMode,
  createControlState,
  schemeFor,
  switchActive,
  type ControlState,
} from '../src/logic/controlMode';

describe('createControlState', () => {
  it('arranca en modo dos jugadores', () => {
    const state = createControlState();
    expect(state.mode).toBe('two-player');
  });
});

describe('controlStateForMode', () => {
  it('respeta el modo elegido y arranca con Lumo activo', () => {
    expect(controlStateForMode('one-player')).toEqual({ mode: 'one-player', active: 'lumo' });
    expect(controlStateForMode('two-player')).toEqual({ mode: 'two-player', active: 'lumo' });
  });
});

describe('switchActive (Tab)', () => {
  it('en dos jugadores no cambia nada', () => {
    const state = createControlState();
    expect(switchActive(state)).toEqual({ mode: 'two-player', active: 'lumo' });
  });

  it('en un jugador alterna el personaje activo', () => {
    const lumo: ControlState = { mode: 'one-player', active: 'lumo' };
    const umbra: ControlState = { mode: 'one-player', active: 'umbra' };
    expect(switchActive(lumo)).toEqual(umbra);
    expect(switchActive(umbra)).toEqual(lumo);
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
