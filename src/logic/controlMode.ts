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

/** Estado inicial para el modo elegido en el menú (activo Lumo en 1P). */
export function controlStateForMode(mode: ControlMode): ControlState {
  return { mode, active: 'lumo' };
}

/**
 * Tab (DESIGN → Mecánicas > Personajes y controles): en dos jugadores no
 * cambia nada; en un jugador alterna cuál de los dos maneja el WASD.
 */
export function switchActive(state: ControlState): ControlState {
  if (state.mode === 'two-player') {
    return state;
  }
  return { mode: 'one-player', active: state.active === 'lumo' ? 'umbra' : 'lumo' };
}

/** Esquema de teclas con el que `who` juega en este estado; null si está inactivo. */
export function schemeFor(state: ControlState, who: ControlledPlayer): ControlScheme | null {
  if (state.mode === 'two-player') {
    return who === 'lumo' ? 'wasd' : 'arrows';
  }
  return who === state.active ? 'wasd' : null;
}
