import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const COLORS = {
  bgTop: 0x26070d,
  bgBottom: 0x050104,
  platform: 0x5f111c,
  platformDark: 0x25050a,
  platformEdge: 0xffd7d7,
  fakeWall: 0x2b1218,
  player: 0xffd36d,
  playerEdge: 0x2b0808,
  spike: 0xff243f,
  spikeDark: 0x4d0612,
  door: 0xff334e,
  doorOpen: 0xff3b3b,
  doorClosed: 0x2f141b,
  button: 0xdc2626,
  buttonDown: 0x7f1d1d,
  text: '#f8fafc',
};

export function drawBackground(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.setDepth(-100);
  g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  g.lineStyle(1, 0xff243f, 0.11);
  for (let x = 24; x < GAME_WIDTH; x += 48) {
    g.lineBetween(x, 46, x, GAME_HEIGHT - 38);
  }

  g.lineStyle(1, 0xffd7d7, 0.055);
  for (let y = 46; y < GAME_HEIGHT - 36; y += 48) {
    g.lineBetween(22, y, GAME_WIDTH - 22, y);
  }

  for (let y = 0; y < GAME_HEIGHT; y += 6) {
    g.fillStyle(0x000000, 0.09);
    g.fillRect(0, y, GAME_WIDTH, 2);
  }

  for (let i = 0; i < 24; i += 1) {
    const x = Phaser.Math.Between(12, GAME_WIDTH - 12);
    const y = Phaser.Math.Between(24, GAME_HEIGHT - 56);
    const size = Phaser.Math.Between(2, 4);
    g.fillStyle(i % 3 === 0 ? 0xffd36d : 0xff243f, Phaser.Math.FloatBetween(0.1, 0.22));
    g.fillRect(x, y, size, size);
  }

  return g;
}

export function drawRoundedBlock(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  fill: number,
  stroke = 0xffffff,
  radius = 5,
  alpha = 1,
): void {
  graphics.clear();
  graphics.fillStyle(0x000000, 0.45 * alpha);
  graphics.fillRoundedRect(4, 6, width, height, radius);
  graphics.fillStyle(COLORS.platformDark, alpha);
  graphics.fillRoundedRect(0, 3, width, height, radius);
  graphics.fillStyle(fill, alpha);
  graphics.fillRoundedRect(0, 0, width, height, radius);
  graphics.lineStyle(3, 0x050104, 0.98 * alpha);
  graphics.strokeRoundedRect(0, 0, width, height, radius);
  graphics.lineStyle(1, stroke, 0.6 * alpha);
  graphics.strokeRoundedRect(1, 1, width - 2, height - 2, radius);
  graphics.fillStyle(0xffd7d7, 0.24 * alpha);
  graphics.fillRect(6, 5, Math.max(0, width - 12), Math.max(3, height * 0.22));
  graphics.fillStyle(0x050104, 0.22 * alpha);
  graphics.fillRect(6, height - 8, Math.max(0, width - 12), 3);
  if (height > 48) {
    graphics.lineStyle(1, 0x050104, 0.18 * alpha);
    for (let x = 18; x < width; x += 34) {
      graphics.lineBetween(x, 12, x - 8, height - 10);
    }
  }
}

export function addBurst(scene: Phaser.Scene, x: number, y: number, color: number, count = 14): void {
  for (let i = 0; i < count; i += 1) {
    const size = Phaser.Math.Between(3, 7);
    const dot = scene.add.rectangle(x, y, size, size, color, 1);
    dot.setDepth(50);
    dot.setAngle(Phaser.Math.Between(0, 90));
    scene.tweens.add({
      targets: dot,
      x: x + Phaser.Math.Between(-42, 42),
      y: y + Phaser.Math.Between(-38, 26),
      alpha: 0,
      scale: 0.2,
      duration: Phaser.Math.Between(280, 520),
      ease: 'Cubic.Out',
      onComplete: () => dot.destroy(),
    });
  }
}

export function addFloatingText(scene: Phaser.Scene, text: string, y = 260, duration = 900): void {
  const label = scene.add
    .text(GAME_WIDTH / 2, y, text, {
      fontFamily: '"Arial Black", Impact, Inter, Arial, sans-serif',
      fontSize: '36px',
      color: '#fee2e2',
      fontStyle: '900',
      stroke: '#450a0a',
      strokeThickness: 8,
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(90)
    .setScale(0.7)
    .setAlpha(0);

  scene.tweens.add({
    targets: label,
    alpha: 1,
    scale: 1,
    duration: 160,
    ease: 'Back.Out',
    yoyo: true,
    hold: duration,
    onComplete: () => label.destroy(),
  });
}

export function pulse(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, scale = 1.08): void {
  scene.tweens.add({
    targets: target,
    scaleX: scale,
    scaleY: scale,
    duration: 90,
    yoyo: true,
    ease: 'Sine.InOut',
  });
}
