export interface GameProgressState {
  unlockedLevel: number;
  bestDeaths: Record<string, number>;
}

const STORAGE_KEY = 'ragebait-v1a-progress';

const DEFAULT_PROGRESS: GameProgressState = {
  unlockedLevel: 1,
  bestDeaths: {},
};

export class GameProgress {
  private static state: GameProgressState = loadProgress();

  static get(): GameProgressState {
    return {
      unlockedLevel: this.state.unlockedLevel,
      bestDeaths: { ...this.state.bestDeaths },
    };
  }

  static isUnlocked(level: number): boolean {
    return level <= this.state.unlockedLevel;
  }

  static recordLevelComplete(level: number, deaths: number): void {
    const key = String(level);
    const previous = this.state.bestDeaths[key];
    if (previous === undefined || deaths < previous) {
      this.state.bestDeaths[key] = deaths;
    }
    if (level < 5) {
      this.state.unlockedLevel = Math.max(this.state.unlockedLevel, level + 1);
    }
    saveProgress(this.state);
  }
}

function loadProgress(): GameProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<GameProgressState>;
    return {
      unlockedLevel: Math.min(5, Math.max(1, parsed.unlockedLevel ?? 1)),
      bestDeaths: parsed.bestDeaths ?? {},
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function saveProgress(state: GameProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Progress is optional; the demo should still run if storage is blocked.
  }
}
