import { describe, expect, it } from 'vitest';
import { COYOTE_TIME_MS, JUMP_BUFFER_MS } from '../src/config/physics';
import { createJumpState, updateJump, type JumpFrame, type JumpState } from '../src/logic/movement';

function step(state: JumpState, frame: Partial<JumpFrame> & { now: number }): JumpState {
  return updateJump(state, {
    grounded: false,
    pressed: false,
    released: false,
    ...frame,
  }).state;
}

function stepWith(state: JumpState, frame: Partial<JumpFrame> & { now: number }) {
  return updateJump(state, {
    grounded: false,
    pressed: false,
    released: false,
    ...frame,
  });
}

describe('updateJump', () => {
  it('salta al apretar la tecla estando en el suelo', () => {
    const state = step(createJumpState(), { now: 0, grounded: true });
    const result = stepWith(state, { now: 16, pressed: true });
    expect(result.jump).toBe(true);
    expect(result.cut).toBe(false);
  });

  it('no salta si no está en el suelo ni dentro del coyote time', () => {
    const state = step(createJumpState(), { now: 0, grounded: true });
    const later = step(state, { now: COYOTE_TIME_MS + 1, grounded: false });
    const result = stepWith(later, { now: COYOTE_TIME_MS + 17, pressed: true });
    expect(result.jump).toBe(false);
  });

  it('permite saltar dentro del coyote time tras dejar el borde', () => {
    const state = step(createJumpState(), { now: 0, grounded: true });
    const airborne = step(state, { now: COYOTE_TIME_MS - 1, grounded: false });
    const result = stepWith(airborne, { now: COYOTE_TIME_MS, pressed: true });
    expect(result.jump).toBe(true);
  });

  it('consume el coyote time: solo permite un salto por despegue', () => {
    const state = step(createJumpState(), { now: 0, grounded: true });
    const first = stepWith(state, { now: 10, grounded: false, pressed: true });
    expect(first.jump).toBe(true);
    const second = stepWith(first.state, { now: 20, pressed: true });
    expect(second.jump).toBe(false);
  });

  it('ejecuta el salto encolado apenas toque el suelo (jump buffer)', () => {
    const pressAt = COYOTE_TIME_MS + 1;
    let state = step(createJumpState(), { now: 0, grounded: true });
    state = step(state, { now: pressAt, grounded: false, pressed: true });
    const landing = stepWith(state, { now: pressAt + JUMP_BUFFER_MS - 1, grounded: true });
    expect(landing.jump).toBe(true);
  });

  it('ignora el salto encolado si el buffer expiró antes de aterrizar', () => {
    const pressAt = COYOTE_TIME_MS + 1;
    let state = step(createJumpState(), { now: 0, grounded: true });
    state = step(state, { now: pressAt, grounded: false, pressed: true });
    const lateLanding = stepWith(state, {
      now: pressAt + JUMP_BUFFER_MS + 1,
      grounded: true,
    });
    expect(lateLanding.jump).toBe(false);
  });

  it('aplica el corte de salto variable una sola vez por salto', () => {
    let state = step(createJumpState(), { now: 0, grounded: true });
    const jump = stepWith(state, { now: 16, pressed: true });
    expect(jump.jump).toBe(true);
    state = jump.state;

    const release = stepWith(state, { now: 32, released: true });
    expect(release.cut).toBe(true);

    const releaseAgain = stepWith(release.state, { now: 48, released: true });
    expect(releaseAgain.cut).toBe(false);
  });

  it('no corta si nunca saltó', () => {
    const state = step(createJumpState(), { now: 0, grounded: true });
    const result = stepWith(state, { now: 16, released: true });
    expect(result.cut).toBe(false);
  });

  it('no corta al aterrizar con la tecla solta y volver a correr', () => {
    let state = step(createJumpState(), { now: 0, grounded: true });
    state = step(state, { now: 16, pressed: true, grounded: false });
    state = step(state, { now: 400, grounded: true });
    const result = stepWith(state, { now: 416, released: true });
    expect(result.cut).toBe(false);
  });

  it('no muta el estado recibido', () => {
    const state = createJumpState();
    const snapshot = { ...state };
    updateJump(state, { now: 10, grounded: true, pressed: true, released: true });
    expect(state).toEqual(snapshot);
  });
});
