import { SoundLevel } from './SoundLevel';

export const DEFAULT_COLUMNS = 300;
export const BUCKET_MS = 200;

/** How far back the line reaches: three hundred columns of a fifth of a second. */
export const WINDOW_MS = DEFAULT_COLUMNS * BUCKET_MS;

/**
 * The line of the last minute, and only that.
 *
 * Every column stands for the same slice of time however long the session runs, so the line
 * keeps moving at a steady pace: a new column enters on the right and the oldest falls off
 * the left. An hour of listening costs no more memory, and no less detail, than a minute.
 *
 * A column keeps the loudest of its slice, never the average. The point of looking at this
 * is to find the bang, and an average is exactly what hides one.
 */
export class RecentTrail {
  private readonly levels: number[] = [];
  private bucketStart: number | null = null;
  private bucketPeak: SoundLevel = SoundLevel.silence();

  constructor(private readonly columns: number = DEFAULT_COLUMNS) {}

  record(level: SoundLevel, at: number): void {
    if (this.bucketStart === null) {
      this.bucketStart = at;
      this.bucketPeak = level;
      return;
    }
    if (at - this.bucketStart < BUCKET_MS) {
      this.bucketPeak = this.bucketPeak.louderOf(level);
      return;
    }
    this.closeBucket();
    this.bucketStart = at;
    this.bucketPeak = level;
  }

  private closeBucket(): void {
    this.levels.push(this.bucketPeak.db);
    // One short of the width: the bucket still filling is the column on the right.
    if (this.levels.length >= this.columns) this.levels.shift();
  }

  /** One value per column, oldest first, including the bucket still filling. */
  get points(): readonly number[] {
    return this.bucketStart === null
      ? [...this.levels]
      : [...this.levels, this.bucketPeak.db];
  }

  /** The loudest of the window, which fades as the noise that made it scrolls off. */
  get peak(): SoundLevel {
    return this.points.reduce(
      (loudest, db) => loudest.louderOf(SoundLevel.of(db)),
      SoundLevel.silence(),
    );
  }

  /** How much of the past the line shows once it has filled. */
  get spanMs(): number {
    return this.columns * BUCKET_MS;
  }

  get isEmpty(): boolean {
    return this.bucketStart === null;
  }
}
