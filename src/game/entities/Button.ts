import Phaser from 'phaser';
import { COLORS } from '../systems/Effects';
import type { ButtonDef } from '../levels/levelTypes';

export class Button {
  readonly id: string;
  readonly zone: Phaser.GameObjects.Zone;
  readonly visual: Phaser.GameObjects.Graphics;
  readonly label?: string;
  pressed = false;

  constructor(private scene: Phaser.Scene, readonly def: ButtonDef) {
    this.id = def.id;
    this.label = def.label;
    this.visual = scene.add.graphics({ x: def.x, y: def.y });
    this.zone = scene.add.zone(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h + 12);
    scene.physics.add.existing(this.zone, true);
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(def.w, def.h + 12);
    body.updateFromGameObject();
    this.draw();
  }

  draw(): void {
    const { w, h } = this.def;
    this.visual.clear();
    this.visual.fillStyle(0x000000, 0.42);
    this.visual.fillRoundedRect(3, 7, w, h, 4);
    this.visual.fillStyle(0x7c2d12, 1);
    this.visual.fillRoundedRect(0, this.pressed ? 8 : 3, w, h, 4);
    this.visual.fillStyle(this.pressed ? COLORS.buttonDown : COLORS.button, 1);
    this.visual.fillRoundedRect(0, this.pressed ? 5 : 0, w, h, 4);
    this.visual.lineStyle(3, 0x050104, 0.95);
    this.visual.strokeRoundedRect(0, this.pressed ? 5 : 0, w, h, 4);
    this.visual.lineStyle(1, 0xffd7d7, 0.58);
    this.visual.strokeRoundedRect(3, this.pressed ? 8 : 3, w - 6, h - 6, 3);
    this.visual.fillStyle(0xffd7d7, this.pressed ? 0.08 : 0.24);
    this.visual.fillRect(7, this.pressed ? 10 : 5, w - 14, 5);
  }

  press(): boolean {
    if (this.pressed) return false;
    this.pressed = true;
    this.draw();
    this.scene.tweens.add({
      targets: this.visual,
      scaleX: 1.08,
      duration: 80,
      yoyo: true,
      ease: 'Sine.InOut',
    });
    return true;
  }

  destroy(): void {
    this.visual.destroy();
    this.zone.destroy();
  }
}
