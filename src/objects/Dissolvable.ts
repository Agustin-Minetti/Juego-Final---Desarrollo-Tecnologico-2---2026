import Phaser from 'phaser';
import { DISSOLVE_MS } from '../config/physics';
import { deathBurst } from '../fx/particles';

/**
 * Bloque sólido que se disuelve al contacto del personaje correcto
 * (DESIGN → Mecánicas: cristal oscuro y barrera de luz pierden la solidez al
 * instante; los 300 ms son solo la animación).
 */
export class Dissolvable extends Phaser.Physics.Arcade.Image {
  private solid = true;

  /** Color de las partículas al disolverse. */
  private readonly burstTint: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, burstTint: number) {
    super(scene, x, y, texture);
    this.burstTint = burstTint;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(5);
  }

  get isSolid(): boolean {
    return this.solid;
  }

  dissolve(): void {
    if (!this.solid) {
      return;
    }
    this.solid = false;
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
    deathBurst(this.scene, this.x, this.y, this.burstTint, 12);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.3,
      duration: DISSOLVE_MS,
      onComplete: () => this.destroy(),
    });
  }
}
