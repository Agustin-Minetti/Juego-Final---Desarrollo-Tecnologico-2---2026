import Phaser from 'phaser';

export const KEY_CODES = {
  lumoMoveLeft: Phaser.Input.Keyboard.KeyCodes.A,
  lumoMoveRight: Phaser.Input.Keyboard.KeyCodes.D,
  lumoJump: Phaser.Input.Keyboard.KeyCodes.W,
  umbraMoveLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
  umbraMoveRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
  umbraJump: Phaser.Input.Keyboard.KeyCodes.UP,
  restart: Phaser.Input.Keyboard.KeyCodes.R,
  pause: Phaser.Input.Keyboard.KeyCodes.ESC,
  swapCharacter: Phaser.Input.Keyboard.KeyCodes.TAB,
  debugLevels: [
    Phaser.Input.Keyboard.KeyCodes.ONE,
    Phaser.Input.Keyboard.KeyCodes.TWO,
    Phaser.Input.Keyboard.KeyCodes.THREE,
    Phaser.Input.Keyboard.KeyCodes.FOUR,
    Phaser.Input.Keyboard.KeyCodes.FIVE,
    Phaser.Input.Keyboard.KeyCodes.SIX,
    Phaser.Input.Keyboard.KeyCodes.SEVEN,
    Phaser.Input.Keyboard.KeyCodes.EIGHT,
  ],
} as const;
