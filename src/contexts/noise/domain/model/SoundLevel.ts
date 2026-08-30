import { ValueObject } from '@shared-kernel/domain/ValueObject';

/** The ends of the dial: nothing at all, and a rock concert. */
export const QUIETEST_DB = 0;
export const LOUDEST_DB = 110;

/**
 * How far the microphone's full scale sits from the room's, in dB.
 *
 * A browser reports level against digital full scale, not against 20 µPa, and the gap
 * between the two belongs to the microphone of each phone. This is the offset that makes a
 * typical handset read something recognisable, and it is the reason every number this app
 * shows is an approximation rather than a measurement.
 */
export const FULL_SCALE_DB = 94;

const FLOOR_DBFS = -100;

/** A level, as the dial shows it: clamped to the scale, in approximate dB. */
export class SoundLevel extends ValueObject<{ db: number }> {
  private constructor(db: number) {
    super({ db });
  }

  /** Root mean square of a frame of samples in [-1, 1], as Web Audio hands them over. */
  static fromSamples(samples: ArrayLike<number>): SoundLevel {
    if (samples.length === 0) return SoundLevel.silence();
    let sum = 0;
    for (let i = 0; i < samples.length; i += 1) {
      const sample = samples[i] ?? 0;
      sum += sample * sample;
    }
    return SoundLevel.fromRms(Math.sqrt(sum / samples.length));
  }

  static fromRms(rms: number): SoundLevel {
    const dbfs = rms > 0 ? 20 * Math.log10(rms) : FLOOR_DBFS;
    return SoundLevel.of(dbfs + FULL_SCALE_DB);
  }

  static of(db: number): SoundLevel {
    return new SoundLevel(Math.min(LOUDEST_DB, Math.max(QUIETEST_DB, db)));
  }

  static silence(): SoundLevel {
    return new SoundLevel(QUIETEST_DB);
  }

  get db(): number {
    return this.props.db;
  }

  /** Where it sits on the dial, 0 at the quiet end and 1 at the loud one. */
  get fraction(): number {
    return (this.props.db - QUIETEST_DB) / (LOUDEST_DB - QUIETEST_DB);
  }

  isAtLeast(other: SoundLevel): boolean {
    return this.props.db >= other.db;
  }

  louderOf(other: SoundLevel): SoundLevel {
    return this.props.db >= other.db ? this : other;
  }
}
