import Phaser from 'phaser';
import { COLORS } from '../systems/Effects';
import type { DoorDef, DoorKind } from '../levels/levelTypes';

export class Door {
  readonly id: string;
  readonly kind: DoorKind;
  readonly zone: Phaser.GameObjects.Zone;
  readonly visual: Phaser.GameObjects.Graphics;
  open: boolean;
  hidden: boolean;
  touched = false;

  private readonly def: DoorDef;

  constructor(private scene: Phaser.Scene, def: DoorDef) {
    this.def = { ...def };
    this.id = def.id;
    this.kind = def.kind;
    this.open = def.open ?? true;
    this.hidden = Boolean(def.hidden);
    this.visual = scene.add.graphics({ x: def.x, y: def.y });
    this.zone = scene.add.zone(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h);
    scene.physics.add.existing(this.zone, true);
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(def.w, def.h);
    body.updateFromGameObject();
    body.enable = !this.hidden;
    this.visual.setDepth(6);
    this.draw();
    this.setVisible(!this.hidden);
  }

  draw(pulse = 0): void {
    const { w, h } = this.def;
    const color = this.kind === 'fakeDeadly' ? COLORS.spike : this.open ? COLORS.doorOpen : COLORS.doorClosed;
    this.visual.clear();
    this.visual.fillStyle(color, this.open ? 0.12 + pulse * 0.08 : 0.06);
    this.visual.fillRoundedRect(-6, -6, w + 12, h + 12, 8);
    this.visual.fillStyle(0x050104, 1);
    this.visual.fillRoundedRect(0, 0, w, h, 7);
    this.visual.lineStyle(4, color, this.open ? 1 : 0.6);
    this.visual.strokeRoundedRect(1, 1, w - 2, h - 2, 6);
    this.visual.lineStyle(1, 0xffd7d7, this.open ? 0.72 : 0.24);
    this.visual.strokeRoundedRect(8, 8, w - 16, h - 16, 3);
    this.visual.fillStyle(color, this.open ? 0.35 : 0.12);
    this.visual.fillRect(11, 12 + pulse * 8, w - 22, 5);
    this.visual.fillRect(11, 34 - pulse * 6, w - 22, 4);
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.draw();
    this.scene.tweens.add({
      targets: this.visual,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 120,
      yoyo: true,
      ease: 'Back.Out',
    });
  }

  reveal(): void {
    if (!this.hidden) return;
    this.hidden = false;
    this.open = true;
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = true;
    this.setVisible(true);
    this.visual.setAlpha(0);
    this.draw();
    this.scene.tweens.add({
      targets: this.visual,
      alpha: 1,
      duration: 220,
      ease: 'Sine.Out',
    });
  }

  setVisible(visible: boolean): void {
    this.visual.setVisible(visible);
    this.zone.setActive(visible);
  }

  setPosition(x: number, y: number): void {
    this.def.x = x;
    this.def.y = y;
    this.visual.setPosition(x, y);
    this.zone.setPosition(x + this.def.w / 2, y + this.def.h / 2);
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
  }

  update(time: number): void {
    if (this.hidden) return;
    const shimmer = (Math.sin(time / 230) + 1) / 2;
    this.draw(shimmer);
  }

  destroy(): void {
    this.visual.destroy();
    this.zone.destroy();
  }
}
