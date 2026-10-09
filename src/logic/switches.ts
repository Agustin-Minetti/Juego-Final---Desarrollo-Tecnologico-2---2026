export type SwitchId = string;

export interface LeverRuntime {
  readonly id: SwitchId;
  readonly on: boolean;
  readonly touching: boolean;
}

export function createLever(id: SwitchId): LeverRuntime {
  return { id, on: false, touching: false };
}

/**
 * Palanca (DESIGN → Mecánicas: alterna por borde de contacto; alterna una vez
 * al entrar y no vuelve a alternar mientras se mantenga el contacto).
 */
export function toggleLeverOnContact(lever: LeverRuntime, touchingNow: boolean): LeverRuntime {
  if (touchingNow && !lever.touching) {
    return { id: lever.id, on: !lever.on, touching: true };
  }
  if (lever.touching === touchingNow) {
    return lever;
  }
  return { id: lever.id, on: lever.on, touching: touchingNow };
}

/**
 * Estado de botones, palancas y compuertas por ID (DESIGN → Mecánicas:
 * Elementos del nivel). Un botón está activo mientras alguien lo pisa; una
 * palanca mantiene su estado hasta re-alternarse; una compuerta está abierta si
 * su ID está activo por un botón pisado o por una palanca encendida.
 */
export class SwitchSystem {
  private pressedButtons: ReadonlySet<SwitchId> = new Set();
  private readonly levers = new Map<SwitchId, LeverRuntime>();

  constructor(leverIds: Iterable<SwitchId> = []) {
    for (const id of leverIds) {
      this.levers.set(id, createLever(id));
    }
  }

  setPressedButtons(ids: ReadonlySet<SwitchId>): void {
    this.pressedButtons = new Set(ids);
  }

  setTouchingLevers(ids: ReadonlySet<SwitchId>): void {
    for (const [id, lever] of this.levers) {
      this.levers.set(id, toggleLeverOnContact(lever, ids.has(id)));
    }
  }

  isLeverOn(id: SwitchId): boolean {
    return this.levers.get(id)?.on ?? false;
  }

  isGateOpen(gateId: SwitchId): boolean {
    return this.pressedButtons.has(gateId) || (this.levers.get(gateId)?.on ?? false);
  }
}
