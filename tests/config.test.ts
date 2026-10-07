import { describe, expect, it } from 'vitest';
import {
  ACCELERATION,
  COYOTE_TIME_MS,
  GRAVITY,
  JUMP_BUFFER_MS,
  JUMP_CUT_FACTOR,
  JUMP_VELOCITY,
  MOVE_SPEED,
} from '../src/config/physics';
import { GAME_HEIGHT, GAME_WIDTH, GRID_COLS, GRID_ROWS, TILE_SIZE } from '../src/config/game';

describe('config/physics', () => {
  it('respeta los parámetros de movimiento del documento de diseño', () => {
    expect(MOVE_SPEED).toBe(200);
    expect(ACCELERATION).toBe(2400);
    expect(GRAVITY).toBe(1200);
    expect(JUMP_VELOCITY).toBe(-480);
    expect(COYOTE_TIME_MS).toBe(100);
    expect(JUMP_BUFFER_MS).toBe(100);
    expect(JUMP_CUT_FACTOR).toBe(0.5);
  });
});

describe('config/game', () => {
  it('la grilla de 30x17 tiles de 32px da 960x544', () => {
    expect(GRID_COLS).toBe(30);
    expect(GRID_ROWS).toBe(17);
    expect(TILE_SIZE).toBe(32);
    expect(GAME_WIDTH).toBe(960);
    expect(GAME_HEIGHT).toBe(544);
  });
});
