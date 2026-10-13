import Phaser from 'phaser';
import { COLORS, colorToNumber } from '../config/colors';
import { TEXTURE_KEYS } from '../config/textures';
import { isStandingOn } from '../logic/rules';

const UNLIT_ALPHA = 0.45;
const LIT_ALPHA = 1;

export class Door extends Phaser.Physics.Arcade.Sprite {
  readonly character: 'lumo' | 'umbra';
  private lit = false;
  private glow?: Phaser.Filters.Glow;

  constructor(scene: Phaser.Scene, x: number, y: number, character: 'lumo' | 'umbra') {
    const key = character === 'lumo' ? TEXTURE_KEYS.doorLumo : TEXTURE_KEYS.doorUmbra;
    super(scene, x, y, key);
    this.character = character;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setAlpha(UNLIT_ALPHA);

    if (scene.game.renderer.type === Phaser.WEBGL) {
      this.enableFilters();
      const color = character === 'lumo' ? COLORS.lumo : COLORS.umbra;
      this.glow = this.filters?.internal.addGlow(colorToNumber(color), 4, 0, 1);
      this.glow?.setActive(false);
    }
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
    this.glow?.setActive(lit);
  }
}
