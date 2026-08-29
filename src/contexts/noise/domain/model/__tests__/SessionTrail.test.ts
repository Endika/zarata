import { describe, expect, it } from 'vitest';
import { SessionTrail, SMALLEST_BUCKET_MS } from '../SessionTrail';
import { SoundLevel } from '../SoundLevel';

const feed = (
  trail: SessionTrail,
  count: number,
  db: (i: number) => number,
) => {
  for (let i = 0; i < count; i += 1) {
    trail.record(SoundLevel.of(db(i)), i * SMALLEST_BUCKET_MS);
  }
};

describe('SessionTrail', () => {
  it('starts empty', () => {
    expect(new SessionTrail().isEmpty).toBe(true);
    expect(new SessionTrail().points).toEqual([]);
  });

  it('draws one column per bucket of time', () => {
    const trail = new SessionTrail(10);
    feed(trail, 5, () => 60);

    expect(trail.points).toHaveLength(5);
  });

  it('never grows past its width, however long the session runs', () => {
    const trail = new SessionTrail(300);
    feed(trail, 40_000, () => 60); // over an hour at ten a second

    expect(trail.points.length).toBeLessThanOrEqual(301);
  });

  it('stretches each column over more time instead of forgetting the start', () => {
    const trail = new SessionTrail(100);
    feed(trail, 1000, () => 60);

    expect(trail.resolutionMs).toBeGreaterThan(SMALLEST_BUCKET_MS);
  });

  it('keeps a bang through every fold', () => {
    const trail = new SessionTrail(50);
    feed(trail, 4000, (i) => (i === 7 ? 104 : 45));

    expect(trail.peak.db).toBe(104);
  });

  it('keeps the loudest of a bucket, not its average', () => {
    const trail = new SessionTrail(10);
    trail.record(SoundLevel.of(40), 0);
    trail.record(SoundLevel.of(100), 10);
    trail.record(SoundLevel.of(40), 20);
    trail.record(SoundLevel.of(40), SMALLEST_BUCKET_MS);

    expect(trail.points[0]).toBe(100);
  });

  it('shows the bucket still filling, so the line reaches now', () => {
    const trail = new SessionTrail(10);
    trail.record(SoundLevel.of(70), 0);

    expect(trail.points).toEqual([70]);
  });
});
