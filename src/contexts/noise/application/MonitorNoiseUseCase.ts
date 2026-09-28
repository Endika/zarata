import { Alarm } from '../domain/model/Alarm';
import { RecentTrail } from '../domain/model/RecentTrail';
import { SoundLevel } from '../domain/model/SoundLevel';
import { Threshold } from '../domain/model/Threshold';
import type {
  MonitorNoisePort,
  Reading,
} from '../domain/ports/in/MonitorNoisePort';
import type { ClockPort } from '../domain/ports/out/ClockPort';
import type {
  MicrophonePort,
  SampleFrame,
} from '../domain/ports/out/MicrophonePort';
import type { ScreenLockPort } from '../domain/ports/out/ScreenLockPort';
import type { SettingsPort } from '../domain/ports/out/SettingsPort';
import type { SirenPort } from '../domain/ports/out/SirenPort';

const DEFAULT_THRESHOLD_DB = 85;

/** Listening: the microphone drives it, and everything else follows one frame at a time. */
export class MonitorNoiseUseCase implements MonitorNoisePort {
  private trail = new RecentTrail();
  private alarm = Alarm.silent();
  private limit: Threshold;
  private listening = false;
  private screenOn = false;
  private listeners: ((reading: Reading) => void)[] = [];

  constructor(
    private readonly microphone: MicrophonePort,
    private readonly siren: SirenPort,
    private readonly screen: ScreenLockPort,
    private readonly settings: SettingsPort,
    private readonly clock: ClockPort,
  ) {
    const stored = settings.readThresholdDb();
    this.limit = Threshold.of(stored ?? DEFAULT_THRESHOLD_DB);
  }

  get isListening(): boolean {
    return this.listening;
  }

  get keepsScreenOn(): boolean {
    return this.screenOn;
  }

  get threshold(): Threshold {
    return this.limit;
  }

  onReading(listener: (reading: Reading) => void): void {
    this.listeners.push(listener);
  }

  setThreshold(threshold: Threshold): void {
    this.limit = threshold;
    this.settings.writeThresholdDb(threshold.db);
    this.publish(SoundLevel.silence());
  }

  async start(): Promise<void> {
    if (this.listening) return;
    this.trail = new RecentTrail();
    this.alarm = Alarm.silent();
    this.listening = true;
    try {
      await this.microphone.listen((frame) => {
        this.consume(frame);
      });
    } catch (error) {
      this.listening = false;
      this.microphone.stop();
      throw error;
    }
    this.screenOn = await this.screen.hold();
  }

  async stop(): Promise<void> {
    if (!this.listening) return;
    this.listening = false;
    this.microphone.stop();
    this.siren.stop();
    this.screenOn = false;
    await this.screen.release();
  }

  private consume(frame: SampleFrame): void {
    if (!this.listening) return;
    const now = this.clock.now();
    const level = SoundLevel.fromSamples(frame);
    this.trail.record(level, now);

    const seen = this.alarm.observe(level, this.limit, now);
    this.alarm = seen.alarm;
    if (seen.change === 'started') this.siren.start();
    if (seen.change === 'stopped') this.siren.stop();

    this.publish(level);
  }

  private publish(level: SoundLevel): void {
    const reading: Reading = {
      level,
      threshold: this.limit,
      trail: this.trail.points,
      peak: this.trail.peak,
      alarming: this.alarm.isSounding,
    };
    for (const listener of this.listeners) listener(reading);
  }
}
