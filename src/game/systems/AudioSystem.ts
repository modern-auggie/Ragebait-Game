import { GameSettings } from './GameSettings';

type SfxName = 'jump' | 'death' | 'door' | 'button' | 'trap' | 'ui';
type AudioBus = 'music' | 'sfx';

export class AudioSystem {
  private static context?: AudioContext;
  private static musicTimer?: number;
  private static musicGain?: GainNode;
  private static sfxGain?: GainNode;
  private static noiseBuffer?: AudioBuffer;
  private static step = 0;

  static startMusic(): void {
    const settings = GameSettings.get();
    if (!settings.musicEnabled || settings.musicVolume <= 0) {
      this.stopMusic();
      return;
    }
    if (this.musicTimer !== undefined) {
      this.updateOutputGains();
      return;
    }
    const context = this.getContext();
    if (!context) return;
    void context.resume();
    this.updateOutputGains();

    const tickMs = 60000 / 132 / 4;
    this.musicTimer = window.setInterval(() => {
      const current = GameSettings.get();
      if (!current.musicEnabled || current.musicVolume <= 0) {
        this.stopMusic();
        return;
      }
      this.playMusicStep();
    }, tickMs);
    this.playMusicStep();
  }

  static stopMusic(): void {
    if (this.musicTimer === undefined) return;
    window.clearInterval(this.musicTimer);
    this.musicTimer = undefined;
  }

  static applySettings(): void {
    this.updateOutputGains();
    const settings = GameSettings.get();
    if (settings.musicEnabled && settings.musicVolume > 0) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  static sfx(name: SfxName): void {
    const settings = GameSettings.get();
    if (!settings.sfxEnabled || settings.sfxVolume <= 0) return;
    const map: Record<SfxName, [number, number, number, OscillatorType]> = {
      jump: [360, 0.08, 0.08, 'square'],
      death: [86, 0.18, 0.16, 'sawtooth'],
      door: [520, 0.12, 0.1, 'triangle'],
      button: [220, 0.06, 0.08, 'square'],
      trap: [118, 0.12, 0.13, 'sawtooth'],
      ui: [440, 0.05, 0.06, 'triangle'],
    };
    const [frequency, duration, volume, type] = map[name];
    this.playTone(frequency, duration, volume, type, 'sfx');
  }

  private static playMusicStep(): void {
    const step = this.step % 32;
    const beat = step % 16;
    const chord = Math.floor(step / 8) % 4;
    const bassNotes = [110, 87.31, 98, 82.41];
    const melody = [
      220,
      0,
      261.63,
      246.94,
      220,
      196,
      220,
      329.63,
      293.66,
      0,
      261.63,
      246.94,
      174.61,
      196,
      220,
      0,
      220,
      246.94,
      261.63,
      0,
      293.66,
      261.63,
      246.94,
      196,
      174.61,
      0,
      196,
      220,
      246.94,
      220,
      196,
      0,
    ];

    if (beat % 4 === 0) {
      this.playTone(bassNotes[chord], 0.28, 0.055, 'square', 'music');
      this.playKick();
    } else if (beat === 6 || beat === 14) {
      this.playTone(bassNotes[chord] * 1.5, 0.11, 0.026, 'square', 'music');
    }

    if (beat === 4 || beat === 12) {
      this.playNoise(0.11, 0.035, 1600, 'music');
    }

    if (step % 2 === 1) {
      this.playNoise(0.032, 0.012, 5200, 'music');
    }

    const note = melody[step];
    if (note > 0) {
      this.playTone(note, 0.14, step % 8 === 0 ? 0.052 : 0.036, 'sawtooth', 'music');
      if (step % 8 === 6) {
        this.playTone(note * 1.5, 0.08, 0.016, 'triangle', 'music');
      }
    }

    this.step += 1;
  }

  private static playTone(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    bus: AudioBus,
  ): void {
    const context = this.getContext();
    if (!context) return;
    const output = this.getBusGain(bus);
    if (!output) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + 0.03);
  }

  private static playKick(): void {
    const context = this.getContext();
    const output = this.getBusGain('music');
    if (!context || !output) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(104, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(42, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.09, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.14);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.16);
  }

  private static playNoise(duration: number, volume: number, filterFrequency: number, bus: AudioBus): void {
    const context = this.getContext();
    const output = this.getBusGain(bus);
    if (!context || !output) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = this.getNoiseBuffer(context);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(filterFrequency, context.currentTime);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    source.start();
    source.stop(context.currentTime + duration + 0.02);
  }

  private static getNoiseBuffer(context: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = buffer.getChannelData(0);
    let value = 0x12345678;
    for (let i = 0; i < data.length; i += 1) {
      value ^= value << 13;
      value ^= value >> 17;
      value ^= value << 5;
      data[i] = ((value >>> 0) / 4294967295) * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private static getBusGain(bus: AudioBus): GainNode | undefined {
    const context = this.getContext();
    if (!context) return undefined;
    if (bus === 'music') {
      if (!this.musicGain) {
        this.musicGain = context.createGain();
        this.musicGain.connect(context.destination);
      }
      this.updateOutputGains();
      return this.musicGain;
    }
    if (!this.sfxGain) {
      this.sfxGain = context.createGain();
      this.sfxGain.connect(context.destination);
    }
    this.updateOutputGains();
    return this.sfxGain;
  }

  private static updateOutputGains(): void {
    const context = this.context;
    if (!context) return;
    const settings = GameSettings.get();
    const musicVolume = settings.musicEnabled ? settings.musicVolume / 100 : 0;
    const sfxVolume = settings.sfxEnabled ? settings.sfxVolume / 100 : 0;
    this.musicGain?.gain.setTargetAtTime(musicVolume, context.currentTime, 0.04);
    this.sfxGain?.gain.setTargetAtTime(sfxVolume, context.currentTime, 0.02);
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
