import { describe, expect, it } from 'vitest';
import {
  FULL_SCALE_DB,
  LOUDEST_DB,
  QUIETEST_DB,
  SoundLevel,
} from '../SoundLevel';

describe('SoundLevel', () => {
  it('reads silence at the bottom of the dial', () => {
    expect(SoundLevel.fromSamples(new Float32Array(128)).db).toBe(QUIETEST_DB);
  });

  it('never leaves the dial, however loud the input claims to be', () => {
    expect(SoundLevel.fromRms(1000).db).toBe(LOUDEST_DB);
    expect(SoundLevel.fromRms(0.0000001).db).toBe(QUIETEST_DB);
  });

  it('reads digital full scale as one pascal, the calibration convention', () => {
    expect(SoundLevel.fromRms(1).db).toBe(FULL_SCALE_DB);
  });

  it('leaves headroom above full scale, so a clipping room stays on the dial', () => {
    expect(FULL_SCALE_DB).toBeLessThan(LOUDEST_DB);
  });

  it('halving the pressure drops it by about six dB', () => {
    const loud = SoundLevel.fromRms(0.02).db;
    const half = SoundLevel.fromRms(0.01).db;

    expect(loud - half).toBeCloseTo(6, 1);
  });

  it('measures the whole frame, not its loudest sample', () => {
    const spike = new Float32Array(100);
    spike[0] = 1;

    expect(SoundLevel.fromSamples(spike).db).toBeLessThan(
      SoundLevel.fromRms(1).db,
    );
  });

  it('places itself on the dial as a fraction', () => {
    expect(SoundLevel.of(QUIETEST_DB).fraction).toBe(0);
    expect(SoundLevel.of(LOUDEST_DB).fraction).toBe(1);
    const halfway = (QUIETEST_DB + LOUDEST_DB) / 2;
    expect(SoundLevel.of(halfway).fraction).toBeCloseTo(0.5, 1);
  });

  it('keeps the louder of two', () => {
    expect(SoundLevel.of(80).louderOf(SoundLevel.of(60)).db).toBe(80);
    expect(SoundLevel.of(60).louderOf(SoundLevel.of(80)).db).toBe(80);
  });
});
