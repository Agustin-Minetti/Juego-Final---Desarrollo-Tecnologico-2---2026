import Phaser from 'phaser';
import { SFX_KEYS } from '../config/audio';
import { COLORS, colorToNumber } from '../config/colors';
import { isDebugMode } from '../config/debug';
import { TILE_SIZE } from '../config/game';
import { KEY_CODES } from '../config/keys';
import { DEFAULT_LEVEL, hasLevel, LEVELS, levelIds } from '../config/levels';
import { TEXTURE_KEYS, WALL_VARIANTS, wallTextureKey } from '../config/textures';
import { createPoolEmitter, createTrail, deathBurst, type PoolKind } from '../fx/particles';
import { playSfx } from '../fx/sfx';
import { fadeIn, fadeOutThen } from '../fx/transitions';
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
const HINT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: '"Trebuchet MS", Verdana, sans-serif',
  fontSize: '15px',
  color: COLORS.text,
  stroke: '#120e20',
  strokeThickness: 4,
};

/** Tramo horizontal de superficie de un pozo (para olas, partículas e icono). */
interface PoolRun {
  kind: PoolKind;
  x0: number;
  x1: number;
  top: number;
}

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
  private trails: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private ambient: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private poolRuns: PoolRun[] = [];
  private poolSurface?: Phaser.GameObjects.Graphics;
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
    this.trails = [];
    this.poolRuns = [];
    this.ambient = [];
    this.collectedGems = 0;
    this.totalGems = 0;
  }

  create(): void {
    const level = parseLevel(LEVELS[this.levelId]);
    this.timeTargetMs = level.timeTarget * 1000;

    this.add.image(0, 0, TEXTURE_KEYS.background).setOrigin(0, 0).setDepth(-100);

    const walls = this.physics.add.staticGroup();
    for (const tile of level.staticTiles) {
      if (tile.kind !== 'wall') {
        continue;
      }
      const top = level.grid[tile.ty - 1]?.[tile.tx] !== '#';
      const variant = (tile.tx * 7 + tile.ty * 13) % WALL_VARIANTS;
      const wall = walls.create(
        tile.tx * TILE_SIZE + TILE_SIZE / 2,
        tile.ty * TILE_SIZE + TILE_SIZE / 2,
        wallTextureKey(top, variant),
      ) as Phaser.Physics.Arcade.Sprite;
      wall.setDepth(1);
    }

    this.createHazards(level);
    this.createPoolDecor(level);
    this.createHints(level);
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

    this.lumo = new Player(this, level.spawns.lumo.x, level.spawns.lumo.y, TEXTURE_KEYS.lumo, {
      texture: TEXTURE_KEYS.lumoAura,
      blendMode: Phaser.BlendModes.ADD,
      alpha: 0.9,
      scale: 1,
    });
    this.umbra = new Player(this, level.spawns.umbra.x, level.spawns.umbra.y, TEXTURE_KEYS.umbra, {
      texture: TEXTURE_KEYS.umbraAura,
      blendMode: Phaser.BlendModes.NORMAL,
      alpha: 0.9,
      scale: 0.8,
    });

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

    this.trails.push(createTrail(this, this.lumo, 'spark'));
    this.trails.push(createTrail(this, this.umbra, 'smoke'));

    fadeIn(this);

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
      .text(cx, cy - 140, 'Pausa', {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(301);

    const resume = createButton(this, cx, cy - 60, 'Reanudar (Esc)', () => this.togglePause(), {
      width: 260,
    });
    const restart = createButton(this, cx, cy, 'Reiniciar (R)', () => this.restartLevel(this.levelId), {
      width: 260,
    });
    this.muteButton = createButton(this, cx, cy + 60, this.muteLabel(), () => this.toggleMute(), {
      width: 260,
    });
    const menu = createButton(this, cx, cy + 120, 'Menú principal', () => this.goToMenu(), {
      width: 260,
    });

    this.pauseOverlay = this.add
      .container(0, 0, [shade, title, resume.root, restart.root, this.muteButton.root, menu.root])
      .setDepth(300)
      .setVisible(false);
  }

  /** Vuelve al menú principal desde la pausa (sin guardar el intento en curso). */
  private goToMenu(): void {
    this.scene.start('Menu');
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
      this.trails.forEach((trail) => trail.pause());
      this.ambient.forEach((emitter) => emitter.pause());
    } else {
      this.physics.resume();
      this.tweens.resumeAll();
      this.trails.forEach((trail) => trail.resume());
      this.ambient.forEach((emitter) => emitter.resume());
    }
    this.pauseOverlay?.setVisible(this.paused);
  }

  private createHazards(level: ParsedLevel): void {
    const pitCells: HazardCell[] = [];
    const abyssCells: HazardCell[] = [];

    const exposed = (tx: number, ty: number, ch: string): boolean => level.grid[ty - 1]?.[tx] !== ch;

    for (const point of level.hazards.lightPit) {
      const { tx, ty } = tileOf(point);
      pitCells.push({ tx, ty, hazard: 'lightPit' });
      this.pitBodies.push(new Hazard(this, point.x, point.y, 'lightPit', exposed(tx, ty, 'p')));
    }
    for (const point of level.hazards.shadowPit) {
      const { tx, ty } = tileOf(point);
      pitCells.push({ tx, ty, hazard: 'shadowPit' });
      this.pitBodies.push(new Hazard(this, point.x, point.y, 'shadowPit', exposed(tx, ty, 's')));
    }
    for (const point of level.hazards.abism) {
      const { tx, ty } = tileOf(point);
      abyssCells.push({ tx, ty, hazard: 'abyss' });
      new Hazard(this, point.x, point.y, 'abyss', exposed(tx, ty, 'a'));
    }

    this.pitCells = buildHazardMap(pitCells);
    this.abyssCells = buildHazardMap(abyssCells);
  }

  /**
   * Superficies de los pozos: tramos horizontales expuestos de cada tipo. Cada
   * tramo lleva partículas, una ola animada y el emblema de quién lo pisa
   * (sol = Lumo, luna = Umbra), para que se entienda de un vistazo.
   */
  private createPoolDecor(level: ParsedLevel): void {
    const kinds: ReadonlyArray<readonly [string, PoolKind]> = [
      ['p', 'light'],
      ['s', 'shadow'],
      ['a', 'abyss'],
    ];
    level.grid.forEach((row, ty) => {
      for (const [ch, kind] of kinds) {
        let tx = 0;
        while (tx < row.length) {
          if (row[tx] !== ch || level.grid[ty - 1]?.[tx] === ch) {
            tx++;
            continue;
          }
          const start = tx;
          while (tx < row.length && row[tx] === ch && level.grid[ty - 1]?.[tx] !== ch) {
            tx++;
          }
          this.poolRuns.push({ kind, x0: start * TILE_SIZE, x1: tx * TILE_SIZE, top: ty * TILE_SIZE });
        }
      }
    });

    for (const run of this.poolRuns) {
      this.ambient.push(createPoolEmitter(this, run.x0, run.x1, run.top, run.kind));
      if (run.kind === 'abyss') {
        continue;
      }
      const badge = this.add
        .image((run.x0 + run.x1) / 2, run.top + TILE_SIZE / 2 + 2, run.kind === 'light' ? TEXTURE_KEYS.sunBadge : TEXTURE_KEYS.moonBadge)
        .setDepth(3);
      this.tweens.add({
        targets: badge,
        alpha: 0.55,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    this.poolSurface = this.add.graphics().setDepth(3);
  }

  /** Ola animada sobre cada tramo de pozo (onda senoidal, DESIGN → Estética). */
  private drawPoolSurfaces(time: number): void {
    const gfx = this.poolSurface;
    if (!gfx) {
      return;
    }
    gfx.clear();
    for (const run of this.poolRuns) {
      if (run.kind === 'abyss') {
        continue;
      }
      const light = run.kind === 'light';
      const phase = time * (light ? 0.004 : 0.0025);
      const wave = (x: number): number => Math.sin(phase + x * 0.18) * 1.6 + Math.sin(phase * 1.7 + x * 0.07) * 1.1;
      // resplandor / humo por encima de la superficie
      gfx.fillStyle(colorToNumber(light ? '#fff1b0' : '#2a1745'), light ? 0.28 : 0.45);
      gfx.beginPath();
      gfx.moveTo(run.x0, run.top + 2);
      for (let x = run.x0; x <= run.x1; x += 4) {
        gfx.lineTo(x, run.top - 4 + wave(x));
      }
      gfx.lineTo(run.x1, run.top + 2);
      gfx.closePath();
      gfx.fillPath();
      // línea de superficie
      gfx.lineStyle(2, colorToNumber(light ? '#fffbe8' : '#b48cff'), light ? 0.95 : 0.8);
      gfx.beginPath();
      gfx.moveTo(run.x0, run.top + 1 + wave(run.x0) * 0.5);
      for (let x = run.x0 + 4; x <= run.x1; x += 4) {
        gfx.lineTo(x, run.top + 1 + wave(x) * 0.5);
      }
      gfx.strokePath();
    }
  }

  /** Carteles de ayuda definidos en el JSON del nivel. */
  private createHints(level: ParsedLevel): void {
    for (const hint of level.hints) {
      this.add
        .text(hint.x * TILE_SIZE, hint.y * TILE_SIZE, hint.text, HINT_STYLE)
        .setAlpha(0.92)
        .setDepth(10);
    }
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
    playSfx(this, SFX_KEYS.gem);
  }

  private updateSwitches(): void {
    const players = this.playersOn();

    const pressed = new Set<string>();
    for (const button of this.buttons) {
      const isPressed = players.some((player) => button.isPlayerStanding(player));
      if (isPressed && !button.isPressed) {
        playSfx(this, SFX_KEYS.button);
      }
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
    if (!this.paused) {
      this.drawPoolSurfaces(time);
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

    const deadPlayers = this.collectDeaths();
    const lumoLit = !!this.lumo && this.doorLumo?.isPlayerStanding(this.lumo) === true;
    const umbraLit = !!this.umbra && this.doorUmbra?.isPlayerStanding(this.umbra) === true;
    this.doorLumo?.setLit(lumoLit);
    this.doorUmbra?.setLit(umbraLit);

    const outcome = resolveOutcome(deadPlayers.length > 0, lumoLit && umbraLit);
    if (outcome === 'death') {
      this.onDeath(deadPlayers);
    } else if (outcome === 'victory') {
      this.onVictory();
    }

    this.modeLabel?.setText(this.modeLabelText());
  }

  private collectDeaths(): Player[] {
    const dead: Player[] = [];
    if (this.lumo && this.touchesLethal(this.lumo, 'lumo')) {
      dead.push(this.lumo);
    }
    if (this.umbra && this.touchesLethal(this.umbra, 'umbra')) {
      dead.push(this.umbra);
    }
    return dead;
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

  private onDeath(deadPlayers: Player[]): void {
    this.status = 'dead';
    this.physics.pause();
    this.trails.forEach((trail) => trail.stop());
    for (const player of deadPlayers) {
      const color = player.texture.key === TEXTURE_KEYS.lumo ? COLORS.lumo : COLORS.umbraOutline;
      deathBurst(this, player.x, player.y, colorToNumber(color));
      player.vanish();
    }
    this.cameras.main.shake(150, 0.012);
    playSfx(this, SFX_KEYS.death);
    this.time.delayedCall(DEATH_PAUSE_MS, () => this.restartLevel(this.levelId));
  }

  private onVictory(): void {
    this.status = 'won';
    this.physics.pause();
    this.trails.forEach((trail) => trail.stop());
    playSfx(this, SFX_KEYS.victory);

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

    fadeOutThen(this, () =>
      this.scene.start('Result', {
        levelId: this.levelId,
        levelIndex: index,
        mode: this.controlState.mode,
        elapsedMs: this.elapsedMs,
        gemsCollected: this.collectedGems,
        totalGems: this.totalGems,
        score,
      }),
    );
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
