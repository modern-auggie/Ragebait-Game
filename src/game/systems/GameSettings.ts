export type ControlMode = 'buttons' | 'joystick';

export interface GameSettingsState {
  controlMode: ControlMode;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

const STORAGE_KEY = 'ragebait-v1a-settings';

const DEFAULT_SETTINGS: GameSettingsState = {
  controlMode: 'buttons',
  musicEnabled: true,
  sfxEnabled: true,
};

export class GameSettings {
  private static state: GameSettingsState = loadSettings();

  static get(): GameSettingsState {
    return { ...this.state };
  }

  static set(partial: Partial<GameSettingsState>): GameSettingsState {
    this.state = { ...this.state, ...partial };
    saveSettings(this.state);
    return this.get();
  }
}

function loadSettings(): GameSettingsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettingsState>;
    return {
      controlMode: parsed.controlMode === 'joystick' ? 'joystick' : 'buttons',
      musicEnabled: parsed.musicEnabled ?? DEFAULT_SETTINGS.musicEnabled,
      sfxEnabled: parsed.sfxEnabled ?? DEFAULT_SETTINGS.sfxEnabled,
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
