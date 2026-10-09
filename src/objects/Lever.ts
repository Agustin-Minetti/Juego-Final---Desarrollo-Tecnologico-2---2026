import Phaser from 'phaser';
import { colorForSwitch, colorToNumber } from '../config/colors';
import { TILE_SIZE } from '../config/game';
import { TEXTURE_KEYS } from '../config/textures';
import { isStandingOn } from '../logic/rules';
import type { Player } from './Player';

const LEVER_HEIGHT = 20;
const OFF_TINT = 0x6b6478;

/**
 * Palanca: cualquiera de los personajes puede usarla; alterna por borde de
 * contacto y mantiene el estado hasta re-alternarse (DESIGN → Elementos del
 * nivel). El estado visual se refleja con el tinte.
 */
export class Lever extends Phaser.GameObjects.Image {
  readonly id: string;
  private readonly tx: number;
  private readonly ty: number;
  private onState = false;

  constructor(scene: Phaser.Scene, tx: number, ty: number, id: string) {
    super(scene, tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + LEVER_HEIGHT / 2, TEXTURE_KEYS.lever);
    this.id = id;
    this.tx = tx;
    this.ty = ty;
    scene.add.existing(this);
    this.setTint(OFF_TINT);
  }

  isPlayerStanding(player: Player): boolean {
    const body = player.body as Phaser.Physics.Arcade.Body;
    return isStandingOn(
      { left: body.x, right: body.x + body.width, bottom: body.y + body.height },
      { left: this.tx * TILE_SIZE, right: (this.tx + 1) * TILE_SIZE, top: this.ty * TILE_SIZE },
    );
  }

  setOn(on: boolean): void {
    if (on === this.onState) {
      return;
    }
    this.onState = on;
    this.setTint(on ? colorToNumber(colorForSwitch(this.id)) : OFF_TINT);
  }
}
