import { describe, expect, it } from 'vitest';
import { BUCKET_MS, RecentTrail } from '../RecentTrail';
import { SoundLevel } from '../SoundLevel';

const feed = (
  trail: RecentTrail,
  count: number,
  db: (i: number) => number,
  from = 0,
) => {
  for (let i = 0; i < count; i += 1) {
    trail.record(SoundLevel.of(db(i)), (from + i) * BUCKET_MS);
  }
};

describe('RecentTrail', () => {
  it('starts empty', () => {
    expect(new RecentTrail().isEmpty).toBe(true);
    expect(new RecentTrail().points).toEqual([]);
  });

  it('draws one column per bucket of time', () => {
    const trail = new RecentTrail(10);
    feed(trail, 5, () => 60);

    expect(trail.points).toHaveLength(5);
  });

  it('never grows past its width, however long the session runs', () => {
    const trail = new RecentTrail(300);
    feed(trail, 40_000, () => 60); // over two hours at a column every fifth of a second

    expect(trail.points).toHaveLength(300);
  });

  it('lets the oldest fall off the left rather than squeezing the session in', () => {
    const trail = new RecentTrail(10);
    feed(trail, 1, () => 104);
    feed(trail, 100, () => 45, 1);

    expect(trail.points).toHaveLength(10);
    expect(trail.points).not.toContain(104);
  });

  it('drops a bang from the peak once it has scrolled out of the window', () => {
    const trail = new RecentTrail(10);
    feed(trail, 1, () => 104);
    feed(trail, 5, () => 45, 1);

    expect(trail.peak.db).toBe(104);

    feed(trail, 20, () => 45, 6);

    expect(trail.peak.db).toBe(45);
  });

  it('keeps the loudest of a bucket, not its average', () => {
    const trail = new RecentTrail(10);
    trail.record(SoundLevel.of(40), 0);
    trail.record(SoundLevel.of(100), 10);
    trail.record(SoundLevel.of(40), 20);
    trail.record(SoundLevel.of(40), BUCKET_MS);

    expect(trail.points[0]).toBe(100);
  });

  it('shows the bucket still filling, so the line reaches now', () => {
    const trail = new RecentTrail(10);
    trail.record(SoundLevel.of(70), 0);

    expect(trail.points).toEqual([70]);
  });
});
