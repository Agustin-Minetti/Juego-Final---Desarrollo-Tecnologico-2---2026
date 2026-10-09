import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/game';
import { levelIds } from '../config/levels';
import { controlStateForMode, type ControlMode } from '../logic/controlMode';
import { browserStorage, isLevelUnlocked, loadProgress, MAX_STARS, starsFor } from '../logic/progress';
import { createButton } from './ui';

interface LevelSelectData {
  mode?: ControlMode;
}

const COLUMNS = 4;
const CELL_WIDTH = 130;
const CELL_HEIGHT = 120;
const GAP = 28;

function starLine(stars: number): string {
  return `${'★'.repeat(stars)}${'☆'.repeat(MAX_STARS - stars)}`;
}

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(data: LevelSelectData = {}): void {
    const mode: ControlMode = data.mode ?? 'two-player';
    const progress = loadProgress(browserStorage());
    const ids = levelIds();

    const modeLabel = mode === 'two-player' ? 'Dos jugadores' : 'Un jugador';
    this.add
      .text(GAME_WIDTH / 2, 60, `Elegir nivel · ${modeLabel}`, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: COLORS.text,
      })
      .setOrigin(0.5);

    const rows = Math.ceil(ids.length / COLUMNS);
    const totalWidth = COLUMNS * CELL_WIDTH + (COLUMNS - 1) * GAP;
    const totalHeight = rows * CELL_HEIGHT + (rows - 1) * GAP;
    const startX = (GAME_WIDTH - totalWidth) / 2 + CELL_WIDTH / 2;
    const startY = (GAME_HEIGHT - totalHeight) / 2 + CELL_HEIGHT / 2 + 20;

    ids.forEach((id, index) => {
      const col = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const x = startX + col * (CELL_WIDTH + GAP);
      const y = startY + row * (CELL_HEIGHT + GAP);
      const unlocked = isLevelUnlocked(progress, index);
      const label = unlocked ? `${id}\n${starLine(starsFor(progress, id))}` : `${id}\n· · ·`;

      createButton(
        this,
        x,
        y,
        label,
        () => this.scene.start('Game', { levelId: id, controlState: controlStateForMode(mode) }),
        { width: CELL_WIDTH, height: CELL_HEIGHT, enabled: unlocked, fontSize: 22 },
      );
    });

    createButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 46, 'Volver', () => this.scene.start('Menu'), {
      width: 200,
      height: 40,
      fontSize: 16,
    });
  }
}
