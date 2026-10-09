import Phaser from 'phaser';
import { TEXTURE_KEYS } from '../config/textures';

const COLLECT_MS = 200;

export type GemKind = 'gold' | 'violet';

/** Gema: dorada = Lumo, violeta = Umbra (DESIGN → Elementos del nivel). */
export class Gem extends Phaser.Physics.Arcade.Image {
  readonly kind: GemKind;
  private collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: GemKind) {
    super(scene, x, y, kind === 'gold' ? TEXTURE_KEYS.gemGold : TEXTURE_KEYS.gemViolet);
    this.kind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  get isCollected(): boolean {
    return this.collected;
  }

  collect(): void {
    if (this.collected) {
      return;
    }
    this.collected = true;
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.4,
      duration: COLLECT_MS,
      onComplete: () => this.destroy(),
    });
  }
}
