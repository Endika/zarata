import { SoundLevel } from './SoundLevel';

export const DEFAULT_COLUMNS = 300;
export const SMALLEST_BUCKET_MS = 100;

/**
 * The line of a whole session, from the moment it started until now.
 *
 * It never scrolls and never resets, which means it cannot simply keep every reading: an
 * hour at ten a second is thirty-six thousand of them. So it holds a fixed number of
 * columns, and when they run out it folds them together in pairs and each column comes to
 * stand for twice as long. Memory is bounded and the line always spans the whole session.
 *
 * A fold keeps the loudest of the two, never the average. The point of looking at this is to
 * find the bang, and an average is exactly what hides one.
 */
export class SessionTrail {
  private readonly levels: number[] = [];
  private bucketMs = SMALLEST_BUCKET_MS;
  private bucketStart: number | null = null;
  private bucketPeak: SoundLevel = SoundLevel.silence();

  constructor(private readonly columns: number = DEFAULT_COLUMNS) {}

  record(level: SoundLevel, at: number): void {
    if (this.bucketStart === null) {
      this.bucketStart = at;
      this.bucketPeak = level;
      return;
    }
    if (at - this.bucketStart < this.bucketMs) {
      this.bucketPeak = this.bucketPeak.louderOf(level);
      return;
    }
    this.closeBucket();
    this.bucketStart = at;
    this.bucketPeak = level;
  }

  private closeBucket(): void {
    this.levels.push(this.bucketPeak.db);
    if (this.levels.length > this.columns) this.fold();
  }

  /** Two columns become one, and every column comes to stand for twice as long. */
  private fold(): void {
    const folded: number[] = [];
    for (let i = 0; i < this.levels.length; i += 2) {
      const left = this.levels[i] ?? 0;
      const right = this.levels[i + 1];
      folded.push(right === undefined ? left : Math.max(left, right));
    }
    this.levels.length = 0;
    this.levels.push(...folded);
    this.bucketMs *= 2;
  }

  /** One value per column, oldest first, including the bucket still filling. */
  get points(): readonly number[] {
    return this.bucketStart === null
      ? [...this.levels]
      : [...this.levels, this.bucketPeak.db];
  }

  get peak(): SoundLevel {
    return this.points.reduce(
      (loudest, db) => loudest.louderOf(SoundLevel.of(db)),
      SoundLevel.silence(),
    );
  }

  /** How long each column stands for, which grows as the session does. */
  get resolutionMs(): number {
    return this.bucketMs;
  }

  get isEmpty(): boolean {
    return this.bucketStart === null;
  }
}
