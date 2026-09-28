/** Keeps the screen awake. Nobody can watch a meter that switches itself off. */
export interface ScreenLockPort {
  /** Whether the screen will actually stay on: the browser may refuse, or not support it. */
  hold(): Promise<boolean>;
  release(): Promise<void>;
}
