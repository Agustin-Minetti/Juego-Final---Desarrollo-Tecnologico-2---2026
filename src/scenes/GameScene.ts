import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { TILE_SIZE } from '../config/game';
import { KEY_CODES } from '../config/keys';
import { TEXTURE_KEYS } from '../config/textures';
import { parseLevel } from '../logic/levelParser';
import { Player, type PlayerKeys } from '../objects/Player';
import testLevelRaw from '../../levels/test.json?raw';

function hex(color: string): number {
  return Phaser.Display.Color.HexStringToColor(color).color;
}

export class GameScene extends Phaser.Scene {
  private lumo?: Player;
  private umbra?: Player;

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

    const lumoKeys: PlayerKeys = {
      left: keyboard.addKey(KEY_CODES.lumoMoveLeft),
      right: keyboard.addKey(KEY_CODES.lumoMoveRight),
      jump: keyboard.addKey(KEY_CODES.lumoJump),
    };
    const umbraKeys: PlayerKeys = {
      left: keyboard.addKey(KEY_CODES.umbraMoveLeft),
      right: keyboard.addKey(KEY_CODES.umbraMoveRight),
      jump: keyboard.addKey(KEY_CODES.umbraJump),
    };

    this.lumo = new Player(this, level.spawns.lumo.x, level.spawns.lumo.y, TEXTURE_KEYS.lumo, lumoKeys);
    this.umbra = new Player(this, level.spawns.umbra.x, level.spawns.umbra.y, TEXTURE_KEYS.umbra, umbraKeys);

    this.physics.add.collider(this.lumo, walls);
    this.physics.add.collider(this.umbra, walls);
  }

  update(time: number): void {
    this.lumo?.update(time);
    this.umbra?.update(time);
  }
}
