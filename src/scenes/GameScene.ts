import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { isDebugMode } from '../config/debug';
import { TILE_SIZE } from '../config/game';
import { KEY_CODES } from '../config/keys';
import { DEFAULT_LEVEL, hasLevel, LEVELS, levelIds } from '../config/levels';
import { TEXTURE_KEYS } from '../config/textures';
import {
  createControlState,
  nextControlState,
  schemeFor,
  type ControlledPlayer,
  type ControlState,
} from '../logic/controlMode';
import { parseLevel, type ParsedLevel } from '../logic/levelParser';
import {
  buildHazardMap,
  diesIn,
  hazardsTouching,
  resolveOutcome,
  type BodyBounds,
  type Hazard as HazardType,
  type HazardCell,
} from '../logic/rules';
import { Door } from '../objects/Door';
import { Hazard } from '../objects/Hazard';
import { Player, type PlayerKeys } from '../objects/Player';

const DEATH_PAUSE_MS = 500;
const LEVEL_ADVANCE_MS = 1500;
const PIT_CONTACT_MARGIN = 2;

type SceneStatus = 'playing' | 'dead' | 'won';

interface GameSceneData {
  levelId?: string;
  controlState?: ControlState;
}

function tileOf(point: { x: number; y: number }): { tx: number; ty: number } {
  return { tx: Math.floor(point.x / TILE_SIZE), ty: Math.floor(point.y / TILE_SIZE) };
}

export class GameScene extends Phaser.Scene {
  private lumo?: Player;
  private umbra?: Player;
  private doorLumo?: Door;
  private doorUmbra?: Door;
  private wasdKeys?: PlayerKeys;
  private arrowKeys?: PlayerKeys;
  private swapKey?: Phaser.Input.Keyboard.Key;
  private restartKey?: Phaser.Input.Keyboard.Key;
  private debugKeys: Phaser.Input.Keyboard.Key[] = [];
  private modeLabel?: Phaser.GameObjects.Text;
  private pitBodies: Hazard[] = [];
  private pitCells = new Map<string, HazardType>();
  private abyssCells = new Map<string, HazardType>();
  private levelId: string = DEFAULT_LEVEL;
  private controlState: ControlState = createControlState();
  private status: SceneStatus = 'playing';

  constructor() {
    super('Game');
  }

  init(data: GameSceneData = {}): void {
    this.levelId = data.levelId !== undefined && hasLevel(data.levelId) ? data.levelId : DEFAULT_LEVEL;
    this.controlState = data.controlState ?? createControlState();
    this.status = 'playing';
    this.pitCells = new Map();
    this.abyssCells = new Map();
    this.debugKeys = [];
    this.pitBodies = [];
  }

  create(): void {
    const level = parseLevel(LEVELS[this.levelId]);

    const walls = this.physics.add.staticGroup();
    for (const tile of level.staticTiles) {
      if (tile.kind !== 'wall') {
        continue;
      }
      walls.create(
        tile.tx * TILE_SIZE + TILE_SIZE / 2,
        tile.ty * TILE_SIZE + TILE_SIZE / 2,
        TEXTURE_KEYS.wall,
      );
    }

    this.createHazards(level);
    const doors = this.createDoors(level);

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
    this.swapKey = keyboard.addKey(KEY_CODES.swapCharacter);
    this.restartKey = keyboard.addKey(KEY_CODES.restart);
    this.debugKeys = KEY_CODES.debugLevels.map((code) => keyboard.addKey(code));

    this.lumo = new Player(this, level.spawns.lumo.x, level.spawns.lumo.y, TEXTURE_KEYS.lumo);
    this.umbra = new Player(this, level.spawns.umbra.x, level.spawns.umbra.y, TEXTURE_KEYS.umbra);

    this.physics.add.collider(this.lumo, walls);
    this.physics.add.collider(this.umbra, walls);
    this.physics.add.collider(this.lumo, this.pitBodies);
    this.physics.add.collider(this.umbra, this.pitBodies);
    this.physics.add.collider(this.lumo, doors);
    this.physics.add.collider(this.umbra, doors);

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

  private createHazards(level: ParsedLevel): void {
    const pitCells: HazardCell[] = [];
    const abyssCells: HazardCell[] = [];

    for (const point of level.hazards.lightPit) {
      const { tx, ty } = tileOf(point);
      pitCells.push({ tx, ty, hazard: 'lightPit' });
      this.pitBodies.push(
        new Hazard(this, point.x, point.y, 'lightPit'),
      );
    }
    for (const point of level.hazards.shadowPit) {
      const { tx, ty } = tileOf(point);
      pitCells.push({ tx, ty, hazard: 'shadowPit' });
      this.pitBodies.push(
        new Hazard(this, point.x, point.y, 'shadowPit'),
      );
    }
    for (const point of level.hazards.abism) {
      const { tx, ty } = tileOf(point);
      abyssCells.push({ tx, ty, hazard: 'abyss' });
      new Hazard(this, point.x, point.y, 'abyss');
    }

    this.pitCells = buildHazardMap(pitCells);
    this.abyssCells = buildHazardMap(abyssCells);
  }

  private createDoors(level: ParsedLevel): Door[] {
    this.doorLumo = new Door(this, level.doors.lumo.x, level.doors.lumo.y, 'lumo');
    this.doorUmbra = new Door(this, level.doors.umbra.x, level.doors.umbra.y, 'umbra');
    return [this.doorLumo, this.doorUmbra];
  }

  update(time: number): void {
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.restartLevel(this.levelId);
      return;
    }
    this.updateDebugKeys();

    if (this.status !== 'playing') {
      return;
    }

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

    const diedThisFrame = this.checkDeaths();
    const lumoLit = !!this.lumo && this.doorLumo?.isPlayerStanding(this.lumo) === true;
    const umbraLit = !!this.umbra && this.doorUmbra?.isPlayerStanding(this.umbra) === true;
    this.doorLumo?.setLit(lumoLit);
    this.doorUmbra?.setLit(umbraLit);

    const outcome = resolveOutcome(diedThisFrame, lumoLit && umbraLit);
    if (outcome === 'death') {
      this.onDeath();
    } else if (outcome === 'victory') {
      this.onVictory();
    }
  }

  private checkDeaths(): boolean {
    let died = false;
    if (this.lumo && this.touchesLethal(this.lumo, 'lumo')) {
      died = true;
    }
    if (this.umbra && this.touchesLethal(this.umbra, 'umbra')) {
      died = true;
    }
    return died;
  }

  private touchesLethal(player: Player, character: ControlledPlayer): boolean {
    const body = player.body as Phaser.Physics.Arcade.Body;
    const bounds: BodyBounds = {
      left: body.x,
      right: body.x + body.width,
      top: body.y,
      bottom: body.y + body.height,
    };
    const touchedPits = hazardsTouching(bounds, this.pitCells, TILE_SIZE, PIT_CONTACT_MARGIN);
    const touchedAbyss = hazardsTouching(bounds, this.abyssCells, TILE_SIZE, 0);
    return [...touchedPits, ...touchedAbyss].some((hazard) => diesIn(character, hazard));
  }

  private onDeath(): void {
    this.status = 'dead';
    this.physics.pause();
    this.time.delayedCall(DEATH_PAUSE_MS, () => this.restartLevel(this.levelId));
  }

  private onVictory(): void {
    this.status = 'won';
    this.physics.pause();
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Nivel completado', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(200);

    const nextId = this.nextLevelId();
    const hint =
      nextId !== null ? `Cargando nivel ${nextId}…` : 'Último nivel · R para reiniciar';
    this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 40, hint, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(200);

    if (nextId !== null) {
      this.time.delayedCall(LEVEL_ADVANCE_MS, () => this.restartLevel(nextId));
    }
  }

  private nextLevelId(): string | null {
    const ids = levelIds();
    const index = ids.indexOf(this.levelId);
    if (index >= 0 && index + 1 < ids.length) {
      return ids[index + 1];
    }
    return null;
  }

  private restartLevel(levelId: string): void {
    this.scene.restart({ levelId, controlState: this.controlState });
  }

  private updateDebugKeys(): void {
    this.debugKeys.forEach((key, index) => {
      if (!Phaser.Input.Keyboard.JustDown(key)) {
        return;
      }
      const id = String(index + 1).padStart(2, '0');
      if (hasLevel(id) && id !== this.levelId) {
        this.restartLevel(id);
      }
    });
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
    const mode =
      this.controlState.mode === 'two-player'
        ? '2P'
        : `1P ${this.controlState.active === 'lumo' ? 'Lumo' : 'Umbra'}`;
    return `${this.levelId} · ${mode}`;
  }
}
