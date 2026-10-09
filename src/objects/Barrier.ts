import Phaser from 'phaser';
import { TEXTURE_KEYS } from '../config/textures';
import { Dissolvable } from './Dissolvable';

/** Barrera de luz: Umbra la apaga al tocarla (DESIGN → Elementos del nivel). */
export class Barrier extends Dissolvable {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE_KEYS.barrier);
  }
}
