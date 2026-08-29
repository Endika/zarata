import { beforeEach, describe, expect, it } from 'vitest';
import { BEEP_MS } from '../../domain/model/Alarm';
import { Threshold } from '../../domain/model/Threshold';
import type { Reading } from '../../domain/ports/in/MonitorNoisePort';
import type { SampleFrame } from '../../domain/ports/out/MicrophonePort';
import { MonitorNoiseUseCase } from '../MonitorNoiseUseCase';

class FakeMicrophone {
  private onFrame: ((frame: SampleFrame) => void) | null = null;
  open = false;

  async listen(onFrame: (frame: SampleFrame) => void): Promise<void> {
    this.onFrame = onFrame;
    this.open = true;
  }

  stop(): void {
    this.open = false;
    this.onFrame = null;
  }

  /** A frame whose root mean square is `rms`, which is all the domain looks at. */
  hear(rms: number): void {
    this.onFrame?.(new Float32Array(64).fill(rms));
  }
}

class FakeSiren {
  sounding = false;
  starts = 0;
  start(): void {
    this.sounding = true;
    this.starts += 1;
  }
  stop(): void {
    this.sounding = false;
  }
}

class FakeScreen {
  held = false;
  async hold(): Promise<void> {
    this.held = true;
  }
  async release(): Promise<void> {
    this.held = false;
  }
}

class FakeSettings {
  constructor(private db: number | null = null) {}
  readThresholdDb(): number | null {
    return this.db;
  }
  writeThresholdDb(db: number): void {
    this.db = db;
  }
}

class FakeClock {
  ms = 0;
  now(): number {
    return this.ms;
  }
}

describe('MonitorNoiseUseCase', () => {
  let microphone: FakeMicrophone;
  let siren: FakeSiren;
  let screen: FakeScreen;
  let settings: FakeSettings;
  let clock: FakeClock;
  let monitor: MonitorNoiseUseCase;
  let seen: Reading[];

  beforeEach(() => {
    microphone = new FakeMicrophone();
    siren = new FakeSiren();
    screen = new FakeScreen();
    settings = new FakeSettings();
    clock = new FakeClock();
    monitor = new MonitorNoiseUseCase(
      microphone,
      siren,
      screen,
      settings,
      clock,
    );
    seen = [];
    monitor.onReading((reading) => seen.push(reading));
  });

  it('holds the screen awake while it listens, and lets go when it stops', async () => {
    await monitor.start();
    expect(screen.held).toBe(true);
    expect(microphone.open).toBe(true);

    await monitor.stop();
    expect(screen.held).toBe(false);
    expect(microphone.open).toBe(false);
  });

  it('sounds the siren when the room crosses the limit', async () => {
    monitor.setThreshold(Threshold.of(60));
    await monitor.start();

    microphone.hear(0.5);

    expect(siren.sounding).toBe(true);
  });

  it('leaves the siren alone below the limit', async () => {
    monitor.setThreshold(Threshold.of(100));
    await monitor.start();

    microphone.hear(0.01);

    expect(siren.sounding).toBe(false);
  });

  it('silences the siren without being asked twice', async () => {
    monitor.setThreshold(Threshold.of(60));
    await monitor.start();
    microphone.hear(0.5);

    clock.ms = BEEP_MS;
    microphone.hear(0.5);

    expect(siren.sounding).toBe(false);
  });

  it('remembers the limit for next time', () => {
    monitor.setThreshold(Threshold.of(72));

    const later = new MonitorNoiseUseCase(
      microphone,
      siren,
      screen,
      settings,
      clock,
    );

    expect(later.threshold.db).toBe(72);
  });

  it('starts a fresh line on every session', async () => {
    await monitor.start();
    microphone.hear(0.5);
    await monitor.stop();

    await monitor.start();

    expect(monitor.isListening).toBe(true);
    seen = [];
    microphone.hear(0.001);
    expect(seen.at(-1)?.trail).toHaveLength(1);
  });

  it('says nothing once stopped, whatever the microphone does', async () => {
    await monitor.start();
    await monitor.stop();
    seen = [];

    microphone.hear(0.5);

    expect(seen).toEqual([]);
    expect(siren.sounding).toBe(false);
  });
});
