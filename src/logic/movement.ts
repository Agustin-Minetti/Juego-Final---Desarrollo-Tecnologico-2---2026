import { COYOTE_TIME_MS, JUMP_BUFFER_MS } from '../config/physics.ts';

export interface JumpState {
  /** Último instante (ms) en el que el personaje estuvo en el suelo. */
  lastGroundedAt: number;
  /** Instante (ms) hasta el cual un salto apretado sigue "pendiente". */
  bufferUntil: number;
  /** true desde que se ejecutó un salto hasta aterrizar. */
  jumping: boolean;
  /** true una vez aplicado el corte de salto del salto actual. */
  cutDone: boolean;
}

export interface JumpFrame {
  /** Tiempo actual de escena en ms. */
  now: number;
  /** El personaje está tocando el suelo en este frame. */
  grounded: boolean;
  /** Borde de presión de la tecla de salto en este frame. */
  pressed: boolean;
  /** Borde de liberación de la tecla de salto en este frame. */
  released: boolean;
}

export interface JumpResult {
  state: JumpState;
  /** Ejecutar el salto en este frame (velocidad de salto completa). */
  jump: boolean;
  /** Aplicar el corte de salto variable (velocityY ×= 0.5 al subir). */
  cut: boolean;
}

export function createJumpState(): JumpState {
  return {
    lastGroundedAt: Number.NEGATIVE_INFINITY,
    bufferUntil: Number.NEGATIVE_INFINITY,
    jumping: false,
    cutDone: false,
  };
}

export function updateJump(state: JumpState, frame: JumpFrame): JumpResult {
  const { now, grounded, pressed, released } = frame;
  let { lastGroundedAt, bufferUntil, jumping, cutDone } = state;

  if (grounded) {
    lastGroundedAt = now;
    jumping = false;
    cutDone = false;
  }

  if (pressed) {
    bufferUntil = now + JUMP_BUFFER_MS;
  }

  let jump = false;
  const withinCoyote = now - lastGroundedAt <= COYOTE_TIME_MS;
  const withinBuffer = now <= bufferUntil;

  if (withinBuffer && (grounded || withinCoyote)) {
    jump = true;
    bufferUntil = Number.NEGATIVE_INFINITY;
    lastGroundedAt = Number.NEGATIVE_INFINITY;
    jumping = true;
    cutDone = false;
  }

  let cut = false;
  if (released && jumping && !cutDone) {
    cut = true;
    cutDone = true;
  }

  return {
    state: { lastGroundedAt, bufferUntil, jumping, cutDone },
    jump,
    cut,
  };
}
