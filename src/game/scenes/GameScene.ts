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
import { GameSettings } from '../systems/GameSettings';
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
    GameProgress.setResume(this.currentLevelGroup, this.levelIndex, this.deaths);
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
    AudioSystem.sfx('door');
    this.cameras.main.flash(190, 255, 211, 109, false);
    this.time.delayedCall(180, () => {
      if (this.levelIndex >= LEVELS.length - 1) {
        GameProgress.recordLevelComplete(this.currentLevelGroup, this.deaths);
        this.showRoundTransition(undefined, () => this.scene.start('EndScene', { deaths: this.deaths }));
      } else {
        const nextIndex = this.levelIndex + 1;
        const nextLevelGroup = Math.floor(nextIndex / 5) + 1;
        if (nextLevelGroup !== this.currentLevelGroup) {
          GameProgress.recordLevelComplete(this.currentLevelGroup, this.deaths);
          this.deaths = 0;
          this.currentLevelGroup = nextLevelGroup;
        }
        this.showRoundTransition(nextIndex, () => {
          this.startLevel(nextIndex);
          this.showLevelReveal(nextIndex);
        });
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
    GameProgress.setResume(this.currentLevelGroup, this.levelIndex, this.deaths);
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

  private showRoundTransition(nextIndex: number | undefined, onDone: () => void): void {
    this.transitioning = true;
    const next = nextIndex === undefined ? undefined : LEVELS[nextIndex];
    const label = next ? `LEVEL ${next.name}` : 'DEMO COMPLETE';
    const overlay = this.add.container(0, 0).setDepth(300);
    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050104, 0.35).setOrigin(0);
    const top = this.add.rectangle(GAME_WIDTH / 2, -GAME_HEIGHT / 4, GAME_WIDTH + 34, GAME_HEIGHT / 2 + 10, 0x21060b, 1);
    const bottom = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + GAME_HEIGHT / 4, GAME_WIDTH + 34, GAME_HEIGHT / 2 + 10, 0x120307, 1);
    top.setStrokeStyle(5, 0xff243f, 0.9);
    bottom.setStrokeStyle(5, 0xff243f, 0.9);
    const slashA = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12, GAME_WIDTH + 80, 10, 0xff243f, 0.92);
    const slashB = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 12, GAME_WIDTH + 80, 6, 0xffd36d, 0.55);
    slashA.setAngle(-3).setAlpha(0);
    slashB.setAngle(3).setAlpha(0);
    const titleText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, label, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '32px',
        color: '#fee2e2',
        stroke: '#450a0a',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    titleText.setResolution(2);
    overlay.add([dim, top, bottom, slashA, slashB, titleText]);
    this.tweens.add({
      targets: top,
      y: GAME_HEIGHT / 4,
      duration: 210,
      ease: 'Cubic.In',
    });
    this.tweens.add({
      targets: bottom,
      y: GAME_HEIGHT - GAME_HEIGHT / 4,
      duration: 210,
      ease: 'Cubic.In',
    });
    this.tweens.add({
      targets: [slashA, slashB, titleText],
      alpha: 1,
      duration: 120,
      delay: 190,
      ease: 'Sine.Out',
      hold: 250,
      onComplete: () => {
        overlay.destroy(true);
        onDone();
      },
    });
  }

  private showLevelReveal(nextIndex: number): void {
    this.transitioning = true;
    const next = LEVELS[nextIndex];
    const overlay = this.add.container(0, 0).setDepth(320);
    const top = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 4, GAME_WIDTH + 34, GAME_HEIGHT / 2 + 10, 0x21060b, 1);
    const bottom = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - GAME_HEIGHT / 4, GAME_WIDTH + 34, GAME_HEIGHT / 2 + 10, 0x120307, 1);
    top.setStrokeStyle(5, 0xff243f, 0.86);
    bottom.setStrokeStyle(5, 0xff243f, 0.86);
    const titleText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `LEVEL ${next.name}`, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '32px',
        color: '#fee2e2',
        stroke: '#450a0a',
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    titleText.setResolution(2);
    overlay.add([top, bottom, titleText]);
    this.tweens.add({
      targets: top,
      y: -GAME_HEIGHT / 4,
      delay: 170,
      duration: 260,
      ease: 'Cubic.Out',
    });
    this.tweens.add({
      targets: bottom,
      y: GAME_HEIGHT + GAME_HEIGHT / 4,
      delay: 170,
      duration: 260,
      ease: 'Cubic.Out',
    });
    this.tweens.add({
      targets: titleText,
      alpha: 0,
      scaleX: 1.12,
      scaleY: 1.12,
      delay: 110,
      duration: 220,
      ease: 'Sine.In',
      onComplete: () => {
        overlay.destroy(true);
        this.transitioning = false;
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
    panel.fillStyle(0x050104, 0.78);
    panel.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    panel.fillStyle(0x21060b, 0.98);
    panel.fillRoundedRect(-230, -146, 460, 292, 6);
    panel.lineStyle(4, 0xff243f, 0.95);
    panel.strokeRoundedRect(-230, -146, 460, 292, 6);
    panel.lineStyle(1, 0xffd7d7, 0.35);
    panel.strokeRoundedRect(-220, -136, 440, 272, 3);
    container.add(panel);

    const title = this.add
      .text(0, -112, 'SETTINGS', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '28px',
        color: '#fee2e2',
        stroke: '#450a0a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    title.setResolution(2);
    container.add(title);

    const dynamicItems: Phaser.GameObjects.GameObject[] = [];
    const addDynamic = (...items: Phaser.GameObjects.GameObject[]): void => {
      dynamicItems.push(...items);
      container.add(items);
    };
    const clearDynamic = (): void => {
      while (dynamicItems.length > 0) {
        dynamicItems.pop()?.destroy();
      }
    };

    this.addCloseButton(container, 184, -124, () => this.toggleSettings());

    const renderControls = (): void => {
      clearDynamic();
      const settings = GameSettings.get();
      const label = this.add
        .text(-168, -72, 'CONTROL', {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '14px',
          color: '#fecaca',
          fontStyle: '900',
        })
        .setOrigin(0, 0.5);
      label.setResolution(2);
      addDynamic(label);

      this.addModeButton(container, addDynamic, -42, -92, 108, 'BUTTONS', settings.controlMode === 'buttons', () => {
        GameSettings.set({ controlMode: 'buttons' });
        this.inputController?.setControlMode('buttons');
        AudioSystem.sfx('ui');
        renderControls();
      });
      this.addModeButton(container, addDynamic, 74, -92, 108, 'JOYSTICK', settings.controlMode === 'joystick', () => {
        GameSettings.set({ controlMode: 'joystick' });
        this.inputController?.setControlMode('joystick');
        AudioSystem.sfx('ui');
        renderControls();
      });

      this.addVolumeSlider(container, addDynamic, -168, -24, 336, 'MUSIC', settings.musicVolume, (value) => {
        GameSettings.set({ musicVolume: value });
        AudioSystem.applySettings();
      });
      this.addVolumeSlider(container, addDynamic, -168, 58, 336, 'SOUND FX', settings.sfxVolume, (value) => {
        GameSettings.set({ sfxVolume: value });
        AudioSystem.applySettings();
      });
    };
    renderControls();
    return container;
  }

  private addCloseButton(container: Phaser.GameObjects.Container, x: number, y: number, onClick: () => void): void {
    const button = this.add.graphics();
    button.fillStyle(0x050104, 0.88);
    button.fillRoundedRect(x, y, 38, 34, 4);
    button.lineStyle(3, 0xff243f, 0.95);
    button.strokeRoundedRect(x, y, 38, 34, 4);
    button.lineStyle(1, 0xffd7d7, 0.35);
    button.strokeRoundedRect(x + 6, y + 6, 26, 22, 2);
    button.setInteractive(new Phaser.Geom.Rectangle(x, y, 38, 34), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', onClick);
    const text = this.add
      .text(x + 19, y + 16, 'X', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '17px',
        color: '#fee2e2',
        fontStyle: '900',
      })
      .setOrigin(0.5);
    text.setResolution(2);
    container.add([button, text]);
  }

  private addModeButton(
    container: Phaser.GameObjects.Container,
    addDynamic: (...items: Phaser.GameObjects.GameObject[]) => void,
    x: number,
    y: number,
    width: number,
    label: string,
    active: boolean,
    onClick: () => void,
  ): void {
    const button = this.add.graphics();
    button.fillStyle(active ? 0xdc2626 : 0x120307, 1);
    button.fillRoundedRect(x, y, width, 38, 4);
    button.lineStyle(3, 0x050104, 0.95);
    button.strokeRoundedRect(x, y, width, 38, 4);
    button.lineStyle(1, active ? 0xffd7d7 : 0x7f1d1d, active ? 0.5 : 0.36);
    button.strokeRoundedRect(x + 5, y + 5, width - 10, 28, 2);
    button.setInteractive(new Phaser.Geom.Rectangle(x, y, width, 38), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', onClick);
    const text = this.add
      .text(x + width / 2, y + 19, label, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '12px',
        color: active ? '#fee2e2' : '#fecaca',
        stroke: '#450a0a',
        strokeThickness: active ? 3 : 0,
      })
      .setOrigin(0.5);
    text.setResolution(2);
    addDynamic(button, text);
  }

  private addVolumeSlider(
    container: Phaser.GameObjects.Container,
    addDynamic: (...items: Phaser.GameObjects.GameObject[]) => void,
    x: number,
    y: number,
    width: number,
    label: string,
    initialValue: number,
    onChange: (value: number) => void,
  ): void {
    let value = initialValue;
    const labelText = this.add
      .text(x, y, label, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '14px',
        color: '#fecaca',
        fontStyle: '900',
      })
      .setOrigin(0, 0.5);
    const valueText = this.add
      .text(x + width, y, `${value}%`, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '14px',
        color: '#fee2e2',
        fontStyle: '900',
      })
      .setOrigin(1, 0.5);
    labelText.setResolution(2);
    valueText.setResolution(2);

    const track = this.add.graphics();
    const fill = this.add.graphics();
    const knob = this.add.graphics();
    const hit = this.add.zone(x + width / 2, y + 32, width, 44).setOrigin(0.5);
    hit.setInteractive({ useHandCursor: true });

    const draw = (): void => {
      const pct = value / 100;
      track.clear();
      fill.clear();
      knob.clear();
      track.fillStyle(0x050104, 0.88);
      track.fillRoundedRect(x, y + 25, width, 12, 3);
      track.lineStyle(2, 0x7f1d1d, 0.9);
      track.strokeRoundedRect(x, y + 25, width, 12, 3);
      if (value > 0) {
        fill.fillStyle(0xff243f, 1);
        fill.fillRoundedRect(x, y + 25, Math.max(4, width * pct), 12, 3);
        fill.fillStyle(0xffd36d, 0.26);
        fill.fillRect(x + 3, y + 28, Math.max(0, width * pct - 6), 3);
      }
      knob.fillStyle(0xfee2e2, 1);
      knob.fillRoundedRect(x + width * pct - 9, y + 18, 18, 26, 3);
      knob.lineStyle(3, 0x050104, 0.95);
      knob.strokeRoundedRect(x + width * pct - 9, y + 18, 18, 26, 3);
      valueText.setText(`${value}%`);
    };

    const updateFromPointer = (pointer: Phaser.Input.Pointer): void => {
      const localX = pointer.x - container.x;
      value = Math.round(Phaser.Math.Clamp((localX - x) / width, 0, 1) * 100);
      draw();
      onChange(value);
    };

    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
      AudioSystem.sfx('ui');
      updateFromPointer(pointer);
    });
    hit.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      updateFromPointer(pointer);
    });

    draw();
    addDynamic(labelText, valueText, track, fill, knob, hit);
  }
}
