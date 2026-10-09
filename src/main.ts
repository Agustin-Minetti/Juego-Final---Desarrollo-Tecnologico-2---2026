import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { MenuScene } from './scenes/MenuScene';
import { ResultScene } from './scenes/ResultScene';
import { isDebugMode } from './config/debug';
import { GAME_WIDTH, GAME_HEIGHT } from './config/game';
import { GRAVITY } from './config/physics';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1626',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      debug: isDebugMode(),
    },
  },
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene, ResultScene],
});
