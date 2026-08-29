/** Keeps the screen awake. Nobody can watch a meter that switches itself off. */
export interface ScreenLockPort {
  hold(): Promise<void>;
  release(): Promise<void>;
}
