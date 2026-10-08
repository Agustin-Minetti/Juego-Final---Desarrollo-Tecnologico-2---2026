export type ControlledPlayer = 'lumo' | 'umbra';

export type ControlMode = 'two-player' | 'one-player';

export type ControlScheme = 'wasd' | 'arrows';

export interface ControlState {
  mode: ControlMode;
  /** Personaje que maneja el esquema WASD en modo un jugador. */
  active: ControlledPlayer;
}

export function createControlState(): ControlState {
  return { mode: 'two-player', active: 'lumo' };
}

/** Tab: 2P → 1P(Lumo) → 1P(Umbra) → 2P. */
export function nextControlState(state: ControlState): ControlState {
  if (state.mode === 'two-player') {
    return { mode: 'one-player', active: 'lumo' };
  }
  if (state.active === 'lumo') {
    return { mode: 'one-player', active: 'umbra' };
  }
  return { mode: 'two-player', active: 'lumo' };
}

/** Esquema de teclas con el que `who` juega en este estado; null si está inactivo. */
export function schemeFor(state: ControlState, who: ControlledPlayer): ControlScheme | null {
  if (state.mode === 'two-player') {
    return who === 'lumo' ? 'wasd' : 'arrows';
  }
  return who === state.active ? 'wasd' : null;
}
