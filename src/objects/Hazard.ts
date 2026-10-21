import Phaser from 'phaser';
import { TEXTURE_KEYS } from '../config/textures';
import { diesIn, type Character, type Hazard as HazardType } from '../logic/rules';

/** `top`: la celda tiene la superficie expuesta (se dibuja con borde/bruma). */
function textureFor(hazard: HazardType, top: boolean): string {
  switch (hazard) {
    case 'lightPit':
      return top ? TEXTURE_KEYS.lightPitTop : TEXTURE_KEYS.lightPit;
    case 'shadowPit':
      return top ? TEXTURE_KEYS.shadowPitTop : TEXTURE_KEYS.shadowPit;
    case 'abyss':
      return top ? TEXTURE_KEYS.abyssTop : TEXTURE_KEYS.abyss;
  }
}

/**
 * Peligro de una celda: pozo de luz, pozo de sombra o abismo. Los pozos son
 * sólidos (actúan de piso, DESIGN → decisión A6); el abismo es un hueco.
 */
export class Hazard extends Phaser.Physics.Arcade.Image {
  readonly hazard: HazardType;

  constructor(scene: Phaser.Scene, x: number, y: number, hazard: HazardType, top = false) {
    super(scene, x, y, textureFor(hazard, top));
    this.hazard = hazard;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(2);
  }

  kills(character: Character): boolean {
    return diesIn(character, this.hazard);
  }
}
