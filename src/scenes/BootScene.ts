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
    this.generateButtonTexture();
    this.generateLeverTexture();
    this.generateGateTexture();
    this.generateGemTextures();
    this.generateCrystalTexture();
    this.generateBarrierTexture();
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

  private generateButtonTexture(): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(COLORS.button), 1);
    gfx.fillRoundedRect(0, 0, TILE_SIZE, 10, 3);
    gfx.fillStyle(hex(COLORS.lumoHalo), 0.6);
    gfx.fillRoundedRect(2, 1, TILE_SIZE - 4, 4, 2);
    gfx.generateTexture(TEXTURE_KEYS.button, TILE_SIZE, 10);
    gfx.destroy();
  }

  private generateLeverTexture(): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(COLORS.lever), 1);
    gfx.fillRoundedRect(TILE_SIZE / 2 - 3, 0, 6, 15, 3);
    gfx.fillStyle(hex(COLORS.lever), 1);
    gfx.fillCircle(TILE_SIZE / 2, 4, 4);
    gfx.fillStyle(hex(COLORS.gate), 1);
    gfx.fillRoundedRect(2, 14, TILE_SIZE - 4, 6, 2);
    gfx.generateTexture(TEXTURE_KEYS.lever, TILE_SIZE, 20);
    gfx.destroy();
  }

  private generateGateTexture(): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(COLORS.gate), 1);
    gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gfx.lineStyle(3, hex(COLORS.gateEdge), 1);
    gfx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    gfx.lineBetween(4, TILE_SIZE / 2, TILE_SIZE - 4, TILE_SIZE / 2);
    gfx.generateTexture(TEXTURE_KEYS.gate, TILE_SIZE, TILE_SIZE);
    gfx.destroy();
  }

  private generateGemTextures(): void {
    this.generateGemTexture(TEXTURE_KEYS.gemGold, COLORS.gemGold);
    this.generateGemTexture(TEXTURE_KEYS.gemViolet, COLORS.gemViolet);
  }

  private generateGemTexture(key: string, color: string): void {
    const gfx = this.add.graphics();
    const c = TILE_SIZE / 2;
    gfx.fillStyle(hex(color), 1);
    gfx.beginPath();
    gfx.moveTo(c, c - 11);
    gfx.lineTo(c + 11, c);
    gfx.lineTo(c, c + 11);
    gfx.lineTo(c - 11, c);
    gfx.closePath();
    gfx.fillPath();
    gfx.lineStyle(2, hex(COLORS.text), 0.8);
    gfx.strokePath();
    gfx.generateTexture(key, TILE_SIZE, TILE_SIZE);
    gfx.destroy();
  }

  private generateCrystalTexture(): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(COLORS.crystal), 1);
    gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gfx.lineStyle(2, hex(COLORS.crystalEdge), 1);
    gfx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
    gfx.lineBetween(2, 2, TILE_SIZE - 2, TILE_SIZE - 2);
    gfx.lineBetween(TILE_SIZE - 2, 2, 2, TILE_SIZE - 2);
    gfx.generateTexture(TEXTURE_KEYS.crystal, TILE_SIZE, TILE_SIZE);
    gfx.destroy();
  }

  private generateBarrierTexture(): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(hex(COLORS.barrier), 0.5);
    gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gfx.lineStyle(2, hex(COLORS.barrierEdge), 1);
    gfx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
    for (let i = TILE_SIZE / 4; i < TILE_SIZE; i += TILE_SIZE / 4) {
      gfx.lineBetween(i, 2, i, TILE_SIZE - 2);
    }
    gfx.generateTexture(TEXTURE_KEYS.barrier, TILE_SIZE, TILE_SIZE);
    gfx.destroy();
  }
}
