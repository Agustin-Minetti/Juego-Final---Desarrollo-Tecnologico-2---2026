import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { isDebugMode } from '../config/debug';
import { TILE_SIZE } from '../config/game';
import { KEY_CODES } from '../config/keys';
import { TEXTURE_KEYS } from '../config/textures';
import {
  createControlState,
  nextControlState,
  schemeFor,
  type ControlledPlayer,
  type ControlState,
} from '../logic/controlMode';
import { parseLevel } from '../logic/levelParser';
import { Player, type PlayerKeys } from '../objects/Player';
import testLevelRaw from '../../levels/test.json?raw';

function hex(color: string): number {
  return Phaser.Display.Color.HexStringToColor(color).color;
}

export class GameScene extends Phaser.Scene {
  private lumo?: Player;
  private umbra?: Player;
  private wasdKeys?: PlayerKeys;
  private arrowKeys?: PlayerKeys;
  private controlState: ControlState = createControlState();
  private swapKey?: Phaser.Input.Keyboard.Key;
  private modeLabel?: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  create(): void {
    const level = parseLevel(testLevelRaw);

    const walls = this.physics.add.staticGroup();
    for (const tile of level.staticTiles) {
      walls.create(
        tile.tx * TILE_SIZE + TILE_SIZE / 2,
        tile.ty * TILE_SIZE + TILE_SIZE / 2,
        TEXTURE_KEYS.wall,
      );
    }

    this.add
      .rectangle(level.doors.lumo.x, level.doors.lumo.y, 24, 40, hex(COLORS.lumo))
      .setStrokeStyle(2, hex(COLORS.lumoHalo));
    this.add
      .rectangle(level.doors.umbra.x, level.doors.umbra.y, 24, 40, hex(COLORS.umbra))
      .setStrokeStyle(2, hex(COLORS.umbraOutline));

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Se requiere teclado para jugar');
    }

    this.wasdKeys = {
      left: keyboard.addKey(KEY_CODES.lumoMoveLeft),
      right: keyboard.addKey(KEY_CODES.lumoMoveRight),
      jump: keyboard.addKey(KEY_CODES.lumoJump),
    };
    this.arrowKeys = {
      left: keyboard.addKey(KEY_CODES.umbraMoveLeft),
      right: keyboard.addKey(KEY_CODES.umbraMoveRight),
      jump: keyboard.addKey(KEY_CODES.umbraJump),
    };

    this.lumo = new Player(this, level.spawns.lumo.x, level.spawns.lumo.y, TEXTURE_KEYS.lumo);
    this.umbra = new Player(this, level.spawns.umbra.x, level.spawns.umbra.y, TEXTURE_KEYS.umbra);

    this.physics.add.collider(this.lumo, walls);
    this.physics.add.collider(this.umbra, walls);

    this.swapKey = keyboard.addKey(KEY_CODES.swapCharacter);

    if (isDebugMode()) {
      this.modeLabel = this.add
        .text(8, 8, this.modeLabelText(), {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: COLORS.text,
        })
        .setDepth(100);
    }
  }

  update(time: number): void {
    if (this.swapKey && Phaser.Input.Keyboard.JustDown(this.swapKey)) {
      this.controlState = nextControlState(this.controlState);
      this.modeLabel?.setText(this.modeLabelText());
    }

    this.lumo?.update(time, this.inputFor('lumo'));
    this.umbra?.update(time, this.inputFor('umbra'));

    if (this.controlState.mode === 'one-player' && this.arrowKeys) {
      Phaser.Input.Keyboard.JustDown(this.arrowKeys.jump);
      Phaser.Input.Keyboard.JustUp(this.arrowKeys.jump);
    }
  }

  private inputFor(who: ControlledPlayer): PlayerKeys | null {
    const scheme = schemeFor(this.controlState, who);
    if (scheme === null) {
      return null;
    }
    const keys = scheme === 'wasd' ? this.wasdKeys : this.arrowKeys;
    return keys ?? null;
  }

  private modeLabelText(): string {
    if (this.controlState.mode === 'two-player') {
      return '2P';
    }
    return `1P ${this.controlState.active === 'lumo' ? 'Lumo' : 'Umbra'}`;
  }
}
