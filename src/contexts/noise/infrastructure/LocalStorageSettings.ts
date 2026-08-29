import type { SettingsPort } from '../domain/ports/out/SettingsPort';

const KEY = 'zarata.threshold-db';

export class LocalStorageSettings implements SettingsPort {
  readThresholdDb(): number | null {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored === null) return null;
      const db = Number.parseFloat(stored);
      return Number.isFinite(db) ? db : null;
    } catch {
      return null; // private browsing, or storage turned off
    }
  }

  writeThresholdDb(db: number): void {
    try {
      localStorage.setItem(KEY, String(db));
    } catch {
      // Nothing to do: the limit lasts this session and no longer.
    }
  }
}
