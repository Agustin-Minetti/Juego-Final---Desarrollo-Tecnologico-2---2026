import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { TILE_SIZE } from '../config/game';
import { TEXTURE_KEYS } from '../config/textures';

function hex(color: string): number {
  return Phaser.Display.Color.HexStringToColor(color).color;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.generateWallTexture();
    this.generateLumoTexture();
    this.generateUmbraTexture();
    this.scene.start('Game');
  }

  private generateWallTexture(): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(COLORS.wall), 1);
    gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gfx.lineStyle(2, hex(COLORS.wallEdge), 1);
    gfx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
    gfx.generateTexture(TEXTURE_KEYS.wall, TILE_SIZE, TILE_SIZE);
    gfx.destroy();
  }

  private generateLumoTexture(): void {
    const width = 32;
    const height = 40;
    const cx = width / 2;
    const cy = height / 2;
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(COLORS.lumoHalo), 0.35);
    gfx.fillCircle(cx, cy, 15);
    gfx.fillStyle(hex(COLORS.lumo), 1);
    gfx.fillCircle(cx, cy, 12);
    gfx.generateTexture(TEXTURE_KEYS.lumo, width, height);
    gfx.destroy();
  }

  private generateUmbraTexture(): void {
    const width = 32;
    const height = 40;
    const cx = width / 2;
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(COLORS.umbra), 1);
    gfx.fillCircle(cx, 13, 9);
    gfx.fillRoundedRect(cx - 11, 18, 22, 20, 8);
    gfx.lineStyle(2, hex(COLORS.umbraOutline), 1);
    gfx.strokeCircle(cx, 13, 9);
    gfx.strokeRoundedRect(cx - 11, 18, 22, 20, 8);
    gfx.generateTexture(TEXTURE_KEYS.umbra, width, height);
    gfx.destroy();
  }
}
