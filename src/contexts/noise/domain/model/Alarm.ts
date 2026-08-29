import type { SoundLevel } from './SoundLevel';
import type { Threshold } from './Threshold';

/** How long one warning lasts. */
export const BEEP_MS = 400;

/**
 * How long the meter's opinion is ignored after a beep.
 *
 * The phone hears its own beep. Without this the alarm holds the level above the limit by
 * itself and never stops — it would beep once and then for ever.
 */
export const DEAF_MS = 250;

export type AlarmChange = 'started' | 'stopped' | 'unchanged';

type Phase = 'armed' | 'sounding' | 'deaf' | 'waiting';

/**
 * When to warn, and — harder — when to shut up.
 *
 * Armed, it fires the moment the limit is crossed. It then sounds for a fixed spell, spends
 * a moment deaf to its own noise, and will not fire again until the room has dropped clearly
 * below the limit. That last part is what stops it stuttering when the noise sits exactly on
 * the line.
 */
export class Alarm {
  private constructor(
    private readonly phase: Phase,
    private readonly until: number,
  ) {}

  static silent(): Alarm {
    return new Alarm('armed', 0);
  }

  get isSounding(): boolean {
    return this.phase === 'sounding';
  }

  observe(
    level: SoundLevel,
    threshold: Threshold,
    now: number,
  ): { alarm: Alarm; change: AlarmChange } {
    switch (this.phase) {
      case 'armed':
        return threshold.isCrossedBy(level)
          ? { alarm: new Alarm('sounding', now + BEEP_MS), change: 'started' }
          : { alarm: this, change: 'unchanged' };
      case 'sounding':
        return now >= this.until
          ? { alarm: new Alarm('deaf', now + DEAF_MS), change: 'stopped' }
          : { alarm: this, change: 'unchanged' };
      case 'deaf':
        return now >= this.until
          ? { alarm: new Alarm('waiting', 0), change: 'unchanged' }
          : { alarm: this, change: 'unchanged' };
      case 'waiting':
        return threshold.isClearedBy(level)
          ? { alarm: Alarm.silent(), change: 'unchanged' }
          : { alarm: this, change: 'unchanged' };
    }
  }
}
