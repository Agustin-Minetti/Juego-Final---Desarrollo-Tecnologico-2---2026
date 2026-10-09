import { describe, expect, it } from 'vitest';
import {
  createLever,
  SwitchSystem,
  toggleLeverOnContact,
  type LeverRuntime,
} from '../src/logic/switches';

describe('toggleLeverOnContact', () => {
  it('alterna una sola vez al entrar en contacto', () => {
    const off = createLever('azul');
    const on = toggleLeverOnContact(off, true);
    expect(off.on).toBe(false);
    expect(on.on).toBe(true);
    expect(on.touching).toBe(true);
  });

  it('no vuelve a alternar mientras se mantenga el contacto', () => {
    const on: LeverRuntime = { id: 'azul', on: true, touching: true };
    expect(toggleLeverOnContact(on, true)).toBe(on);
  });

  it('no alterna al salir del contacto, solo marca touching en false', () => {
    const off: LeverRuntime = { id: 'azul', on: false, touching: true };
    const released = toggleLeverOnContact(off, false);
    expect(released.on).toBe(false);
    expect(released.touching).toBe(false);
  });

  it('re-alterna al volver a entrar en contacto', () => {
    const on: LeverRuntime = { id: 'azul', on: true, touching: false };
    expect(toggleLeverOnContact(on, true).on).toBe(false);
  });
});

describe('SwitchSystem', () => {
  it('un botón pisado abre solo las compuertas de su ID', () => {
    const system = new SwitchSystem();
    system.setPressedButtons(new Set(['rojo']));
    expect(system.isGateOpen('rojo')).toBe(true);
    expect(system.isGateOpen('azul')).toBe(false);
  });

  it('el botón abre mientras está pisado y cierra al soltarlo', () => {
    const system = new SwitchSystem();
    system.setPressedButtons(new Set(['rojo']));
    expect(system.isGateOpen('rojo')).toBe(true);
    system.setPressedButtons(new Set());
    expect(system.isGateOpen('rojo')).toBe(false);
  });

  it('la palanca alterna al entrar y mantiene el estado al salir (permanente)', () => {
    const system = new SwitchSystem(['azul']);
    system.setTouchingLevers(new Set(['azul']));
    expect(system.isGateOpen('azul')).toBe(true);
    system.setTouchingLevers(new Set());
    expect(system.isGateOpen('azul')).toBe(true);
  });

  it('re-alternar la palanca cierra la compuerta', () => {
    const system = new SwitchSystem(['azul']);
    system.setTouchingLevers(new Set(['azul']));
    system.setTouchingLevers(new Set());
    system.setTouchingLevers(new Set(['azul']));
    expect(system.isGateOpen('azul')).toBe(false);
  });

  it('un botón de otro ID no afecta a la palanca', () => {
    const system = new SwitchSystem(['azul']);
    system.setPressedButtons(new Set(['rojo']));
    expect(system.isGateOpen('azul')).toBe(false);
  });
});
