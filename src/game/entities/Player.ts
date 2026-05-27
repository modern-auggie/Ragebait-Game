import Phaser from 'phaser';
import { COLORS } from '../systems/Effects';
import type { InputState } from '../systems/InputController';

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly speed = 190;
  private readonly jumpVelocity = -510;
  private readonly coyoteMs = 115;
  private readonly jumpBufferMs = 130;
  private lastGroundedAt = 0;
  private jumpBufferedAt = -9999;
  private wasGrounded = false;
  dead = false;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.ensureTexture();
    this.sprite = scene.physics.add.sprite(x, y, 'player-blob');
    this.sprite.setDepth(10);
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setDragX(1200);
    this.sprite.setMaxVelocity(260, 720);
    this.sprite.body?.setSize(30, 32);
  }

  update(time: number, input: InputState): boolean {
    if (this.dead) return false;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    let jumped = false;

    if (grounded) {
      this.lastGroundedAt = time;
      if (!this.wasGrounded) {
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.12,
          scaleY: 0.88,
          duration: 80,
          yoyo: true,
          ease: 'Sine.Out',
        });
      }
    }
    this.wasGrounded = grounded;

    if (input.jumpPressed) {
      this.jumpBufferedAt = time;
    }

    const direction = Number(input.right) - Number(input.left);
    if (direction !== 0) {
      body.setVelocityX(direction * this.speed);
      this.sprite.setFlipX(direction < 0);
    } else if (grounded) {
      body.setVelocityX(Phaser.Math.Linear(body.velocity.x, 0, 0.38));
    }

    const jumpBuffered = time - this.jumpBufferedAt <= this.jumpBufferMs;
    const canCoyote = time - this.lastGroundedAt <= this.coyoteMs;
    if (jumpBuffered && canCoyote) {
      body.setVelocityY(this.jumpVelocity);
      this.jumpBufferedAt = -9999;
      this.lastGroundedAt = -9999;
      jumped = true;
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 0.86,
        scaleY: 1.16,
        duration: 90,
        yoyo: true,
        ease: 'Sine.Out',
      });
    }

    const halfWidth = this.sprite.displayWidth * 0.5;
    if (this.sprite.x < halfWidth) {
      this.sprite.x = halfWidth;
      body.setVelocityX(Math.max(0, body.velocity.x));
    } else if (this.sprite.x > this.scene.scale.width - halfWidth) {
      this.sprite.x = this.scene.scale.width - halfWidth;
      body.setVelocityX(Math.min(0, body.velocity.x));
    }

    return jumped;
  }

  kill(): void {
    if (this.dead) return;
    this.dead = true;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 1.45,
      scaleY: 0.55,
      angle: Phaser.Math.Between(-18, 18),
      duration: 170,
      ease: 'Back.In',
    });
  }

  destroy(): void {
    this.sprite.destroy();
  }

  private ensureTexture(): void {
    if (this.scene.textures.exists('player-blob')) return;
    const g = this.scene.add.graphics();
    g.fillStyle(0x000000, 0.32);
    g.fillRoundedRect(4, 6, 34, 34, 6);
    g.fillStyle(COLORS.player, 1);
    g.fillRoundedRect(0, 0, 34, 34, 6);
    g.lineStyle(3, COLORS.playerEdge, 1);
    g.strokeRoundedRect(1, 1, 32, 32, 5);
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(6, 5, 22, 5);
    g.fillStyle(0x111827, 1);
    g.fillRect(9, 14, 5, 5);
    g.fillRect(21, 14, 5, 5);
    g.fillRect(12, 24, 11, 3);
    g.generateTexture('player-blob', 40, 42);
    g.destroy();
  }
}
