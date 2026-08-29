import { describe, expect, it } from 'vitest';
import { Alarm, BEEP_MS, DEAF_MS } from '../Alarm';
import { SoundLevel } from '../SoundLevel';
import { REARM_MARGIN_DB, Threshold } from '../Threshold';

const LIMIT = Threshold.of(85);
const loud = SoundLevel.of(90);
const quiet = SoundLevel.of(60);
const onTheLine = SoundLevel.of(85);

describe('Alarm', () => {
  it('fires when the limit is crossed', () => {
    const { alarm, change } = Alarm.silent().observe(loud, LIMIT, 0);

    expect(change).toBe('started');
    expect(alarm.isSounding).toBe(true);
  });

  it('stays quiet below the limit', () => {
    expect(Alarm.silent().observe(quiet, LIMIT, 0).change).toBe('unchanged');
  });

  it('fires exactly on the line, not one dB above it', () => {
    expect(Alarm.silent().observe(onTheLine, LIMIT, 0).change).toBe('started');
  });

  it('stops on its own after one beep', () => {
    const started = Alarm.silent().observe(loud, LIMIT, 0).alarm;

    expect(started.observe(loud, LIMIT, BEEP_MS - 1).change).toBe('unchanged');
    const ended = started.observe(loud, LIMIT, BEEP_MS);
    expect(ended.change).toBe('stopped');
    expect(ended.alarm.isSounding).toBe(false);
  });

  it('does not hear its own beep as a reason to fire again', () => {
    let alarm = Alarm.silent().observe(loud, LIMIT, 0).alarm;
    alarm = alarm.observe(loud, LIMIT, BEEP_MS).alarm;

    // Still loud — because the phone is listening to the tail of its own warning.
    const during = alarm.observe(loud, LIMIT, BEEP_MS + DEAF_MS - 1);

    expect(during.change).toBe('unchanged');
    expect(during.alarm.isSounding).toBe(false);
  });

  it('will not fire again until the room has clearly dropped', () => {
    let alarm = Alarm.silent().observe(loud, LIMIT, 0).alarm;
    alarm = alarm.observe(loud, LIMIT, BEEP_MS).alarm;
    alarm = alarm.observe(loud, LIMIT, BEEP_MS + DEAF_MS).alarm;

    const stillLoud = alarm.observe(loud, LIMIT, 2000);
    expect(stillLoud.change).toBe('unchanged');

    const barelyBelow = SoundLevel.of(LIMIT.db - REARM_MARGIN_DB + 1);
    expect(
      alarm.observe(barelyBelow, LIMIT, 2000).alarm.observe(loud, LIMIT, 2100)
        .change,
    ).toBe('unchanged');
  });

  it('fires again once the room is quiet and gets loud once more', () => {
    let alarm = Alarm.silent().observe(loud, LIMIT, 0).alarm;
    alarm = alarm.observe(loud, LIMIT, BEEP_MS).alarm;
    alarm = alarm.observe(loud, LIMIT, BEEP_MS + DEAF_MS).alarm;
    alarm = alarm.observe(quiet, LIMIT, 2000).alarm;

    expect(alarm.observe(loud, LIMIT, 3000).change).toBe('started');
  });

  it('does not stutter when the noise sits on the line', () => {
    let alarm = Alarm.silent();
    let beeps = 0;
    for (let now = 0; now < 5000; now += 100) {
      const wobble = SoundLevel.of(LIMIT.db + (now % 200 === 0 ? 1 : -1));
      const seen = alarm.observe(wobble, LIMIT, now);
      alarm = seen.alarm;
      if (seen.change === 'started') beeps += 1;
    }

    expect(beeps).toBe(1);
  });
});
