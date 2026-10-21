import Phaser from 'phaser';
import { COLORS, colorToNumber } from '../config/colors';
import { TEXTURE_KEYS } from '../config/textures';
import { Dissolvable } from './Dissolvable';

/** Barrera de luz: Umbra la apaga al tocarla (DESIGN → Elementos del nivel). */
export class Barrier extends Dissolvable {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE_KEYS.barrier, colorToNumber(COLORS.barrierEdge));
    // la luz titila
    scene.tweens.add({
      targets: this,
      alpha: 0.75,
      duration: 500 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
