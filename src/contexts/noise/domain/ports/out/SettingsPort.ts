export interface SettingsPort {
  readThresholdDb(): number | null;
  writeThresholdDb(db: number): void;
}
