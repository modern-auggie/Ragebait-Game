export type ControlMode = 'buttons' | 'joystick';

export interface GameSettingsState {
  controlMode: ControlMode;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  devMode: boolean;
}

const STORAGE_KEY = 'ragebait-v1a-settings';

const DEFAULT_SETTINGS: GameSettingsState = {
  controlMode: 'buttons',
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 72,
  sfxVolume: 82,
  devMode: false,
};

export class GameSettings {
  private static state: GameSettingsState = loadSettings();

  static get(): GameSettingsState {
    return { ...this.state };
  }

  static set(partial: Partial<GameSettingsState>): GameSettingsState {
    this.state = { ...this.state, ...partial };
    this.state.musicVolume = clampPercent(this.state.musicVolume);
    this.state.sfxVolume = clampPercent(this.state.sfxVolume);
    if (partial.musicVolume !== undefined) {
      this.state.musicEnabled = this.state.musicVolume > 0;
    }
    if (partial.sfxVolume !== undefined) {
      this.state.sfxEnabled = this.state.sfxVolume > 0;
    }
    saveSettings(this.state);
    return this.get();
  }
}

function loadSettings(): GameSettingsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettingsState>;
    const musicVolume = clampPercent(
      parsed.musicVolume ?? (parsed.musicEnabled === false ? 0 : DEFAULT_SETTINGS.musicVolume),
    );
    const sfxVolume = clampPercent(parsed.sfxVolume ?? (parsed.sfxEnabled === false ? 0 : DEFAULT_SETTINGS.sfxVolume));
    return {
      controlMode: parsed.controlMode === 'joystick' ? 'joystick' : 'buttons',
      musicEnabled: (parsed.musicEnabled ?? DEFAULT_SETTINGS.musicEnabled) && musicVolume > 0,
      sfxEnabled: (parsed.sfxEnabled ?? DEFAULT_SETTINGS.sfxEnabled) && sfxVolume > 0,
      musicVolume,
      sfxVolume,
      devMode: parsed.devMode === true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(state: GameSettingsState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Settings are nice to have; gameplay should still work if storage is blocked.
  }
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}
