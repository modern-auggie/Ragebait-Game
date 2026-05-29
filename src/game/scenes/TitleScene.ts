import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { drawBackground } from '../systems/Effects';
import { AudioSystem } from '../systems/AudioSystem';
import { GameProgress } from '../systems/GameProgress';
import { LEVELS } from '../levels/levels';
import { GameSettings } from '../systems/GameSettings';

export class TitleScene extends Phaser.Scene {
  private settingsOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    drawBackground(this);

    const title = this.add
      .text(GAME_WIDTH / 2, 92, 'RAGEBAIT', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '58px',
        color: '#fee2e2',
        fontStyle: '900',
        align: 'center',
        stroke: '#450a0a',
        strokeThickness: 10,
      })
      .setOrigin(0.5);
    title.setResolution(2);

    const subtitle = this.add
      .text(GAME_WIDTH / 2, 150, 'Pick a level. Beat five rounds. Lower your deaths.', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '16px',
        color: '#fecaca',
        fontStyle: '800',
      })
      .setOrigin(0.5);
    subtitle.setResolution(2);

    this.createLevelButtons();
    this.createSettingsButton();

    this.tweens.add({
      targets: [title, subtitle],
      y: '+=8',
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    for (let i = 0; i < 9; i += 1) {
      const block = this.add.rectangle(
        Phaser.Math.Between(30, GAME_WIDTH - 30),
        GAME_HEIGHT + Phaser.Math.Between(0, 260),
        Phaser.Math.Between(18, 48),
        Phaser.Math.Between(8, 18),
        0xff243f,
        0.22,
      );
      block.setAngle(Phaser.Math.Between(-8, 8));
      this.tweens.add({
        targets: block,
        y: -40,
        duration: Phaser.Math.Between(6000, 10000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2800),
        ease: 'Linear',
      });
    }
  }

  private createSettingsButton(): void {
    const x = GAME_WIDTH - 70;
    const y = 18;
    const button = this.add.graphics();
    button.fillStyle(0x1f070b, 0.9);
    button.fillRoundedRect(x, y, 54, 42, 4);
    button.lineStyle(3, 0x050104, 0.95);
    button.strokeRoundedRect(x, y, 54, 42, 4);
    button.lineStyle(1, 0xffd7d7, 0.32);
    button.strokeRoundedRect(x + 6, y + 6, 42, 30, 2);
    button.setInteractive(new Phaser.Geom.Rectangle(x, y, 54, 42), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', () => {
      AudioSystem.sfx('ui');
      this.toggleSettings();
    });

    const icon = this.add.graphics();
    drawSettingsIcon(icon, x + 27, y + 21);
  }

  private toggleSettings(): void {
    if (this.settingsOverlay) {
      this.settingsOverlay.destroy(true);
      this.settingsOverlay = undefined;
      AudioSystem.sfx('ui');
      this.scene.restart();
      return;
    }
    this.settingsOverlay = this.createSettingsOverlay();
  }

  private createLevelButtons(): void {
    const progress = GameProgress.get();
    const devMode = GameSettings.get().devMode;
    const startX = 126;
    const y = 226;
    const gap = 166;
    for (let level = 1; level <= 5; level += 1) {
      const x = startX + (level - 1) * gap;
      const unlocked = devMode || GameProgress.isUnlocked(level);
      const best = progress.bestDeaths[String(level)];
      const resume = GameProgress.getResumeForLevel(level);
      const firstRound = (level - 1) * 5;
      const resumedRound = LEVELS[resume.levelIndex]?.name ?? `${level}.1`;
      const subLabel =
        devMode
          ? 'DEV OPEN'
          : unlocked && GameProgress.hasResumeForLevel(level) && resume.levelIndex > firstRound
          ? `ROUND ${resumedRound}`
          : unlocked
            ? best === undefined
              ? 'START'
              : `BEST ${best}`
            : 'LOCKED';
      const button = this.add.graphics();
      button.fillStyle(0x050104, 0.65);
      button.fillRoundedRect(x - 61, y + 6, 122, 112, 6);
      button.fillStyle(unlocked ? 0xdc2626 : 0x2a1217, 1);
      button.fillRoundedRect(x - 64, y, 122, 112, 6);
      button.lineStyle(4, 0x050104, 0.96);
      button.strokeRoundedRect(x - 64, y, 122, 112, 6);
      button.lineStyle(1, unlocked ? 0xffd7d7 : 0x7f1d1d, 0.45);
      button.strokeRoundedRect(x - 56, y + 8, 106, 96, 3);

      const label = this.add
        .text(x - 3, y + 32, `LEVEL ${level}`, {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '18px',
          color: unlocked ? '#fee2e2' : '#9f7c7c',
          stroke: '#450a0a',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      label.setResolution(2);

      const sub = this.add
        .text(x - 3, y + 72, subLabel, {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '13px',
          color: unlocked ? '#fecaca' : '#7f5d5d',
          align: 'center',
        })
        .setOrigin(0.5);
      sub.setResolution(2);

      if (!unlocked) {
        const lock = this.add.graphics();
        lock.fillStyle(0x9f7c7c, 0.72);
        lock.fillRoundedRect(x - 14, y + 78, 22, 18, 3);
        lock.lineStyle(3, 0x9f7c7c, 0.72);
        lock.strokeRoundedRect(x - 10, y + 65, 14, 18, 7);
      } else {
        button.setInteractive(new Phaser.Geom.Rectangle(x - 64, y, 122, 112), Phaser.Geom.Rectangle.Contains);
        button.on('pointerdown', () => {
          AudioSystem.sfx('ui');
          AudioSystem.startMusic();
          const latest = GameProgress.getResumeForLevel(level);
          this.scene.start('GameScene', { levelIndex: latest.levelIndex, deaths: latest.deaths, devRun: devMode });
        });
      }

      if (devMode) {
        this.createDevRoundButtons(level, x, y + 126);
      }
    }
  }

  private createDevRoundButtons(level: number, centerX: number, y: number): void {
    for (let round = 1; round <= 5; round += 1) {
      const roundY = y + (round - 1) * 27;
      const index = (level - 1) * 5 + (round - 1);
      const button = this.add.graphics();
      button.fillStyle(0x120307, 0.98);
      button.fillRoundedRect(centerX - 47, roundY, 92, 22, 3);
      button.lineStyle(2, 0xff243f, 0.75);
      button.strokeRoundedRect(centerX - 47, roundY, 92, 22, 3);
      button.setInteractive(new Phaser.Geom.Rectangle(centerX - 47, roundY, 92, 22), Phaser.Geom.Rectangle.Contains);
      button.on('pointerdown', () => {
        AudioSystem.sfx('ui');
        AudioSystem.startMusic();
        this.scene.start('GameScene', { levelIndex: index, deaths: 0, devRun: true });
      });

      const label = this.add
        .text(centerX - 1, roundY + 11, `${level}.${round}`, {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '12px',
          color: '#fee2e2',
          fontStyle: '900',
        })
        .setOrigin(0.5);
      label.setResolution(2);
    }
  }

  private createSettingsOverlay(): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(250);
    const panel = this.add.graphics();
    panel.fillStyle(0x050104, 0.78);
    panel.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    panel.fillStyle(0x21060b, 0.98);
    panel.fillRoundedRect(-250, -206, 500, 412, 6);
    panel.lineStyle(4, 0xff243f, 0.95);
    panel.strokeRoundedRect(-250, -206, 500, 412, 6);
    panel.lineStyle(1, 0xffd7d7, 0.35);
    panel.strokeRoundedRect(-238, -194, 476, 388, 3);
    container.add(panel);

    const title = this.add
      .text(0, -174, 'SETTINGS', {
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

    let devCode = '';
    let devFocused = false;
    let notice = '';
    let renderControls = (): void => undefined;

    const unlockDev = (): void => {
      if (devCode !== '9999') {
        notice = 'WRONG CODE';
        devCode = '';
        AudioSystem.sfx('trap');
        renderControls();
        return;
      }
      GameSettings.set({ devMode: true });
      devCode = '';
      devFocused = false;
      notice = 'DEV MODE UNLOCKED';
      AudioSystem.sfx('ui');
      renderControls();
    };

    const keyHandler = (event: KeyboardEvent): void => {
      if (!devFocused || GameSettings.get().devMode) return;
      if (/^\d$/.test(event.key)) {
        devCode = `${devCode}${event.key}`.slice(-4);
        notice = '';
        if (devCode === '9999') {
          unlockDev();
        } else {
          renderControls();
        }
        return;
      }
      if (event.key === 'Backspace') {
        devCode = devCode.slice(0, -1);
        renderControls();
        return;
      }
      if (event.key === 'Enter') {
        unlockDev();
      }
    };
    this.input.keyboard?.on('keydown', keyHandler);
    container.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.input.keyboard?.off('keydown', keyHandler);
    });

    this.addCloseButton(container, 198, -182, () => this.toggleSettings());

    renderControls = (): void => {
      clearDynamic();
      const settings = GameSettings.get();

      const controlLabel = this.add
        .text(-200, -124, 'CONTROL', {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '14px',
          color: '#fecaca',
          fontStyle: '900',
        })
        .setOrigin(0, 0.5);
      controlLabel.setResolution(2);
      addDynamic(controlLabel);

      this.addModeButton(container, addDynamic, -76, -144, 108, 'BUTTONS', settings.controlMode === 'buttons', () => {
        GameSettings.set({ controlMode: 'buttons' });
        AudioSystem.sfx('ui');
        renderControls();
      });
      this.addModeButton(container, addDynamic, 40, -144, 108, 'JOYSTICK', settings.controlMode === 'joystick', () => {
        GameSettings.set({ controlMode: 'joystick' });
        AudioSystem.sfx('ui');
        renderControls();
      });

      this.addVolumeSlider(container, addDynamic, -200, -84, 400, 'MUSIC', settings.musicVolume, (value) => {
        GameSettings.set({ musicVolume: value });
        AudioSystem.applySettings();
      });
      this.addVolumeSlider(container, addDynamic, -200, -14, 400, 'SOUND FX', settings.sfxVolume, (value) => {
        GameSettings.set({ sfxVolume: value });
        AudioSystem.applySettings();
      });

      const devLabel = this.add
        .text(-200, 66, 'DEV MODE', {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '14px',
          color: '#fecaca',
          fontStyle: '900',
        })
        .setOrigin(0, 0.5);
      devLabel.setResolution(2);
      addDynamic(devLabel);

      const field = this.add.graphics();
      field.fillStyle(devFocused ? 0x2b0b11 : 0x120307, 1);
      field.fillRoundedRect(-200, 84, 180, 38, 4);
      field.lineStyle(3, devFocused ? 0xffd36d : 0x7f1d1d, 0.95);
      field.strokeRoundedRect(-200, 84, 180, 38, 4);
      field.setInteractive(new Phaser.Geom.Rectangle(-200, 84, 180, 38), Phaser.Geom.Rectangle.Contains);
      field.on('pointerdown', () => {
        devFocused = true;
        notice = '';
        AudioSystem.sfx('ui');
        renderControls();
      });
      const fieldText = this.add
        .text(-110, 103, settings.devMode ? 'DEV MODE ON' : devCode.padEnd(4, '_'), {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '14px',
          color: settings.devMode ? '#ffd36d' : '#fee2e2',
          fontStyle: '900',
        })
        .setOrigin(0.5);
      fieldText.setResolution(2);
      addDynamic(field, fieldText);

      if (!settings.devMode) {
        this.addActionButton(container, addDynamic, -8, 84, 108, 'UNLOCK', () => unlockDev());
      } else {
        this.addActionButton(container, addDynamic, -8, 84, 120, 'TURN OFF', () => {
          GameSettings.set({ devMode: false });
          devCode = '';
          devFocused = false;
          notice = 'DEV MODE OFF';
          AudioSystem.sfx('ui');
          renderControls();
        });
      }

      this.addActionButton(container, addDynamic, -200, 148, 180, 'HARD RESET', () => this.showHardResetConfirm(), false, true);

      const noticeText = this.add
        .text(-8, 146, notice, {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '11px',
          color: notice === 'WRONG CODE' ? '#ff6b6b' : '#ffd36d',
          fontStyle: '900',
          wordWrap: { width: 190 },
        })
        .setOrigin(0, 0);
      noticeText.setResolution(2);
      addDynamic(noticeText);
    };

    renderControls();
    return container;
  }

  private showHardResetConfirm(): void {
    const overlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(520);
    const shade = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050104, 0.62)
      .setOrigin(0.5)
      .setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x21060b, 0.98);
    panel.fillRoundedRect(-190, -96, 380, 192, 6);
    panel.lineStyle(4, 0xff243f, 0.95);
    panel.strokeRoundedRect(-190, -96, 380, 192, 6);
    panel.lineStyle(1, 0xffd7d7, 0.35);
    panel.strokeRoundedRect(-178, -84, 356, 168, 3);

    const title = this.add
      .text(0, -48, 'RESET EVERYTHING?', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '22px',
        color: '#fee2e2',
        stroke: '#450a0a',
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    title.setResolution(2);

    const body = this.add
      .text(0, -8, 'This erases unlocked levels, best deaths, and dev mode.', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '12px',
        color: '#fecaca',
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);
    body.setResolution(2);
    overlay.add([shade, panel, title, body]);

    const addPopupButton = (x: number, label: string, danger: boolean, onClick: () => void): void => {
      const button = this.add.graphics();
      button.fillStyle(danger ? 0x7f1d1d : 0x120307, 1);
      button.fillRoundedRect(x - 72, 38, 144, 38, 4);
      button.lineStyle(3, 0x050104, 0.95);
      button.strokeRoundedRect(x - 72, 38, 144, 38, 4);
      button.lineStyle(1, danger ? 0xffd36d : 0xff243f, 0.65);
      button.strokeRoundedRect(x - 64, 45, 128, 24, 2);
      button.setInteractive(new Phaser.Geom.Rectangle(x - 72, 38, 144, 38), Phaser.Geom.Rectangle.Contains);
      button.on('pointerdown', onClick);
      const text = this.add
        .text(x, 57, label, {
          fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
          fontSize: '12px',
          color: danger ? '#ffd36d' : '#fee2e2',
          fontStyle: '900',
        })
        .setOrigin(0.5);
      text.setResolution(2);
      overlay.add([button, text]);
    };

    addPopupButton(-84, 'CANCEL', false, () => {
      AudioSystem.sfx('ui');
      overlay.destroy(true);
    });
    addPopupButton(84, 'CONFIRM', true, () => {
      GameProgress.resetAll();
      GameSettings.set({ devMode: false });
      AudioSystem.sfx('ui');
      this.scene.restart();
    });
    AudioSystem.sfx('trap');
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

  private addActionButton(
    container: Phaser.GameObjects.Container,
    addDynamic: (...items: Phaser.GameObjects.GameObject[]) => void,
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
    active = false,
    danger = false,
  ): void {
    const button = this.add.graphics();
    button.fillStyle(active ? 0xdc2626 : danger ? 0x450a0a : 0x120307, 1);
    button.fillRoundedRect(x, y, width, 34, 4);
    button.lineStyle(3, 0x050104, 0.95);
    button.strokeRoundedRect(x, y, width, 34, 4);
    button.lineStyle(1, danger ? 0xffd36d : 0xff243f, 0.58);
    button.strokeRoundedRect(x + 5, y + 5, width - 10, 24, 2);
    button.setInteractive(new Phaser.Geom.Rectangle(x, y, width, 34), Phaser.Geom.Rectangle.Contains);
    button.on('pointerdown', onClick);

    const text = this.add
      .text(x + width / 2, y + 17, label, {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: label.length > 9 ? '10px' : '12px',
        color: danger ? '#ffd36d' : '#fee2e2',
        fontStyle: '900',
        align: 'center',
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

function drawSettingsIcon(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  graphics.clear();
  graphics.lineStyle(3, 0xfee2e2, 1);
  graphics.fillStyle(0xfee2e2, 1);
  const rows = [
    { y: cy - 9, knob: cx - 6 },
    { y: cy, knob: cx + 7 },
    { y: cy + 9, knob: cx - 1 },
  ];
  rows.forEach((row) => {
    graphics.lineBetween(cx - 14, row.y, cx + 14, row.y);
    graphics.fillCircle(row.knob, row.y, 4);
    graphics.lineStyle(2, 0x1f070b, 1);
    graphics.strokeCircle(row.knob, row.y, 4);
    graphics.lineStyle(3, 0xfee2e2, 1);
  });
}
