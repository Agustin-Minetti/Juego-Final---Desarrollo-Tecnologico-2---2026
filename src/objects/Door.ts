import Phaser from 'phaser';
import { TEXTURE_KEYS } from '../config/textures';
import { isStandingOn, type Character } from '../logic/rules';

const UNLIT_ALPHA = 0.45;
const LIT_ALPHA = 1;

/**
 * Puerta de salida de un personaje. Es sólida y se gana con el personaje
 * "encima" (cara inferior de los pies en contacto con la cara superior),
 * según DESIGN → Mecánicas > Elementos del nivel.
 */
export class Door extends Phaser.Physics.Arcade.Image {
  readonly character: Character;
  private lit = false;

  constructor(scene: Phaser.Scene, x: number, y: number, character: Character) {
    const key = character === 'lumo' ? TEXTURE_KEYS.doorLumo : TEXTURE_KEYS.doorUmbra;
    super(scene, x, y, key);
    this.character = character;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setAlpha(UNLIT_ALPHA);
  }

  isPlayerStanding(player: Phaser.Physics.Arcade.Sprite): boolean {
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    const doorBody = this.body as Phaser.Physics.Arcade.StaticBody;
    return isStandingOn(
      {
        left: playerBody.x,
        right: playerBody.x + playerBody.width,
        bottom: playerBody.y + playerBody.height,
      },
      {
        left: doorBody.x,
        right: doorBody.x + doorBody.width,
        top: doorBody.y,
      },
    );
  }

  setLit(lit: boolean): void {
    if (this.lit === lit) {
      return;
    }
    this.lit = lit;
    this.setAlpha(lit ? LIT_ALPHA : UNLIT_ALPHA);
  }
}
