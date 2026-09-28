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
  private pending: Promise<void> | null = null;
  private wanted = false;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (this.wanted && document.visibilityState === 'visible') {
        void this.request();
      }
    });
  }

  async hold(): Promise<boolean> {
    this.wanted = true;
    await this.request();
    return this.isHeld;
  }

  async release(): Promise<void> {
    this.wanted = false;
    const sentinel = this.sentinel;
    this.sentinel = null;
    await sentinel?.release();
  }

  private request(): Promise<void> {
    if (this.isHeld) return Promise.resolve();
    this.pending ??= this.acquire().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  private async acquire(): Promise<void> {
    if (!('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel;
    try {
      sentinel = await navigator.wakeLock.request('screen');
    } catch {
      // Denied by the browser — low battery, or a policy. The meter still works; the
      // screen will simply dim as it normally would, and hold() tells the UI so.
      return;
    }
    // release() was called while the browser was still granting it.
    if (!this.wanted) {
      void sentinel.release();
      return;
    }
    sentinel.addEventListener('release', () => {
      if (this.sentinel === sentinel) this.sentinel = null;
    });
    this.sentinel = sentinel;
  }

  get isHeld(): boolean {
    return this.sentinel !== null;
  }
}
