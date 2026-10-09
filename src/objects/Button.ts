import Phaser from 'phaser';
import { colorForSwitch, colorToNumber } from '../config/colors';
import { TILE_SIZE } from '../config/game';
import { TEXTURE_KEYS } from '../config/textures';
import { isStandingOn } from '../logic/rules';
import type { Player } from './Player';

const BUTTON_HEIGHT = 10;
const PRESS_OFFSET = 3;

/**
 * Botón: activo mientras algún personaje lo pisa (DESIGN → Elementos del
 * nivel). Se coloca sobre un tile sólido y su cara superior coincide con la
 * superficie de apoyo.
 */
export class Button extends Phaser.GameObjects.Image {
  readonly id: string;
  private readonly tx: number;
  private readonly ty: number;
  private pressed = false;

  constructor(scene: Phaser.Scene, tx: number, ty: number, id: string) {
    super(scene, tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + BUTTON_HEIGHT / 2, TEXTURE_KEYS.button);
    this.id = id;
    this.tx = tx;
    this.ty = ty;
    scene.add.existing(this);
    this.setTint(colorToNumber(colorForSwitch(id)));
  }

  isPlayerStanding(player: Player): boolean {
    const body = player.body as Phaser.Physics.Arcade.Body;
    return isStandingOn(
      { left: body.x, right: body.x + body.width, bottom: body.y + body.height },
      { left: this.tx * TILE_SIZE, right: (this.tx + 1) * TILE_SIZE, top: this.ty * TILE_SIZE },
    );
  }

  setPressed(pressed: boolean): void {
    if (pressed === this.pressed) {
      return;
    }
    this.pressed = pressed;
    this.setY(this.ty * TILE_SIZE + BUTTON_HEIGHT / 2 + (pressed ? PRESS_OFFSET : 0));
  }
}
