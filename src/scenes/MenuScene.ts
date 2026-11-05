import Phaser from 'phaser';
import { COLORS } from '../config/colors';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/game';
import { KEYS } from '../enums/keys';
import { getPhrase } from '../services/translations';
import { TEXTURE_KEYS } from '../config/textures';
import { fadeIn } from '../fx/transitions';
import { currentLanguage, LANGUAGES, loadLanguage } from '../services/language';
import { createButton, textStyle, type UiButton } from './ui';

export class MenuScene extends Phaser.Scene {
  private title?: Phaser.GameObjects.Text;
  private onePlayer?: UiButton;
  private twoPlayers?: UiButton;
  private languageButtons: UiButton[] = [];
  private changingLanguage = false;

  constructor() {
    super('Menu');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.add.image(0, 0, TEXTURE_KEYS.background).setOrigin(0, 0);

    this.title = this.add
      .text(cx, GAME_HEIGHT * 0.22, getPhrase(KEYS.LUMO_Y_UMBRA), {
        fontFamily: 'monospace',
        fontSize: '56px',
        fontStyle: 'bold',
        color: COLORS.lumo,
      })
      .setOrigin(0.5);

    this.onePlayer = createButton(this, cx, GAME_HEIGHT * 0.48, getPhrase(KEYS.UN_JUGADOR), () =>
      this.scene.start('LevelSelect', { mode: 'one-player' }),
    );
    this.twoPlayers = createButton(this, cx, GAME_HEIGHT * 0.48 + 60, getPhrase(KEYS.DOS_JUGADORES), () =>
      this.scene.start('LevelSelect', { mode: 'two-player' }),
    );

    this.createLanguageSelector();

    this.createLegend(GAME_HEIGHT * 0.8);

    fadeIn(this);
  }

  /** Selector de idioma (códigos de `enums/languages.js`, no se traducen). */
  private createLanguageSelector(): void {
    this.languageButtons = LANGUAGES.map((lang, index) =>
      createButton(
        this,
        GAME_WIDTH - 40 - (LANGUAGES.length - 1 - index) * 64,
        30,
        lang.toUpperCase(),
        () => void this.changeLanguage(lang),
        { width: 56, height: 32, fontSize: 16 },
      ),
    );
    this.paintLanguageButtons();
  }

  private paintLanguageButtons(): void {
    LANGUAGES.forEach((lang, index) => this.languageButtons[index]?.setEnabled(lang !== currentLanguage()));
  }

  /** Carga el idioma, espera la respuesta y actualiza los textos ya creados. */
  private async changeLanguage(lang: string): Promise<void> {
    if (this.changingLanguage || lang === currentLanguage()) {
      return;
    }
    this.changingLanguage = true;
    await loadLanguage(lang);
    this.changingLanguage = false;
    if (!this.scene.isActive()) {
      return;
    }
    this.title?.setText(getPhrase(KEYS.LUMO_Y_UMBRA));
    this.onePlayer?.label.setText(getPhrase(KEYS.UN_JUGADOR));
    this.twoPlayers?.label.setText(getPhrase(KEYS.DOS_JUGADORES));
    this.paintLanguageButtons();
  }

  /**
   * Leyenda sin palabras: cada espíritu con su emblema (sol / luna) y sus
   * teclas. Las letras de las teclas no se traducen.
   */
  private createLegend(y: number): void {
    const rows: ReadonlyArray<{ x: number; sprite: string; badge: string; keys: string; color: string }> = [
      { x: GAME_WIDTH * 0.3, sprite: TEXTURE_KEYS.lumo, badge: TEXTURE_KEYS.sunBadge, keys: 'A  D  W', color: COLORS.lumo },
      { x: GAME_WIDTH * 0.7, sprite: TEXTURE_KEYS.umbra, badge: TEXTURE_KEYS.moonBadge, keys: '←  →  ↑', color: COLORS.umbraOutline },
    ];
    const panel = this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH - 200, 80, 0x120e20, 0.55);
    panel.setStrokeStyle(1, 0x4a4066);
    for (const row of rows) {
      this.add.image(row.x - 90, y, row.sprite).setScale(1.6);
      this.add.image(row.x - 45, y, row.badge).setScale(1.3);
      this.add.text(row.x - 15, y, row.keys, textStyle(row.color, 24)).setOrigin(0, 0.5);
    }
  }
}
