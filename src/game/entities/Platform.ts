import Phaser from 'phaser';
import { COLORS, drawRoundedBlock } from '../systems/Effects';
import type { PlatformDef, PlatformKind } from '../levels/levelTypes';

export class Platform {
  readonly id: string;
  readonly kind: PlatformKind;
  readonly zone: Phaser.GameObjects.Zone;
  readonly visual: Phaser.GameObjects.Graphics;
  readonly def: PlatformDef;
  triggered = false;

  constructor(private scene: Phaser.Scene, def: PlatformDef) {
    this.id = def.id;
    this.kind = def.kind ?? 'solid';
    this.def = { ...def };
    this.visual = scene.add.graphics({ x: def.x, y: def.y });
    this.zone = scene.add.zone(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h);
    scene.physics.add.existing(this.zone, true);

    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(def.w, def.h);
    body.updateFromGameObject();
    this.visual.setDepth(this.kind === 'fakeWall' ? 12 : 3);

    if (this.kind === 'fakeWall') {
      body.enable = false;
    }

    this.draw(1);
  }

  draw(alpha = 1): void {
    const fill = this.kind === 'fakeWall' ? COLORS.fakeWall : this.def.tint ?? COLORS.platform;
    const stroke = this.kind === 'fakeWall' ? 0x94a3b8 : COLORS.platformEdge;
    if (this.def.h >= 64 && this.kind !== 'fakeWall') {
      this.drawSeamlessGround(fill, stroke, alpha);
      return;
    }
    drawRoundedBlock(this.visual, this.def.w, this.def.h, fill, stroke, 5, alpha);
    if (this.kind === 'fakeWall') {
      this.visual.setAlpha(0.86);
    }
  }

  private drawSeamlessGround(fill: number, stroke: number, alpha: number): void {
    const { w, h } = this.def;
    this.visual.clear();
    this.visual.fillStyle(0x000000, 0.45 * alpha);
    this.visual.fillRect(0, 6, w, h);
    this.visual.fillStyle(COLORS.platformDark, alpha);
    this.visual.fillRect(0, 3, w, h);
    this.visual.fillStyle(fill, alpha);
    this.visual.fillRect(0, 0, w, h);
    this.visual.fillStyle(0xffd7d7, 0.24 * alpha);
    this.visual.fillRect(0, 5, w, 11);
    this.visual.fillStyle(0x050104, 0.22 * alpha);
    this.visual.fillRect(0, h - 9, w, 4);
    this.visual.lineStyle(3, 0x050104, 0.98 * alpha);
    this.visual.lineBetween(0, 0, w, 0);
    this.visual.lineBetween(0, h, w, h);
    this.visual.lineStyle(1, stroke, 0.45 * alpha);
    this.visual.lineBetween(0, 3, w, 3);
    this.visual.lineStyle(1, 0x050104, 0.16 * alpha);
    for (let x = 18; x < w; x += 34) {
      this.visual.lineBetween(x, 17, x - 8, h - 10);
    }
  }

  drop(delay = 0): void {
    if (this.triggered) return;
    this.triggered = true;
    this.scene.time.delayedCall(delay, () => {
      const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
      body.enable = false;
      this.scene.tweens.add({
        targets: [this.visual, this.zone],
        y: '+=120',
        alpha: 0,
        duration: 420,
        ease: 'Back.In',
      });
    });
  }

  moveTo(x: number, y: number, duration = 360): void {
    const state = { x: this.visual.x, y: this.visual.y };
    this.scene.tweens.add({
      targets: state,
      x,
      y,
      duration,
      ease: 'Cubic.Out',
      onUpdate: () => this.setPosition(state.x, state.y),
      onComplete: () => this.setPosition(x, y),
    });
  }

  resizeTo(x: number, y: number, width: number, height: number, duration = 360): void {
    const state = { x: this.def.x, y: this.def.y, w: this.def.w, h: this.def.h };
    this.scene.tweens.add({
      targets: state,
      x,
      y,
      w: width,
      h: height,
      duration,
      ease: 'Cubic.Out',
      onUpdate: () => this.setRect(state.x, state.y, state.w, state.h),
      onComplete: () => this.setRect(x, y, width, height),
    });
  }

  setPosition(x: number, y: number): void {
    this.setRect(x, y, this.def.w, this.def.h);
  }

  setRect(x: number, y: number, width: number, height: number): void {
    this.def.x = x;
    this.def.y = y;
    this.def.w = width;
    this.def.h = height;
    this.visual.setPosition(x, y);
    this.zone.setPosition(x + width / 2, y + height / 2);
    this.zone.setSize(width, height);
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(width, height);
    body.updateFromGameObject();
    this.draw(this.visual.alpha);
  }

  destroy(): void {
    this.visual.destroy();
    this.zone.destroy();
  }
}
