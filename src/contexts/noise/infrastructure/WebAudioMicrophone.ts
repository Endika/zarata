import type {
  MicrophonePort,
  SampleFrame,
} from '../domain/ports/out/MicrophonePort';

const FRAMES_PER_SECOND = 10;
const FFT_SIZE = 2048;

/**
 * The phone's microphone, with the browser's helpfulness switched off.
 *
 * Automatic gain, noise suppression and echo cancellation exist to make a voice carry on a
 * call. They rescale and gate exactly what a meter is trying to measure, so a level read
 * through them is not a level at all.
 */
export class WebAudioMicrophone implements MicrophonePort {
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly context: AudioContext) {}

  async listen(onFrame: (frame: SampleFrame) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: false,
        noiseSuppression: false,
        echoCancellation: false,
      },
      video: false,
    });
    this.source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.source.connect(this.analyser);

    const samples = new Float32Array(this.analyser.fftSize);
    this.timer = setInterval(() => {
      this.analyser?.getFloatTimeDomainData(samples);
      onFrame(samples);
    }, 1000 / FRAMES_PER_SECOND);
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.source?.disconnect();
    this.source = null;
    this.analyser = null;
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = null;
  }
}
