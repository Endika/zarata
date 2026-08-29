/** A frame of samples in [-1, 1], as the microphone hands them over. */
export type SampleFrame = ArrayLike<number>;

export interface MicrophonePort {
  /** Opens the microphone and calls back on every frame until stopped. */
  listen(onFrame: (frame: SampleFrame) => void): Promise<void>;
  stop(): void;
}
