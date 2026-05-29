import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

export class Hud {
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly deathText: Phaser.GameObjects.Text;
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly items: Phaser.GameObjects.GameObject[] = [];
  private messageClearEvent?: Phaser.Time.TimerEvent;

  constructor(
    private scene: Phaser.Scene,
    actions: { onRestart: () => void; onHome: () => void; onSettings: () => void },
    options: { showDeaths?: boolean } = {},
  ) {
    const showDeaths = options.showDeaths ?? true;
    this.levelText = scene.add
      .text(20, 18, 'Level 1', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '18px',
        color: '#fee2e2',
        fontStyle: '900',
        stroke: '#450a0a',
        strokeThickness: 4,
      })
      .setDepth(100)
      .setScrollFactor(0);
    this.levelText.setResolution(2);

    this.deathText = scene.add
      .text(20, 44, 'Deaths 0', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '15px',
        color: '#fecaca',
        fontStyle: '800',
      })
      .setDepth(100)
      .setScrollFactor(0)
      .setVisible(showDeaths);
    this.deathText.setResolution(2);

    this.createHudButton(GAME_WIDTH - 196, 16, 54, 42, 'home', actions.onHome);
    this.createHudButton(GAME_WIDTH - 130, 16, 54, 42, 'settings', actions.onSettings);
    this.createHudButton(GAME_WIDTH - 64, 16, 54, 42, 'restart', actions.onRestart);

    this.messageText = scene.add
      .text(GAME_WIDTH / 2, 74, '', {
        fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
        fontSize: '15px',
        color: '#ffb4b4',
        fontStyle: '900',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 48 },
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setScrollFactor(0)
      .setAlpha(0);
    this.messageText.setResolution(2);
    this.items.push(this.levelText, this.deathText, this.messageText);
  }

  setLevel(levelName: string): void {
    this.levelText.setText(`Level ${levelName}`);
  }

  setDeaths(deaths: number): void {
    this.deathText.setText(`Deaths ${deaths}`);
  }

  showMessage(message: string, duration = 1300): void {
    this.messageClearEvent?.remove(false);
    this.messageText.setText(message);
    this.scene.tweens.killTweensOf(this.messageText);
    this.messageText.setAlpha(0).setY(74).setScale(1);
    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 1,
      y: 68,
      duration: 130,
      ease: 'Sine.Out',
      onComplete: () => {
        this.messageClearEvent = this.scene.time.delayedCall(duration, () => this.clearMessage(true));
      },
    });
  }

  clearMessage(animated = false): void {
    this.messageClearEvent?.remove(false);
    this.messageClearEvent = undefined;
    this.scene.tweens.killTweensOf(this.messageText);
    if (!animated) {
      this.messageText.setText('').setAlpha(0).setY(74).setScale(1);
      return;
    }
    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 0,
      y: 62,
      duration: 180,
      ease: 'Sine.In',
      onComplete: () => this.messageText.setText('').setY(74).setScale(1),
    });
  }

  destroy(): void {
    this.messageClearEvent?.remove(false);
    this.items.forEach((item) => item.destroy());
  }

  private createHudButton(
    x: number,
    y: number,
    width: number,
    height: number,
    icon: 'home' | 'settings' | 'restart',
    onClick: () => void,
  ): void {
    const panel = this.scene.add.graphics();
    panel.setDepth(100);
    panel.setScrollFactor(0);
    panel.fillStyle(0x1f070b, 0.88);
    panel.fillRoundedRect(x, y, width, height, 4);
    panel.lineStyle(3, 0x050104, 0.9);
    panel.strokeRoundedRect(x, y, width, height, 4);
    panel.lineStyle(1, 0xffd7d7, 0.28);
    panel.strokeRoundedRect(x + 6, y + 6, width - 12, height - 12, 2);
    panel.setInteractive(new Phaser.Geom.Rectangle(x, y, width, height), Phaser.Geom.Rectangle.Contains);
    panel.on('pointerdown', onClick);

    const iconGraphic = this.scene.add.graphics();
    iconGraphic.setDepth(101);
    iconGraphic.setScrollFactor(0);
    drawHudIcon(iconGraphic, x + width / 2, y + height / 2, icon);
    this.items.push(panel, iconGraphic);
  }
}

function drawHudIcon(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, icon: 'home' | 'settings' | 'restart'): void {
  graphics.clear();
  graphics.lineStyle(3, 0xfee2e2, 1);
  graphics.fillStyle(0xfee2e2, 1);

  if (icon === 'home') {
    graphics.fillTriangle(cx - 14, cy - 1, cx, cy - 14, cx + 14, cy - 1);
    graphics.fillRect(cx - 10, cy - 1, 20, 14);
    graphics.fillStyle(0x1f070b, 1);
    graphics.fillRect(cx - 3, cy + 5, 6, 8);
    return;
  }

  if (icon === 'settings') {
    drawSliderIcon(graphics, cx, cy);
    return;
  }

  graphics.lineStyle(4, 0xfee2e2, 1);
  graphics.beginPath();
  graphics.arc(cx, cy, 11, Phaser.Math.DegToRad(42), Phaser.Math.DegToRad(324), false);
  graphics.strokePath();
  graphics.fillTriangle(cx + 13, cy - 10, cx + 17, cy + 1, cx + 6, cy - 2);
  graphics.lineBetween(cx - 13, cy + 8, cx - 8, cy + 13);
}

function drawSliderIcon(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
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
