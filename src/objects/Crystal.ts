import Phaser from 'phaser';
import { TEXTURE_KEYS } from '../config/textures';
import { Dissolvable } from './Dissolvable';

/** Cristal oscuro: Lumo lo disuelve al tocarlo (DESIGN → Elementos del nivel). */
export class Crystal extends Dissolvable {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEXTURE_KEYS.crystal);
  }
}
