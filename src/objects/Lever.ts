import Phaser from 'phaser';
import { colorForSwitch, colorToNumber } from '../config/colors';
import { TILE_SIZE } from '../config/game';
import { TEXTURE_KEYS } from '../config/textures';
import { isStandingOn } from '../logic/rules';
import type { Player } from './Player';

const LEVER_HEIGHT = 24;
const SUNK = 2;
/** Apagada: el color del ID mezclado con gris (se sigue leyendo a qué compuerta va). */
const OFF_MIX = 0.6;
const OFF_GRAY = 0x8a8299;

function offTint(color: number): number {
  const mix = (shift: number): number => {
    const a = (color >> shift) & 255;
    const b = (OFF_GRAY >> shift) & 255;
    return Math.round(a * (1 - OFF_MIX) + b * OFF_MIX) << shift;
  };
  return mix(16) | mix(8) | mix(0);
}

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
    super(scene, tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE - LEVER_HEIGHT / 2 + SUNK, TEXTURE_KEYS.lever);
    this.id = id;
    this.tx = tx;
    this.ty = ty;
    scene.add.existing(this);
    this.setTint(offTint(colorToNumber(colorForSwitch(id)))).setDepth(8);
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
    const color = colorToNumber(colorForSwitch(this.id));
    this.setTint(on ? color : offTint(color));
    // apagada: inclinada a la izquierda; encendida: a la derecha
    this.setFlipX(on);
  }
}
