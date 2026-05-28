import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { Player } from '../entities/Player';
import type { Platform } from '../entities/Platform';
import { LEVELS } from '../levels/levels';
import type { LevelDefinition } from '../levels/levelTypes';
import { addBurst, addFloatingText, COLORS, drawBackground } from '../systems/Effects';
import { Hud } from '../systems/Hud';
import { InputController } from '../systems/InputController';
import { LevelBehaviors } from '../systems/LevelBehaviors';
import { destroyLoadedLevel, loadLevel, type LoadedLevel } from '../systems/LevelLoader';
import { AudioSystem } from '../systems/AudioSystem';
import { GameSettings, type GameSettingsState } from '../systems/GameSettings';
import { GameProgress } from '../systems/GameProgress';

export class GameScene extends Phaser.Scene {
  private inputController?: InputController;
  private hud?: Hud;
  private player?: Player;
  private loaded?: LoadedLevel;
  private behaviors?: LevelBehaviors;
  private levelIndex = 0;
  private deaths = 0;
  private currentLevelGroup = 1;
  private currentLevel?: LevelDefinition;
  private dead = false;
  private completing = false;
  private background?: Phaser.GameObjects.Graphics;
  private settingsOverlay?: Phaser.GameObjects.Container;
  private transitioning = false;

  constructor() {
    super('GameScene');
  }

  create(data: { levelIndex?: number; deaths?: number }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.deaths = data.deaths ?? 0;
    this.currentLevelGroup = Math.floor(this.levelIndex / 5) + 1;
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.roundPixels = true;
    this.background = drawBackground(this);
    this.inputController = new InputController(this);
    this.hud = new Hud(this, {
      onRestart: () => this.restartLevel(false),
      onHome: () => this.goHome(),
      onSettings: () => this.toggleSettings(),
    });
    AudioSystem.startMusic();
    this.startLevel(this.levelIndex);
  }

  update(time: number): void {
    if (!this.player || !this.inputController || !this.currentLevel) return;
    const input = this.inputController.update();
    if (this.settingsOverlay || this.transitioning) return;
    if (input.restartPressed) {
      this.restartLevel(false);
      return;
    }

    const jumped = this.player.update(time, input);
    if (jumped) {
      this.behaviors?.onPlayerJumped();
      addBurst(this, this.player.sprite.x, this.player.sprite.y + 18, COLORS.player, 4);
      AudioSystem.sfx('jump');
    }

    this.loaded?.doors.forEach((door) => door.update(time));
    this.behaviors?.update();

    if (this.player.sprite.y > GAME_HEIGHT + 18 && !this.dead) {
      this.killPlayer('Gravity remains undefeated.');
    }
  }

  playerX(): number {
    return this.player?.sprite.x ?? 0;
  }

  playerY(): number {
    return this.player?.sprite.y ?? 0;
  }

  killPlayer(message?: string): void {
    if (!this.player || this.dead || this.completing) return;
    this.dead = true;
    this.deaths += 1;
    this.hud?.setDeaths(this.deaths);
    const x = this.player.sprite.x;
    const y = this.player.sprite.y;
    this.player.kill();
    addBurst(this, x, y, COLORS.spike, 18);
    addFloatingText(this, 'NOPE', 172, 360);
    AudioSystem.sfx('death');
    this.cameras.main.flash(110, 220, 38, 38, false);
    this.shake(0.018, 230);
    this.hud?.showMessage(message ?? this.randomDeathMessage(), 1000);
    this.time.delayedCall(460, () => this.restartLevel(true));
  }

  completeLevel(): void {
    if (this.completing || this.dead) return;
    this.completing = true;
    if (this.player) {
      addBurst(this, this.player.sprite.x, this.player.sprite.y, COLORS.doorOpen, 32);
    }
    addFloatingText(this, 'CLEARED', 172, 420);
    AudioSystem.sfx('door');
    this.cameras.main.flash(190, 255, 211, 109, false);
    this.time.delayedCall(440, () => {
      if (this.levelIndex >= LEVELS.length - 1) {
        GameProgress.recordLevelComplete(this.currentLevelGroup, this.deaths);
        this.scene.start('EndScene', { deaths: this.deaths });
      } else {
        const nextIndex = this.levelIndex + 1;
        const nextLevelGroup = Math.floor(nextIndex / 5) + 1;
        if (nextLevelGroup !== this.currentLevelGroup) {
          GameProgress.recordLevelComplete(this.currentLevelGroup, this.deaths);
          this.deaths = 0;
          this.currentLevelGroup = nextLevelGroup;
        }
        this.showRoundTransition(nextIndex, () => this.startLevel(nextIndex));
      }
    });
  }

  showMessage(message: string, duration?: number): void {
    this.hud?.showMessage(message, duration);
  }

  shake(intensity = 0.006, duration = 120): void {
    this.cameras.main.shake(duration, intensity);
  }

  private startLevel(index: number): void {
    this.clearLevel();
    this.levelIndex = Phaser.Math.Clamp(index, 0, LEVELS.length - 1);
    this.currentLevel = LEVELS[this.levelIndex];
    this.currentLevelGroup = Math.floor(this.levelIndex / 5) + 1;
    this.dead = false;
    this.completing = false;
    this.transitioning = false;
    this.background?.destroy();
    this.background = drawBackground(this);
    this.loaded = loadLevel(this, this.currentLevel);
    this.player = new Player(this, this.currentLevel.spawn.x, this.currentLevel.spawn.y);
    this.behaviors = new LevelBehaviors(this, this, this.currentLevel, this.loaded);
    this.hud?.setLevel(this.currentLevel.name);
    this.hud?.setDeaths(this.deaths);
    this.addPhysics();
    this.cameras.main.fadeIn(130, 7, 10, 20);
  }

  private restartLevel(fromDeath: boolean): void {
    if (!fromDeath) {
      this.hud?.showMessage('Fine. Fresh start.', 700);
      AudioSystem.sfx('ui');
    }
    this.startLevel(this.levelIndex);
  }

  private goHome(): void {
    AudioSystem.sfx('ui');
    this.scene.start('TitleScene');
  }

  private clearLevel(): void {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.settingsOverlay?.destroy(true);
    this.settingsOverlay = undefined;
    this.player?.destroy();
    destroyLoadedLevel(this.loaded);
    this.player = undefined;
    this.loaded = undefined;
    this.behaviors = undefined;
  }

  private addPhysics(): void {
    if (!this.player || !this.loaded || !this.behaviors) return;
    const sprite = this.player.sprite;

    this.loaded.platforms.forEach((platform) => {
      this.physics.add.collider(sprite, platform.zone, () => this.handlePlatformCollision(platform));
    });

    this.loaded.spikes.forEach((spike) => {
      this.physics.add.overlap(sprite, spike.zone, () => this.killPlayer(), undefined, this);
    });

    this.loaded.doors.forEach((door) => {
      this.physics.add.overlap(sprite, door.zone, () => this.behaviors?.onDoorTouched(door), undefined, this);
    });

    this.loaded.buttons.forEach((button) => {
      this.physics.add.overlap(sprite, button.zone, () => this.behaviors?.onButtonPressed(button), undefined, this);
    });
  }

  private handlePlatformCollision(platform: Platform): void {
    if (!this.player) return;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) {
      this.behaviors?.onPlatformTouched(platform);
    }
  }

  private randomDeathMessage(): string {
    const messages = this.currentLevel?.deathMessages ?? ['That was educational.'];
    return Phaser.Utils.Array.GetRandom(messages);
  }

  private showRoundTransition(nextIndex: number, onDone: () => void): void {
    this.transitioning = true;
    const next = LEVELS[nextIndex];
    const world = next.name.split('.')[0] ?? '1';
    const isNewWorld = /^\d+\.1:/.test(next.name);
    const title = isNewWorld ? `LEVEL ${world}` : next.name;
    const subtitle = isNewWorld ? 'new set of bad ideas' : 'next round';

    const overlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(300);
    const panel = this.add.graphics();
    panel.fillStyle(0x050104, 0.78);
    panel.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    panel.fillStyle(0x21060b, 0.96);
    panel.fillRoundedRect(-170, -58, 340, 116, 8);
    panel.lineStyle(4, 0xff243f, 0.95);
    panel.strokeRoundedRect(-170, -58, 340, 116, 8);
    const titleText = this.add
      .text(0, -18, title, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '34px',
        color: '#fee2e2',
        stroke: '#450a0a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    titleText.setResolution(2);
    const subText = this.add
      .text(0, 26, subtitle, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '14px',
        color: '#fecaca',
      })
      .setOrigin(0.5);
    subText.setResolution(2);
    overlay.add([panel, titleText, subText]);
    overlay.setScale(0.78);
    overlay.setAlpha(0);
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 170,
      ease: 'Back.Out',
      yoyo: true,
      hold: 520,
      onComplete: () => {
        overlay.destroy(true);
        onDone();
      },
    });
  }

  private toggleSettings(): void {
    if (this.settingsOverlay) {
      this.settingsOverlay.destroy(true);
      this.settingsOverlay = undefined;
      AudioSystem.sfx('ui');
      return;
    }
    this.settingsOverlay = this.createSettingsOverlay();
    AudioSystem.sfx('ui');
  }

  private createSettingsOverlay(): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(250);
    const panel = this.add.graphics();
    panel.fillStyle(0x050104, 0.74);
    panel.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    panel.fillStyle(0x21060b, 0.98);
    panel.fillRoundedRect(-220, -138, 440, 276, 8);
    panel.lineStyle(4, 0xff243f, 0.95);
    panel.strokeRoundedRect(-220, -138, 440, 276, 8);
    container.add(panel);

    const title = this.add
      .text(0, -106, 'SETTINGS', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '28px',
        color: '#fee2e2',
        stroke: '#450a0a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    title.setResolution(2);
    container.add(title);

    const render = (): void => {
      const settings = GameSettings.get();
      container.removeBetween(2, container.length, true);
      this.addSettingButton(container, -128, -50, `CONTROL: ${settings.controlMode.toUpperCase()}`, () => {
        const next = settings.controlMode === 'buttons' ? 'joystick' : 'buttons';
        GameSettings.set({ controlMode: next });
        this.inputController?.setControlMode(next);
        AudioSystem.sfx('ui');
        render();
      });
      this.addSettingButton(container, -128, 10, `MUSIC: ${settings.musicEnabled ? 'ON' : 'OFF'}`, () => {
        const next = !GameSettings.get().musicEnabled;
        GameSettings.set({ musicEnabled: next });
        AudioSystem.applySettings();
        AudioSystem.sfx('ui');
        render();
      });
      this.addSettingButton(container, -128, 70, `SFX: ${settings.sfxEnabled ? 'ON' : 'OFF'}`, () => {
        const next = !GameSettings.get().sfxEnabled;
        GameSettings.set({ sfxEnabled: next });
        AudioSystem.sfx('ui');
        render();
      });
      this.addSettingButton(container, 52, 70, 'CLOSE', () => this.toggleSettings(), 116);
    };
    render();
    return container;
  }

  private addSettingButton(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    width = 256,
  ): void {
    const button = this.add.graphics();
    button.fillStyle(0xdc2626, 1);
    button.fillRoundedRect(x, y, width, 40, 5);
    button.lineStyle(3, 0x050104, 0.95);
    button.strokeRoundedRect(x, y, width, 40, 5);
    button.lineStyle(1, 0xffd7d7, 0.4);
    button.strokeRoundedRect(x + 5, y + 5, width - 10, 30, 2);
    button.setInteractive(new Phaser.Geom.Rectangle(x, y, width, 40), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', onClick);
    const text = this.add
      .text(x + width / 2, y + 20, label, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '14px',
        color: '#fee2e2',
        stroke: '#450a0a',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    text.setResolution(2);
    container.add([button, text]);
  }
}
