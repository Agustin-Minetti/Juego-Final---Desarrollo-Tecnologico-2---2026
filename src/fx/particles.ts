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
  const emitter = scene.add.particles(0, 0, isSpark ? TEXTURE_KEYS.spark : TEXTURE_KEYS.smoke, {
    lifespan: isSpark ? { min: 250, max: 450 } : { min: 450, max: 750 },
    speed: { min: isSpark ? 10 : 4, max: isSpark ? 40 : 20 },
    angle: { min: 240, max: 300 },
    scale: isSpark ? { start: 0.8, end: 0 } : { start: 0.7, end: 0.1 },
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
export function deathBurst(scene: Phaser.Scene, x: number, y: number, tint: number, count = 24): void {
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
  emitter.explode(count);
  scene.time.delayedCall(700, () => emitter.destroy());
}

export type PoolKind = 'light' | 'shadow' | 'abyss';

/**
 * Partículas que suben de la superficie de un pozo (DESIGN → Estética):
 * motas doradas aditivas en la luz, volutas violetas en la sombra y una bruma
 * tenue sobre el abismo. `x0`-`x1` es el tramo de superficie en píxeles.
 */
export function createPoolEmitter(
  scene: Phaser.Scene,
  x0: number,
  x1: number,
  surfaceY: number,
  kind: PoolKind,
): Phaser.GameObjects.Particles.ParticleEmitter {
  const width = x1 - x0;
  const zone: Phaser.Types.GameObjects.Particles.RandomZoneSource = {
    getRandomPoint: (point) => {
      point.x = x0 + Math.random() * width;
      point.y = surfaceY - 4 + Math.random() * 6;
    },
  };
  const perTile = Math.max(1, width / 32);
  const configs = {
    light: {
      texture: TEXTURE_KEYS.spark,
      lifespan: { min: 700, max: 1300 },
      speedY: { min: -45, max: -20 },
      speedX: { min: -6, max: 6 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: colorToNumber('#fff1b0'),
      blendMode: Phaser.BlendModes.ADD,
      frequency: 260 / perTile,
    },
    shadow: {
      texture: TEXTURE_KEYS.smoke,
      lifespan: { min: 900, max: 1600 },
      speedY: { min: -26, max: -10 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.5, end: 1.3 },
      alpha: { start: 0.55, end: 0 },
      tint: colorToNumber('#6a46a0'),
      blendMode: Phaser.BlendModes.NORMAL,
      frequency: 300 / perTile,
    },
    abyss: {
      texture: TEXTURE_KEYS.smoke,
      lifespan: { min: 1400, max: 2200 },
      speedY: { min: -12, max: -4 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.8, end: 1.6 },
      alpha: { start: 0.22, end: 0 },
      tint: colorToNumber('#8a6ab8'),
      blendMode: Phaser.BlendModes.NORMAL,
      frequency: 420 / perTile,
    },
  } as const;
  const c = configs[kind];
  const emitter = scene.add.particles(0, 0, c.texture, {
    lifespan: c.lifespan,
    speedY: c.speedY,
    speedX: c.speedX,
    scale: c.scale,
    alpha: c.alpha,
    tint: c.tint,
    blendMode: c.blendMode,
    frequency: c.frequency,
    emitZone: { type: 'random', source: zone },
  });
  emitter.setDepth(kind === 'light' ? 4 : 3);
  return emitter;
}
