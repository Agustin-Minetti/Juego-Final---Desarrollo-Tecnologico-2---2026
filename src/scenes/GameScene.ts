import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { isDebugMode } from '../config/debug';
import { TILE_SIZE } from '../config/game';
import { KEY_CODES } from '../config/keys';
import { DEFAULT_LEVEL, hasLevel, LEVELS, levelIds } from '../config/levels';
import { TEXTURE_KEYS } from '../config/textures';
import {
  createControlState,
  schemeFor,
  switchActive,
  type ControlledPlayer,
  type ControlState,
} from '../logic/controlMode';
import { parseLevel, type ParsedLevel } from '../logic/levelParser';
import {
  browserStorage,
  loadProgress,
  recordResult,
  saveProgress,
} from '../logic/progress';
import { formatTime, scoreLevel } from '../logic/scoring';
import {
  buildHazardMap,
  diesIn,
  hazardsTouching,
  rectsOverlap,
  resolveOutcome,
  type BodyBounds,
  type Hazard as HazardType,
  type HazardCell,
} from '../logic/rules';
import { SwitchSystem } from '../logic/switches';
import { Barrier } from '../objects/Barrier';
import { Button } from '../objects/Button';
import { Crystal } from '../objects/Crystal';
import { Door } from '../objects/Door';
import { Gate } from '../objects/Gate';
import { Gem } from '../objects/Gem';
import { Hazard } from '../objects/Hazard';
import { Lever } from '../objects/Lever';
import { Player, type PlayerKeys } from '../objects/Player';
import { createButton, textStyle, type UiButton } from './ui';

const DEATH_PAUSE_MS = 500;
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
  private pauseKey?: Phaser.Input.Keyboard.Key;
  private debugKeys: Phaser.Input.Keyboard.Key[] = [];
  private modeLabel?: Phaser.GameObjects.Text;
  private hudTime?: Phaser.GameObjects.Text;
  private hudGems?: Phaser.GameObjects.Text;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private muteButton?: UiButton;
  private pitBodies: Hazard[] = [];
  private pitCells = new Map<string, HazardType>();
  private abyssCells = new Map<string, HazardType>();
  private buttons: Button[] = [];
  private levers: Lever[] = [];
  private gates: Gate[] = [];
  private crystals: Crystal[] = [];
  private barriers: Barrier[] = [];
  private gems: Gem[] = [];
  private switchSystem = new SwitchSystem();
  private collectedGems = 0;
  private totalGems = 0;
  private levelId: string = DEFAULT_LEVEL;
  private controlState: ControlState = createControlState();
  private status: SceneStatus = 'playing';
  private paused = false;
  private elapsedMs = 0;
  private timeTargetMs = 0;

  constructor() {
    super('Game');
  }

  init(data: GameSceneData = {}): void {
    this.levelId = data.levelId !== undefined && hasLevel(data.levelId) ? data.levelId : DEFAULT_LEVEL;
    this.controlState = data.controlState ?? createControlState();
    this.status = 'playing';
    this.paused = false;
    this.elapsedMs = 0;
    this.pitCells = new Map();
    this.abyssCells = new Map();
    this.debugKeys = [];
    this.pitBodies = [];
    this.buttons = [];
    this.levers = [];
    this.gates = [];
    this.crystals = [];
    this.barriers = [];
    this.gems = [];
    this.collectedGems = 0;
    this.totalGems = 0;
  }

  create(): void {
    const level = parseLevel(LEVELS[this.levelId]);
    this.timeTargetMs = level.timeTarget * 1000;

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
    this.createElements(level);

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
    this.pauseKey = keyboard.addKey(KEY_CODES.pause);
    this.debugKeys = KEY_CODES.debugLevels.map((code) => keyboard.addKey(code));

    this.lumo = new Player(this, level.spawns.lumo.x, level.spawns.lumo.y, TEXTURE_KEYS.lumo);
    this.umbra = new Player(this, level.spawns.umbra.x, level.spawns.umbra.y, TEXTURE_KEYS.umbra);

    this.physics.add.collider(this.lumo, walls);
    this.physics.add.collider(this.umbra, walls);
    this.physics.add.collider(this.lumo, this.pitBodies);
    this.physics.add.collider(this.umbra, this.pitBodies);
    this.physics.add.collider(this.lumo, doors);
    this.physics.add.collider(this.umbra, doors);

    this.physics.add.collider(this.lumo, this.gates);
    this.physics.add.collider(this.umbra, this.gates);
    this.physics.add.collider(this.lumo, this.crystals, (_lumo, crystal) =>
      (crystal as Crystal).dissolve(),
    );
    this.physics.add.collider(this.umbra, this.crystals);
    this.physics.add.collider(this.umbra, this.barriers, (_umbra, barrier) =>
      (barrier as Barrier).dissolve(),
    );
    this.physics.add.collider(this.lumo, this.barriers);
    this.physics.add.overlap(this.lumo, this.goldGems(), (_lumo, gem) =>
      this.collectGem(gem as Gem),
    );
    this.physics.add.overlap(this.umbra, this.violetGems(), (_umbra, gem) =>
      this.collectGem(gem as Gem),
    );

    this.createHud();
    this.createPauseOverlay();

    if (isDebugMode()) {
      this.modeLabel = this.add
        .text(12, 70, this.modeLabelText(), {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: COLORS.text,
        })
        .setDepth(260);
    }
  }

  /** HUD durante el nivel: tiempo `mm:ss`, gemas `X/Y` e icono del modo (M5). */
  private createHud(): void {
    const pad = 12;
    const mode = this.controlState.mode === 'two-player' ? '2P' : '1P';
    this.hudTime = this.add.text(pad, pad, formatTime(0), textStyle(COLORS.text, 22)).setDepth(250);
    this.hudGems = this.add
      .text(pad, pad + 30, `0/${this.totalGems}`, textStyle(COLORS.gemGold, 18))
      .setDepth(250);
    this.add
      .text(this.scale.width - pad, pad, mode, textStyle(COLORS.text, 22))
      .setOrigin(1, 0)
      .setDepth(250);
  }

  /** Pausa como overlay dentro de GameScene (M8): congela física y tweens. */
  private createPauseOverlay(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    const shade = this.add
      .rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.6)
      .setDepth(300);
    const title = this.add
      .text(cx, cy - 110, 'Pausa', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(301);

    const resume = createButton(this, cx, cy - 20, 'Reanudar (Esc)', () => this.togglePause(), {
      width: 260,
    });
    const restart = createButton(this, cx, cy + 40, 'Reiniciar (R)', () => this.restartLevel(this.levelId), {
      width: 260,
    });
    this.muteButton = createButton(this, cx, cy + 100, this.muteLabel(), () => this.toggleMute(), {
      width: 260,
    });

    this.pauseOverlay = this.add
      .container(0, 0, [shade, title, resume.root, restart.root, this.muteButton.root])
      .setDepth(300)
      .setVisible(false);
  }

  private muteLabel(): string {
    return this.sound.mute ? 'Silencio: ON' : 'Silencio: OFF';
  }

  private toggleMute(): void {
    this.sound.mute = !this.sound.mute;
    this.muteButton?.label.setText(this.muteLabel());
  }

  private togglePause(): void {
    if (this.status !== 'playing') {
      return;
    }
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.tweens.pauseAll();
    } else {
      this.physics.resume();
      this.tweens.resumeAll();
    }
    this.pauseOverlay?.setVisible(this.paused);
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

  private createElements(level: ParsedLevel): void {
    for (const entity of level.entities) {
      if (entity.type === 'button') {
        this.buttons.push(new Button(this, entity.x, entity.y, entity.id));
      } else if (entity.type === 'lever') {
        this.levers.push(new Lever(this, entity.x, entity.y, entity.id));
      } else {
        this.gates.push(new Gate(this, entity.x, entity.y, entity.id));
      }
    }

    this.switchSystem = new SwitchSystem(this.levers.map((lever) => lever.id));

    for (const point of level.crystals) {
      this.crystals.push(new Crystal(this, point.x, point.y));
    }
    for (const point of level.barriers) {
      this.barriers.push(new Barrier(this, point.x, point.y));
    }
    for (const point of level.gems.gold) {
      this.gems.push(new Gem(this, point.x, point.y, 'gold'));
    }
    for (const point of level.gems.violet) {
      this.gems.push(new Gem(this, point.x, point.y, 'violet'));
    }
    this.totalGems = this.gems.length;
    this.collectedGems = 0;
  }

  private playersOn(): Player[] {
    return [this.lumo, this.umbra].filter((player): player is Player => player !== undefined);
  }

  private goldGems(): Gem[] {
    return this.gems.filter((gem) => gem.kind === 'gold');
  }

  private violetGems(): Gem[] {
    return this.gems.filter((gem) => gem.kind === 'violet');
  }

  private collectGem(gem: Gem): void {
    if (gem.isCollected) {
      return;
    }
    gem.collect();
    this.collectedGems++;
  }

  private updateSwitches(): void {
    const players = this.playersOn();

    const pressed = new Set<string>();
    for (const button of this.buttons) {
      const isPressed = players.some((player) => button.isPlayerStanding(player));
      button.setPressed(isPressed);
      if (isPressed) {
        pressed.add(button.id);
      }
    }
    this.switchSystem.setPressedButtons(pressed);

    const touching = new Set<string>();
    for (const lever of this.levers) {
      if (players.some((player) => lever.isPlayerStanding(player))) {
        touching.add(lever.id);
      }
    }
    this.switchSystem.setTouchingLevers(touching);
    for (const lever of this.levers) {
      lever.setOn(this.switchSystem.isLeverOn(lever.id));
    }

    for (const gate of this.gates) {
      gate.updateState(this.switchSystem.isGateOpen(gate.id), this.cellOccupied(gate.tx, gate.ty));
    }
  }

  /** ¿Hay algún personaje ocupando el tile (tx, ty)? (cierre de compuertas). */
  private cellOccupied(tx: number, ty: number): boolean {
    const left = tx * TILE_SIZE;
    const top = ty * TILE_SIZE;
    const cell = { left, right: left + TILE_SIZE, top, bottom: top + TILE_SIZE };
    return this.playersOn().some((player) => {
      const body = player.body as Phaser.Physics.Arcade.Body;
      return rectsOverlap(
        { left: body.x, right: body.x + body.width, top: body.y, bottom: body.y + body.height },
        cell,
      );
    });
  }

  update(time: number, delta: number): void {
    if (this.restartKey && Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.restartLevel(this.levelId);
      return;
    }
    if (isDebugMode()) {
      this.updateDebugKeys();
    }
    if (this.pauseKey && Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.togglePause();
    }
    if (this.status !== 'playing' || this.paused) {
      return;
    }

    this.elapsedMs += delta;

    if (this.swapKey && Phaser.Input.Keyboard.JustDown(this.swapKey)) {
      this.controlState = switchActive(this.controlState);
      this.modeLabel?.setText(this.modeLabelText());
    }

    this.lumo?.update(time, this.inputFor('lumo'));
    this.umbra?.update(time, this.inputFor('umbra'));

    if (this.controlState.mode === 'one-player' && this.arrowKeys) {
      Phaser.Input.Keyboard.JustDown(this.arrowKeys.jump);
      Phaser.Input.Keyboard.JustUp(this.arrowKeys.jump);
    }

    this.updateSwitches();

    this.hudTime?.setText(formatTime(this.elapsedMs));
    this.hudGems?.setText(`${this.collectedGems}/${this.totalGems}`);

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

    this.modeLabel?.setText(this.modeLabelText());
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

    const ids = levelIds();
    const index = Math.max(0, ids.indexOf(this.levelId));
    const score = scoreLevel({
      gemsCollected: this.collectedGems,
      totalGems: this.totalGems,
      elapsedMs: this.elapsedMs,
      timeTargetMs: this.timeTargetMs,
    });

    const storage = browserStorage();
    saveProgress(storage, recordResult(loadProgress(storage), this.levelId, index, score.stars, ids.length));

    this.scene.start('Result', {
      levelId: this.levelId,
      levelIndex: index,
      mode: this.controlState.mode,
      elapsedMs: this.elapsedMs,
      gemsCollected: this.collectedGems,
      totalGems: this.totalGems,
      score,
    });
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
    return `${this.levelId} · ${mode} · gemas ${this.collectedGems}/${this.totalGems}`;
  }
}
