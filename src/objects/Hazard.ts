import Phaser from 'phaser';
import { TEXTURE_KEYS } from '../config/textures';
import { diesIn, type Character, type Hazard as HazardType } from '../logic/rules';

function textureFor(hazard: HazardType): string {
  switch (hazard) {
    case 'lightPit':
      return TEXTURE_KEYS.lightPit;
    case 'shadowPit':
      return TEXTURE_KEYS.shadowPit;
    case 'abyss':
      return TEXTURE_KEYS.abyss;
  }
}

/**
 * Peligro de una celda: pozo de luz, pozo de sombra o abismo. Los pozos son
 * sólidos (actúan de piso, DESIGN → decisión A6); el abismo es un hueco.
 */
export class Hazard extends Phaser.Physics.Arcade.Image {
  readonly hazard: HazardType;

  constructor(scene: Phaser.Scene, x: number, y: number, hazard: HazardType) {
    super(scene, x, y, textureFor(hazard));
    this.hazard = hazard;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  kills(character: Character): boolean {
    return diesIn(character, this.hazard);
  }
}
