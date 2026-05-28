import Phaser from 'phaser';
import type { Button } from '../entities/Button';
import type { Door } from '../entities/Door';
import type { Platform } from '../entities/Platform';
import type { Spike } from '../entities/Spike';
import type { LevelDefinition, RectDef } from '../levels/levelTypes';
import { GAME_WIDTH } from '../config';
import { addFloatingText, pulse } from './Effects';
import type { LoadedLevel } from './LevelLoader';
import { AudioSystem } from './AudioSystem';

interface BehaviorHost {
  playerX(): number;
  playerY(): number;
  killPlayer(message?: string): void;
  completeLevel(): void;
  showMessage(message: string, duration?: number): void;
  shake(intensity?: number, duration?: number): void;
}

export class LevelBehaviors {
  private movingDoorTriggered = false;
  private fakeVictoryTriggered = false;
  private r11Triggered = false;
  private r12First = false;
  private r12Second = false;
  private r13Revealed = false;
  private r13Triggered = false;
  private r14Secret = false;
  private r14Chase = false;
  private r15Left = false;
  private r21Triggered = false;
  private r22Second = false;
  private r22Third = false;
  private r23Swap = false;
  private r23Runner = false;
  private r24Started = false;
  private r25Stage = 0;
  private wrongDoorSide: 'left' | 'right' = 'right';
  private wrongDoorLocked = false;

  constructor(
    private scene: Phaser.Scene,
    private host: BehaviorHost,
    private level: LevelDefinition,
    private loaded: LoadedLevel,
  ) {}

  update(): void {
    switch (this.level.behavior) {
      case 'round1DropNearDoor':
        this.updateR11();
        break;
      case 'round1DoubleDrop':
        this.updateR12();
        break;
      case 'round1GapChasesLeft':
        this.updateR13();
        break;
      case 'round1SecretGapChasesRight':
        this.updateR14();
        break;
      case 'round1Finale':
        this.updateR15();
        break;
      case 'round2SpikeBait':
        this.updateR21();
        break;
      case 'round2TripleSpikes':
        this.updateR22();
        break;
      case 'round2ShaftSpikeSwap':
        this.updateR23();
        break;
      case 'round2StairChase':
        this.updateR24();
        break;
      case 'round2CrawlRush':
        this.updateR25();
        break;
      case 'movingDoor':
        this.updateMovingDoor();
        break;
      default:
        break;
    }
  }

  onPlatformTouched(platform: Platform): void {
    if (platform.kind === 'fake') {
      platform.drop(80);
      this.trapFeedback();
      return;
    }

    if (platform.kind === 'drop' && this.level.behavior === 'disappearingFloor') {
      platform.drop(180);
      this.trapFeedback();
    }
  }

  onPlayerJumped(): void {
    if (this.level.behavior !== 'jumpRevealsSpikes') return;
    const zone = this.level.jumpTrapZone;
    if (!zone || !pointInRect(this.host.playerX(), this.host.playerY(), zone)) return;
    this.loaded.spikes.forEach((spike) => spike.reveal());
    this.trapFeedback();
  }

  onButtonPressed(button: Button): void {
    if (!button.press()) return;
    pulse(this.scene, button.visual, 1.08);
    AudioSystem.sfx('button');
    this.host.shake(0.003, 80);

    if (button.def.opensDoorId) {
      this.findDoor(button.def.opensDoorId)?.setOpen(true);
    }

    if (this.level.behavior === 'buttonDropsFloor' && button.def.dropsPlatformId) {
      this.findPlatform(button.def.dropsPlatformId)?.drop(330);
    }
  }

  onDoorTouched(door: Door): void {
    if (!door.open && door.kind !== 'fakeDeadly') return;

    if (this.level.behavior === 'wrongDoorLoop') {
      this.triggerWrongDoor(door);
      return;
    }

    if (door.kind === 'fakeDeadly') {
      this.host.killPlayer('Maybe that wasn\'t the real door.');
      return;
    }

    if (door.kind === 'fakeVictory') {
      this.triggerFakeVictory(door);
      return;
    }

    if (door.kind === 'real' || door.kind === 'hiddenReal' || door.kind === 'moving') {
      this.host.completeLevel();
    }
  }

  private updateR11(): void {
    if (this.r11Triggered || this.host.playerX() < 616) return;
    this.r11Triggered = true;
    this.findPlatform('door-drop')?.drop(45);
    this.trapFeedback();
  }

  private updateR12(): void {
    const x = this.host.playerX();
    if (!this.r12First && x > 430) {
      this.r12First = true;
      this.findPlatform('drop-one')?.drop(55);
      this.trapFeedback();
    }
    if (!this.r12Second && x > 780) {
      this.r12Second = true;
      this.findPlatform('drop-two')?.drop(35);
      this.trapFeedback();
    }
  }

  private updateR13(): void {
    const x = this.host.playerX();
    if (!this.r13Revealed && x > 300) {
      this.r13Revealed = true;
      this.findPlatform('move-gap')?.drop(35);
      this.trapFeedback();
    }

    if (this.r13Triggered || x < 470) return;
    this.r13Triggered = true;
    this.findPlatform('floor-left')?.resizeTo(0, 390, 448, 150, 1850);
    this.findPlatform('floor-right')?.resizeTo(548, 390, 412, 150, 1850);
    this.trapFeedback();
  }

  private updateR14(): void {
    const x = this.host.playerX();
    if (!this.r14Secret && x > 70) {
      this.r14Secret = true;
      this.findPlatform('secret-gap')?.drop(35);
      this.host.showMessage('Surprise.', 750);
      this.trapFeedback();
    }

    if (!this.r14Chase && x > 430) {
      this.r14Chase = true;
      ['gap-expand-1', 'gap-expand-2', 'gap-expand-3', 'gap-expand-4', 'gap-expand-5'].forEach((id, index) => {
        this.findPlatform(id)?.drop(130 + index * 280);
      });
      this.trapFeedback();
    }
  }

  private updateR15(): void {
    const x = this.host.playerX();
    if (!this.r15Left && x > 320) {
      this.r15Left = true;
      ['final-gap-1', 'final-gap-2', 'final-gap-3', 'final-gap-4', 'final-gap-5', 'final-gap-6'].forEach((id, index) => {
        this.findPlatform(id)?.drop(index * 120);
      });
      this.scene.time.delayedCall(1350, () => {
        this.findPlatform('split-player')?.moveTo(444, 390, 220);
        this.trapFeedback();
      });
      this.trapFeedback();
    }
  }

  private updateR21(): void {
    if (this.r21Triggered || this.host.playerY() < 320 || this.host.playerX() > 440) return;
    this.r21Triggered = true;
    this.findSpike('shy-spike')?.moveTo(230, 358, 260);
    this.trapFeedback();
  }

  private updateR22(): void {
    const x = this.host.playerX();
    if (!this.r22Second && x > 390) {
      this.r22Second = true;
      this.findSpike('spike-two')?.moveTo(420, 358, 220);
      this.trapFeedback();
    }
    if (!this.r22Third && x > 575) {
      this.r22Third = true;
      this.findSpike('spike-three')?.moveTo(724, 358, 240);
      this.trapFeedback();
    }
  }

  private updateR23(): void {
    if (!this.r23Swap && this.host.playerY() > 286 && this.host.playerX() > 384 && this.host.playerX() < 642) {
      this.r23Swap = true;
      this.findSpike('shaft-spike')?.moveTo(416, 358, 360);
      this.trapFeedback();
    }

    if (!this.r23Runner && this.host.playerY() > 320 && this.host.playerX() > 724) {
      this.r23Runner = true;
      this.findSpike('runner-spike')?.moveTo(-80, 358, 4300, 'Linear');
      this.findSpike('shaft-spike')?.moveTo(-80, 358, 2380, 'Linear');
      this.host.showMessage('Back up.', 800);
      this.trapFeedback();
    }
  }

  private updateR24(): void {
    if (this.r24Started || this.host.playerX() < 310) return;
    this.r24Started = true;
    [
      'stair-chase-1',
      'stair-chase-2',
      'stair-chase-3',
      'stair-chase-4',
      'stair-chase-5',
      'stair-chase-6',
      'stair-chase-7',
      'stair-chase-8',
    ].forEach((id, index) => {
      this.scene.time.delayedCall(index * 190, () => this.findSpike(id)?.reveal());
    });
    this.host.showMessage('Move.', 700);
    this.trapFeedback();
  }

  private updateR25(): void {
    const x = this.host.playerX();
    if (this.r25Stage === 0 && x < 500) {
      this.r25Stage = 1;
      this.findSpike('rush-one')?.moveTo(900, 358, 2350, 'Linear');
      this.host.showMessage('Hide.', 650);
      this.trapFeedback();
    }
    if (this.r25Stage === 1 && x > 780) {
      this.r25Stage = 2;
    }
    if (this.r25Stage === 2 && x < 500) {
      this.r25Stage = 3;
      this.findSpike('rush-two')?.moveTo(900, 358, 2300, 'Linear');
      this.host.showMessage('Again.', 650);
      this.trapFeedback();
    }
    if (this.r25Stage === 3 && x > 780) {
      this.r25Stage = 4;
    }
    if (this.r25Stage === 4 && x < 500) {
      this.r25Stage = 5;
      this.findSpike('rush-three')?.moveTo(82, 358, 2550, 'Linear');
      this.host.showMessage('Door. Now.', 650);
      this.trapFeedback();
    }
  }

  private updateMovingDoor(): void {
    if (this.movingDoorTriggered) return;
    const door = this.loaded.doors.find((item) => item.kind === 'moving');
    if (!door) return;
    const dx = door.zone.x - this.host.playerX();
    const closeFromLeft = dx > 0 && dx < 76 && Math.abs(this.host.playerY() - door.zone.y) < 80;
    if (!closeFromLeft) return;
    this.movingDoorTriggered = true;
    const doorY = door.zone.y - door.zone.height / 2;
    const currentX = door.zone.x - door.zone.width / 2;
    const targetX = Phaser.Math.Clamp(this.level.movingDoorStopX ?? 326, 18, GAME_WIDTH - door.zone.width - 18);
    const tweenState = { x: currentX };
    this.scene.tweens.add({
      targets: tweenState,
      x: targetX,
      duration: 430,
      ease: 'Back.Out',
      onUpdate: () => door.setPosition(tweenState.x, doorY),
      onComplete: () => door.setPosition(targetX, doorY),
    });
    this.host.showMessage('Nope.', 900);
    this.trapFeedback();
  }

  private triggerFakeVictory(door: Door): void {
    if (this.fakeVictoryTriggered) return;
    this.fakeVictoryTriggered = true;
    door.open = false;
    door.setVisible(false);
    addFloatingText(this.scene, 'YOU WIN!', 254, 720);
    this.host.showMessage('Wait. One more tiny thing.', 1400);
    this.scene.time.delayedCall(760, () => {
      this.loaded.spikes.find((spike) => spike.id === 'final-spike')?.reveal();
      this.findDoor('real-exit')?.reveal();
    });
    this.trapFeedback();
  }

  private triggerWrongDoor(door: Door): void {
    if (this.wrongDoorLocked) return;
    this.wrongDoorLocked = true;
    this.wrongDoorSide = this.wrongDoorSide === 'right' ? 'left' : 'right';
    const nextX = this.wrongDoorSide === 'left' ? 38 : 884;
    door.setPosition(nextX, 320);
    this.host.showMessage('Wrong door.', 900);
    AudioSystem.sfx('trap');
    this.host.shake(0.006, 110);
    this.scene.time.delayedCall(280, () => {
      this.wrongDoorLocked = false;
    });
  }

  private trapFeedback(): void {
    AudioSystem.sfx('trap');
    this.host.shake(0.006, 130);
  }

  private findDoor(id: string): Door | undefined {
    return this.loaded.doors.find((door) => door.id === id);
  }

  private findPlatform(id: string): Platform | undefined {
    return this.loaded.platforms.find((platform) => platform.id === id);
  }

  private findSpike(id: string): Spike | undefined {
    return this.loaded.spikes.find((spike) => spike.id === id);
  }
}

function pointInRect(x: number, y: number, rect: RectDef): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
