import Phaser from 'phaser';
import { DISSOLVE_MS } from '../config/physics';

/**
 * Bloque sólido que se disuelve al contacto del personaje correcto
 * (DESIGN → Mecánicas: cristal oscuro y barrera de luz pierden la solidez al
 * instante; los 300 ms son solo la animación).
 */
export class Dissolvable extends Phaser.Physics.Arcade.Image {
  private solid = true;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
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
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.3,
      duration: DISSOLVE_MS,
      onComplete: () => this.destroy(),
    });
  }
}
