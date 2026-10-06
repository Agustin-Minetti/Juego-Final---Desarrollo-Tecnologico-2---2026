import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/game';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Lumo y Umbra', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: COLORS.text,
      })
      .setOrigin(0.5);
  }
}
