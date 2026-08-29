import { describe, expect, it } from 'vitest';
import { fractionAtPointer } from '../gauge';

describe('the dial', () => {
  it('reads the left end as the quiet end', () => {
    expect(fractionAtPointer(32, 150)).toBeCloseTo(0, 2);
  });

  it('reads the right end as the loud end', () => {
    expect(fractionAtPointer(268, 150)).toBeCloseTo(1, 2);
  });

  it('reads the top as the middle', () => {
    expect(fractionAtPointer(150, 32)).toBeCloseTo(0.5, 2);
  });

  it('answers anywhere on the half-disc, not only on the arc itself', () => {
    expect(fractionAtPointer(150, 100)).toBeCloseTo(0.5, 2);
    expect(fractionAtPointer(150, 148)).toBeCloseTo(0.5, 1);
  });

  it('never leaves the dial when the thumb slides off it', () => {
    expect(fractionAtPointer(-500, 400)).toBe(0);
    expect(fractionAtPointer(900, 400)).toBe(1);
  });
});
