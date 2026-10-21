import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/game';
import { TEXTURE_KEYS } from '../config/textures';
import { fadeIn } from '../fx/transitions';
import { createButton, textStyle } from './ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.add.image(0, 0, TEXTURE_KEYS.background).setOrigin(0, 0);

    this.add
      .text(cx, GAME_HEIGHT * 0.2, 'Lumo y Umbra', {
        fontFamily: 'monospace',
        fontSize: '56px',
        fontStyle: 'bold',
        color: COLORS.lumo,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.2 + 50, 'Dos espíritus, un camino', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    createButton(this, cx, GAME_HEIGHT * 0.52, 'Un jugador', () =>
      this.scene.start('LevelSelect', { mode: 'one-player' }),
    );
    createButton(this, cx, GAME_HEIGHT * 0.52 + 60, 'Dos jugadores', () =>
      this.scene.start('LevelSelect', { mode: 'two-player' }),
    );

    this.createLegend(GAME_HEIGHT * 0.8);

    fadeIn(this);
  }

  /**
   * Leyenda de los dos espíritus: controles y emblema. Todo lo marcado con su
   * emblema es seguro para ese personaje (o lo puede romper/apagar).
   */
  private createLegend(y: number): void {
    const rows: ReadonlyArray<{ x: number; sprite: string; badge: string; name: string; keys: string; rule: string; color: string }> = [
      {
        x: GAME_WIDTH * 0.27,
        sprite: TEXTURE_KEYS.lumo,
        badge: TEXTURE_KEYS.sunBadge,
        name: 'Lumo',
        keys: 'A / D  ·  W salta',
        rule: 'pisa la luz, rompe el cristal',
        color: COLORS.lumo,
      },
      {
        x: GAME_WIDTH * 0.73,
        sprite: TEXTURE_KEYS.umbra,
        badge: TEXTURE_KEYS.moonBadge,
        name: 'Umbra',
        keys: '← / →  ·  ↑ salta',
        rule: 'pisa la sombra, apaga la luz',
        color: COLORS.umbraOutline,
      },
    ];
    const panel = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 80, 92, 0x120e20, 0.55);
    panel.setStrokeStyle(1, 0x4a4066);
    for (const row of rows) {
      this.add.image(row.x - 150, y, row.sprite).setScale(1.3);
      this.add.image(row.x - 112, y, row.badge).setScale(1.2);
      this.add.text(row.x - 90, y - 30, row.name, textStyle(row.color, 20));
      this.add.text(row.x - 90, y - 4, row.keys, textStyle(COLORS.text, 15));
      this.add.text(row.x - 90, y + 16, `${row.rule}`, textStyle(COLORS.text, 13)).setAlpha(0.8);
    }
    this.add
      .text(GAME_WIDTH / 2, y + 58, 'R reinicia · Esc pausa · Tab cambia de personaje (un jugador)', textStyle(COLORS.text, 13))
      .setOrigin(0.5)
      .setAlpha(0.7);
  }
}
