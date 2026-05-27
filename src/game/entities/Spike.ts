import Phaser from 'phaser';
import { COLORS } from '../systems/Effects';
import type { SpikeDef, SpikeOrientation } from '../levels/levelTypes';

export class Spike {
  readonly id: string;
  readonly zone: Phaser.GameObjects.Zone;
  readonly visual: Phaser.GameObjects.Graphics;
  readonly orientation: SpikeOrientation;
  hidden: boolean;

  constructor(private scene: Phaser.Scene, private def: SpikeDef) {
    this.id = def.id;
    this.orientation = def.orientation ?? 'up';
    this.hidden = Boolean(def.hidden);
    this.visual = scene.add.graphics({ x: def.x, y: def.y });
    this.zone = scene.add.zone(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h);
    scene.physics.add.existing(this.zone, true);
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(def.w, def.h);
    body.updateFromGameObject();
    body.enable = !this.hidden;
    this.draw();
    this.visual.setVisible(!this.hidden);
    this.visual.setAlpha(this.hidden ? 0 : 1);
  }

  draw(): void {
    const { w, h } = this.def;
    this.visual.clear();
    const count = Math.max(1, Math.floor(w / 17));
    const spikeW = w / count;
    for (let i = 0; i < count; i += 1) {
      const x = i * spikeW;
      this.visual.fillStyle(0x050104, 1);
      this.visual.lineStyle(3, 0x050104, 1);
      if (this.orientation === 'down') {
        this.visual.fillTriangle(x - 1, -1, x + spikeW / 2, h + 3, x + spikeW + 1, -1);
        this.visual.strokeTriangle(x - 1, -1, x + spikeW / 2, h + 3, x + spikeW + 1, -1);
        this.visual.fillStyle(COLORS.spike, 1);
        this.visual.lineStyle(1, 0xffd1d8, 0.85);
        this.visual.fillTriangle(x + 2, 2, x + spikeW / 2, h - 2, x + spikeW - 2, 2);
        this.visual.strokeTriangle(x + 2, 2, x + spikeW / 2, h - 2, x + spikeW - 2, 2);
      } else {
        this.visual.fillTriangle(x - 1, h + 1, x + spikeW / 2, -3, x + spikeW + 1, h + 1);
        this.visual.strokeTriangle(x - 1, h + 1, x + spikeW / 2, -3, x + spikeW + 1, h + 1);
        this.visual.fillStyle(COLORS.spike, 1);
        this.visual.lineStyle(1, 0xffd1d8, 0.85);
        this.visual.fillTriangle(x + 2, h - 2, x + spikeW / 2, 3, x + spikeW - 2, h - 2);
        this.visual.strokeTriangle(x + 2, h - 2, x + spikeW / 2, 3, x + spikeW - 2, h - 2);
      }
    }
  }

  reveal(): void {
    if (!this.hidden) return;
    this.hidden = false;
    const body = this.zone.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = true;
    this.visual.setVisible(true);
    this.scene.tweens.add({
      targets: this.visual,
      alpha: 1,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 120,
      yoyo: true,
      ease: 'Sine.InOut',
    });
  }

  destroy(): void {
    this.visual.destroy();
    this.zone.destroy();
  }
}
