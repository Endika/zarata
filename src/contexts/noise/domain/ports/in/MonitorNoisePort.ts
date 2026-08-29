import type { SoundLevel } from '../../model/SoundLevel';
import type { Threshold } from '../../model/Threshold';

/** What the screen is told after every frame. */
export interface Reading {
  readonly level: SoundLevel;
  readonly threshold: Threshold;
  readonly trail: readonly number[];
  readonly peak: SoundLevel;
  readonly alarming: boolean;
}

export interface MonitorNoisePort {
  start(): Promise<void>;
  stop(): Promise<void>;
  setThreshold(threshold: Threshold): void;
  onReading(listener: (reading: Reading) => void): void;
  readonly isListening: boolean;
  readonly threshold: Threshold;
}
