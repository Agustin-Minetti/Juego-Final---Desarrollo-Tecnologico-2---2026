import Phaser from 'phaser';
import { SFX_FILES } from '../config/audio';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../config/game';
import { PLAYER_TEXTURE_HEIGHT, PLAYER_TEXTURE_WIDTH } from '../config/physics';
import { TEXTURE_KEYS, WALL_VARIANTS, wallTextureKey } from '../config/textures';
import {
  drawAbyss,
  drawBackground,
  drawBarrier,
  drawButton,
  drawCrystal,
  drawDoorArch,
  drawDoorBase,
  drawGate,
  drawGem,
  drawLever,
  drawLightPit,
  drawLumo,
  drawLumoAura,
  drawMoonBadge,
  drawShadowPit,
  drawSmoke,
  drawSpark,
  drawSunBadge,
  drawUmbra,
  drawUmbraAura,
  drawWall,
} from '../fx/art';

export const AURA_SIZE = 160;
export const ARCH_WIDTH = 32;
export const ARCH_HEIGHT = 52;
export const BUTTON_TEXTURE_HEIGHT = 12;
export const LEVER_TEXTURE_HEIGHT = 24;
export const BADGE_SIZE = 22;

/**
 * Genera todas las texturas por código (Canvas 2D, ver `fx/art.ts`) y carga
 * los efectos de sonido. No hay sprites externos.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const sfx of SFX_FILES) {
      this.load.audio(sfx.key, sfx.path);
    }
  }

  create(): void {
    const s = TILE_SIZE;
    this.canvasTexture(TEXTURE_KEYS.background, GAME_WIDTH, GAME_HEIGHT, (ctx) =>
      drawBackground(ctx, GAME_WIDTH, GAME_HEIGHT),
    );
    for (let variant = 0; variant < WALL_VARIANTS; variant++) {
      this.canvasTexture(wallTextureKey(false, variant), s, s, (ctx) => drawWall(ctx, s, variant, false));
      this.canvasTexture(wallTextureKey(true, variant), s, s, (ctx) => drawWall(ctx, s, variant, true));
    }
    this.canvasTexture(TEXTURE_KEYS.lightPit, s, s, (ctx) => drawLightPit(ctx, s, false));
    this.canvasTexture(TEXTURE_KEYS.lightPitTop, s, s, (ctx) => drawLightPit(ctx, s, true));
    this.canvasTexture(TEXTURE_KEYS.shadowPit, s, s, (ctx) => drawShadowPit(ctx, s, false));
    this.canvasTexture(TEXTURE_KEYS.shadowPitTop, s, s, (ctx) => drawShadowPit(ctx, s, true));
    this.canvasTexture(TEXTURE_KEYS.abyss, s, s, (ctx) => drawAbyss(ctx, s, false));
    this.canvasTexture(TEXTURE_KEYS.abyssTop, s, s, (ctx) => drawAbyss(ctx, s, true));

    const pw = PLAYER_TEXTURE_WIDTH;
    const ph = PLAYER_TEXTURE_HEIGHT;
    this.canvasTexture(TEXTURE_KEYS.lumo, pw, ph, (ctx) => drawLumo(ctx, pw, ph));
    this.canvasTexture(TEXTURE_KEYS.umbra, pw, ph, (ctx) => drawUmbra(ctx, pw, ph));
    this.canvasTexture(TEXTURE_KEYS.lumoAura, AURA_SIZE, AURA_SIZE, (ctx) => drawLumoAura(ctx, AURA_SIZE));
    this.canvasTexture(TEXTURE_KEYS.umbraAura, AURA_SIZE, AURA_SIZE, (ctx) => drawUmbraAura(ctx, AURA_SIZE));

    this.canvasTexture(TEXTURE_KEYS.doorLumo, s, s, (ctx) => drawDoorBase(ctx, s, 'lumo'));
    this.canvasTexture(TEXTURE_KEYS.doorUmbra, s, s, (ctx) => drawDoorBase(ctx, s, 'umbra'));
    this.canvasTexture(TEXTURE_KEYS.archLumo, ARCH_WIDTH, ARCH_HEIGHT, (ctx) =>
      drawDoorArch(ctx, ARCH_WIDTH, ARCH_HEIGHT, 'lumo'),
    );
    this.canvasTexture(TEXTURE_KEYS.archUmbra, ARCH_WIDTH, ARCH_HEIGHT, (ctx) =>
      drawDoorArch(ctx, ARCH_WIDTH, ARCH_HEIGHT, 'umbra'),
    );

    this.canvasTexture(TEXTURE_KEYS.button, s, BUTTON_TEXTURE_HEIGHT, (ctx) =>
      drawButton(ctx, s, BUTTON_TEXTURE_HEIGHT),
    );
    this.canvasTexture(TEXTURE_KEYS.lever, s, LEVER_TEXTURE_HEIGHT, (ctx) =>
      drawLever(ctx, s, LEVER_TEXTURE_HEIGHT),
    );
    this.canvasTexture(TEXTURE_KEYS.gate, s, s, (ctx) => drawGate(ctx, s));
    this.canvasTexture(TEXTURE_KEYS.gemGold, s, s, (ctx) => drawGem(ctx, s, 'gold'));
    this.canvasTexture(TEXTURE_KEYS.gemViolet, s, s, (ctx) => drawGem(ctx, s, 'violet'));
    this.canvasTexture(TEXTURE_KEYS.crystal, s, s, (ctx) => drawCrystal(ctx, s));
    this.canvasTexture(TEXTURE_KEYS.barrier, s, s, (ctx) => drawBarrier(ctx, s));
    this.canvasTexture(TEXTURE_KEYS.spark, 8, 8, (ctx) => drawSpark(ctx, 8));
    this.canvasTexture(TEXTURE_KEYS.smoke, 16, 16, (ctx) => drawSmoke(ctx, 16));
    this.canvasTexture(TEXTURE_KEYS.sunBadge, BADGE_SIZE, BADGE_SIZE, (ctx) => drawSunBadge(ctx, BADGE_SIZE));
    this.canvasTexture(TEXTURE_KEYS.moonBadge, BADGE_SIZE, BADGE_SIZE, (ctx) => drawMoonBadge(ctx, BADGE_SIZE));

    this.scene.start('Menu');
  }

  /** Crea una textura de canvas, la dibuja con `draw` y la sube a la GPU. */
  private canvasTexture(
    key: string,
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ): void {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
    const texture = this.textures.createCanvas(key, width, height);
    if (!texture) {
      throw new Error(`No se pudo crear la textura "${key}"`);
    }
    draw(texture.context);
    texture.refresh();
  }
}
