import Phaser from 'phaser';
import { COLORS, colorToNumber } from '../config/colors';
import { TEXTURE_KEYS } from '../config/textures';

export type TrailKind = 'spark' | 'smoke';

/**
 * Rastro de partículas que sigue a un personaje (DESIGN → Estética, juice).
 * `spark` = destellos dorados aditivos (Lumo); `smoke` = volutas violetas (Umbra).
 */
export function createTrail(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject & { x: number; y: number },
  kind: TrailKind,
): Phaser.GameObjects.Particles.ParticleEmitter {
  const isSpark = kind === 'spark';
  const emitter = scene.add.particles(0, 0, TEXTURE_KEYS.spark, {
    lifespan: isSpark ? { min: 250, max: 450 } : { min: 450, max: 750 },
    speed: { min: isSpark ? 10 : 4, max: isSpark ? 40 : 20 },
    angle: { min: 240, max: 300 },
    scale: isSpark ? { start: 0.7, end: 0 } : { start: 0.9, end: 0 },
    alpha: { start: isSpark ? 0.9 : 0.5, end: 0 },
    frequency: isSpark ? 70 : 110,
    tint: isSpark ? colorToNumber(COLORS.lumoHalo) : colorToNumber(COLORS.umbraOutline),
    blendMode: isSpark ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
    emitting: true,
  });
  emitter.setDepth(19);
  emitter.startFollow(target, 0, isSpark ? -6 : -10);
  return emitter;
}

/** Explosión de partículas del color del personaje al morir. */
export function deathBurst(scene: Phaser.Scene, x: number, y: number, tint: number): void {
  const emitter = scene.add.particles(x, y, TEXTURE_KEYS.spark, {
    lifespan: { min: 300, max: 650 },
    speed: { min: 60, max: 200 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    tint,
    blendMode: Phaser.BlendModes.ADD,
    emitting: false,
  });
  emitter.setDepth(30);
  emitter.explode(24);
  scene.time.delayedCall(700, () => emitter.destroy());
}
