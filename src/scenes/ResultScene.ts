import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/game';
import { levelIds } from '../config/levels';
import { controlStateForMode, type ControlMode } from '../logic/controlMode';
import { MAX_STARS } from '../logic/progress';
import { formatTime, type LevelScore } from '../logic/scoring';
import { createButton } from './ui';

export interface ResultData {
  levelId: string;
  levelIndex: number;
  mode: ControlMode;
  elapsedMs: number;
  gemsCollected: number;
  totalGems: number;
  score: LevelScore;
}

function starLine(stars: number): string {
  return `${'★'.repeat(stars)}${'☆'.repeat(MAX_STARS - stars)}`;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(data: ResultData): void {
    const cx = GAME_WIDTH / 2;
    const ids = levelIds();
    const hasNext = data.levelIndex + 1 < ids.length;
    const nextId = hasNext ? ids[data.levelIndex + 1] : null;

    this.add
      .text(cx, 90, `Nivel ${data.levelId} completado`, {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 170, starLine(data.score.stars), {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: COLORS.lumo,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 250, `Tiempo ${formatTime(data.elapsedMs)}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 290, `Gemas ${data.gemsCollected}/${data.totalGems}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: COLORS.gemGold,
      })
      .setOrigin(0.5);

    const buttonY = GAME_HEIGHT - 60;
    const actions: Array<{ label: string; run: () => void }> = [];
    if (nextId !== null) {
      actions.push({
        label: 'Siguiente nivel',
        run: () =>
          this.scene.start('Game', {
            levelId: nextId,
            controlState: controlStateForMode(data.mode),
          }),
      });
    }
    actions.push({
      label: 'Reintentar',
      run: () =>
        this.scene.start('Game', {
          levelId: data.levelId,
          controlState: controlStateForMode(data.mode),
        }),
    });
    actions.push({ label: 'Volver al menú', run: () => this.scene.start('Menu') });

    const width = 240;
    const gap = 20;
    const totalWidth = actions.length * width + (actions.length - 1) * gap;
    const startX = cx - totalWidth / 2 + width / 2;
    actions.forEach((action, index) => {
      createButton(this, startX + index * (width + gap), buttonY, action.label, action.run, {
        width,
        height: 46,
        fontSize: 16,
      });
    });
  }
}
