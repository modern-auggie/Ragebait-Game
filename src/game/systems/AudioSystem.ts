import { GameSettings } from './GameSettings';

type SfxName = 'jump' | 'death' | 'door' | 'button' | 'trap' | 'ui';

export class AudioSystem {
  private static context?: AudioContext;
  private static musicTimer?: number;
  private static step = 0;

  static startMusic(): void {
    if (!GameSettings.get().musicEnabled || this.musicTimer !== undefined) return;
    const context = this.getContext();
    if (!context) return;
    void context.resume();

    const notes = [55, 55, 65.41, 61.74, 55, 82.41, 73.42, 61.74];
    this.musicTimer = window.setInterval(() => {
      if (!GameSettings.get().musicEnabled) {
        this.stopMusic();
        return;
      }
      const frequency = notes[this.step % notes.length];
      this.step += 1;
      this.playTone(frequency, 0.12, 0.055, 'sawtooth');
      if (this.step % 4 === 0) {
        this.playTone(frequency / 2, 0.22, 0.035, 'square');
      }
    }, 230);
  }

  static stopMusic(): void {
    if (this.musicTimer === undefined) return;
    window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
  }

  static applySettings(): void {
    if (GameSettings.get().musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  static sfx(name: SfxName): void {
    if (!GameSettings.get().sfxEnabled) return;
    const map: Record<SfxName, [number, number, number, OscillatorType]> = {
      jump: [360, 0.08, 0.08, 'square'],
      death: [86, 0.18, 0.16, 'sawtooth'],
      door: [520, 0.12, 0.1, 'triangle'],
      button: [220, 0.06, 0.08, 'square'],
      trap: [118, 0.12, 0.13, 'sawtooth'],
      ui: [440, 0.05, 0.06, 'triangle'],
    };
    const [frequency, duration, volume, type] = map[name];
    this.playTone(frequency, duration, volume, type);
  }

  private static playTone(frequency: number, duration: number, volume: number, type: OscillatorType): void {
    const context = this.getContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.03);
  }

  private static getContext(): AudioContext | undefined {
    if (this.context) return this.context;
    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtor) return undefined;
    this.context = new AudioCtor();
    return this.context;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
