import { ValueObject } from '@shared-kernel/domain/ValueObject';
import type { SoundLevel } from './SoundLevel';
import { LOUDEST_DB, QUIETEST_DB } from './SoundLevel';

/** How far the noise must fall below the limit before the alarm will fire again. */
export const REARM_MARGIN_DB = 3;

/** The line you drag onto the dial. */
export class Threshold extends ValueObject<{ db: number }> {
  private constructor(db: number) {
    super({ db });
  }

  static of(db: number): Threshold {
    return new Threshold(
      Math.round(Math.min(LOUDEST_DB, Math.max(QUIETEST_DB, db))),
    );
  }

  /** From a position on the dial, 0 at the quiet end and 1 at the loud one. */
  static atFraction(fraction: number): Threshold {
    const span = LOUDEST_DB - QUIETEST_DB;
    return Threshold.of(QUIETEST_DB + fraction * span);
  }

  get db(): number {
    return this.props.db;
  }

  get fraction(): number {
    return (this.props.db - QUIETEST_DB) / (LOUDEST_DB - QUIETEST_DB);
  }

  isCrossedBy(level: SoundLevel): boolean {
    return level.db >= this.props.db;
  }

  /** Quiet enough that the alarm is worth arming again. */
  isClearedBy(level: SoundLevel): boolean {
    return level.db < this.props.db - REARM_MARGIN_DB;
  }
}
