import type { SirenPort } from '../domain/ports/out/SirenPort';

const TONE_HZ = 880;
const LOUDNESS = 0.25;
const RAMP_S = 0.02;

/** The warning tone, made rather than downloaded, so the app stays a single file. */
export class OscillatorSiren implements SirenPort {
  private oscillator: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  constructor(private readonly context: AudioContext) {}

  start(): void {
    if (this.oscillator) return;
    const gain = this.context.createGain();
    const oscillator = this.context.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.value = TONE_HZ;
    // Ramped, because a square wave that begins at full height clicks.
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(
      LOUDNESS,
      this.context.currentTime + RAMP_S,
    );
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    this.oscillator = oscillator;
    this.gain = gain;
  }

  stop(): void {
    const { oscillator, gain } = this;
    if (!oscillator || !gain) return;
    this.oscillator = null;
    this.gain = null;
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + RAMP_S);
    oscillator.stop(this.context.currentTime + RAMP_S * 2);
  }
}
