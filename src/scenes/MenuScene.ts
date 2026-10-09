import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/game';
import { createButton } from './ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, GAME_HEIGHT * 0.3, 'Lumo y Umbra', {
        fontFamily: 'monospace',
        fontSize: '56px',
        fontStyle: 'bold',
        color: COLORS.lumo,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT * 0.3 + 50, 'Dos espíritus, un camino', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    createButton(this, cx, GAME_HEIGHT * 0.62, 'Un jugador', () =>
      this.scene.start('LevelSelect', { mode: 'one-player' }),
    );
    createButton(this, cx, GAME_HEIGHT * 0.62 + 70, 'Dos jugadores', () =>
      this.scene.start('LevelSelect', { mode: 'two-player' }),
    );
  }
}
