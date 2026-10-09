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
    this.generatePitTextures();
    this.generateAbyssTexture();
    this.generateDoorTextures();
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

  private generatePitTextures(): void {
    this.generatePitTexture(TEXTURE_KEYS.lightPit, COLORS.lightPit);
    this.generatePitTexture(TEXTURE_KEYS.shadowPit, COLORS.shadowPit);
  }

  private generatePitTexture(key: string, color: string): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(color), 0.55);
    gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gfx.lineStyle(2, hex(color), 1);
    gfx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
    gfx.generateTexture(key, TILE_SIZE, TILE_SIZE);
    gfx.destroy();
  }

  private generateAbyssTexture(): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(COLORS.abyss), 1);
    gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gfx.generateTexture(TEXTURE_KEYS.abyss, TILE_SIZE, TILE_SIZE);
    gfx.destroy();
  }

  private generateDoorTextures(): void {
    this.generateDoorTexture(TEXTURE_KEYS.doorLumo, COLORS.lumo);
    this.generateDoorTexture(TEXTURE_KEYS.doorUmbra, COLORS.umbra);
  }

  private generateDoorTexture(key: string, color: string): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(color), 0.25);
    gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gfx.lineStyle(3, hex(color), 1);
    gfx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    gfx.generateTexture(key, TILE_SIZE, TILE_SIZE);
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
