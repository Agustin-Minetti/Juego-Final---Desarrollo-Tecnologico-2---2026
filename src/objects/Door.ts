import Phaser from 'phaser';
import { COLORS, colorToNumber } from '../config/colors';
import { TILE_SIZE } from '../config/game';
import { TEXTURE_KEYS } from '../config/textures';
import { isStandingOn } from '../logic/rules';

const UNLIT_ALPHA = 0.75;
const LIT_ALPHA = 1;
const ARCH_UNLIT_ALPHA = 0.55;

/**
 * Puerta de salida: un pedestal sólido con el emblema del personaje (sol para
 * Lumo, luna para Umbra) y un arco-portal decorativo encima. Se ilumina con el
 * Glow de Phaser 4 cuando su personaje está parado encima.
 */
export class Door extends Phaser.Physics.Arcade.Sprite {
  readonly character: 'lumo' | 'umbra';
  private lit = false;
  private glow?: Phaser.Filters.Glow;
  private archGlow?: Phaser.Filters.Glow;
  private readonly arch: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, character: 'lumo' | 'umbra') {
    const key = character === 'lumo' ? TEXTURE_KEYS.doorLumo : TEXTURE_KEYS.doorUmbra;
    super(scene, x, y, key);
    this.character = character;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setAlpha(UNLIT_ALPHA).setDepth(3);

    const archKey = character === 'lumo' ? TEXTURE_KEYS.archLumo : TEXTURE_KEYS.archUmbra;
    this.arch = scene.add
      .image(x, y - TILE_SIZE / 2, archKey)
      .setOrigin(0.5, 1)
      .setAlpha(ARCH_UNLIT_ALPHA)
      .setDepth(4);
    scene.tweens.add({
      targets: this.arch,
      alpha: ARCH_UNLIT_ALPHA * 0.7,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    if (scene.game.renderer.type === Phaser.WEBGL) {
      const color = colorToNumber(character === 'lumo' ? COLORS.lumo : COLORS.umbraOutline);
      this.enableFilters();
      this.glow = this.filters?.internal.addGlow(color, 4, 0, 1);
      this.glow?.setActive(false);
      this.arch.enableFilters();
      this.archGlow = this.arch.filters?.internal.addGlow(color, 6, 0, 1);
      this.archGlow?.setActive(false);
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
    this.archGlow?.setActive(lit);
    this.scene.tweens.killTweensOf(this.arch);
    if (lit) {
      this.arch.setAlpha(1);
    } else {
      this.arch.setAlpha(ARCH_UNLIT_ALPHA);
      this.scene.tweens.add({
        targets: this.arch,
        alpha: ARCH_UNLIT_ALPHA * 0.7,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
