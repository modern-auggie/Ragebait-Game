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
    this.def = def;
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
    drawRoundedBlock(this.visual, this.def.w, this.def.h, fill, stroke, 5, alpha);
    if (this.kind === 'fakeWall') {
      this.visual.setAlpha(0.86);
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

  destroy(): void {
    this.visual.destroy();
    this.zone.destroy();
  }
}
