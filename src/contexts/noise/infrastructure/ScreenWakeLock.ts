import type { ScreenLockPort } from '../domain/ports/out/ScreenLockPort';

/**
 * Keeps the screen on while the meter runs.
 *
 * The lock is dropped by the browser whenever the tab goes to the background, and is not
 * given back on return — so it is taken again when the page becomes visible, as long as we
 * are still meant to be holding it.
 */
export class ScreenWakeLock implements ScreenLockPort {
  private sentinel: WakeLockSentinel | null = null;
  private wanted = false;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (this.wanted && document.visibilityState === 'visible') {
        void this.request();
      }
    });
  }

  async hold(): Promise<void> {
    this.wanted = true;
    await this.request();
  }

  async release(): Promise<void> {
    this.wanted = false;
    await this.sentinel?.release();
    this.sentinel = null;
  }

  private async request(): Promise<void> {
    if (!('wakeLock' in navigator)) return;
    try {
      this.sentinel = await navigator.wakeLock.request('screen');
    } catch {
      // Denied by the browser — low battery, or a policy. The meter still works; the
      // screen will simply dim as it normally would, and saying so is the UI's job.
      this.sentinel = null;
    }
  }

  get isHeld(): boolean {
    return this.sentinel !== null;
  }
}
