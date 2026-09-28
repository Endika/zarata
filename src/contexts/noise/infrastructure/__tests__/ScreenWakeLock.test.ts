import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ScreenWakeLock } from '../ScreenWakeLock';

class FakeSentinel extends EventTarget {
  released = false;
  readonly type = 'screen';

  release(): Promise<void> {
    if (!this.released) {
      this.released = true;
      this.dispatchEvent(new Event('release'));
    }
    return Promise.resolve();
  }
}

class FakeWakeLock {
  readonly granted: FakeSentinel[] = [];
  private held: (() => void) | null = null;
  holdNext = false;

  request(): Promise<FakeSentinel> {
    const sentinel = new FakeSentinel();
    this.granted.push(sentinel);
    if (!this.holdNext) return Promise.resolve(sentinel);
    this.holdNext = false;
    return new Promise((resolve) => {
      this.held = () => resolve(sentinel);
    });
  }

  nth(index: number): FakeSentinel {
    const sentinel = this.granted[index];
    if (!sentinel) throw new Error(`no sentinel #${index}`);
    return sentinel;
  }

  grantHeld(): void {
    this.held?.();
    this.held = null;
  }
}

let visibility: DocumentVisibilityState = 'visible';

const setVisibility = (state: DocumentVisibilityState): void => {
  visibility = state;
  document.dispatchEvent(new Event('visibilitychange'));
};

const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const withWakeLock = (wakeLock: FakeWakeLock | undefined): void => {
  if (wakeLock) {
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: wakeLock,
    });
  } else {
    Reflect.deleteProperty(navigator, 'wakeLock');
  }
};

describe('keeping the screen on', () => {
  let wakeLock: FakeWakeLock;
  // Each instance listens on the shared document for good, so none may stay wanted.
  const created: ScreenWakeLock[] = [];
  const screenLock = (): ScreenWakeLock => {
    const lock = new ScreenWakeLock();
    created.push(lock);
    return lock;
  };

  beforeEach(() => {
    wakeLock = new FakeWakeLock();
    withWakeLock(wakeLock);
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
  });

  afterEach(async () => {
    await Promise.all(created.splice(0).map((lock) => lock.release()));
    withWakeLock(undefined);
    Reflect.deleteProperty(document, 'visibilityState');
  });

  it('takes the lock when asked to hold it', async () => {
    const lock = screenLock();

    expect(await lock.hold()).toBe(true);
    expect(lock.isHeld).toBe(true);
    expect(wakeLock.granted).toHaveLength(1);
  });

  it('stops claiming the lock once the browser drops it', async () => {
    const lock = screenLock();
    await lock.hold();

    setVisibility('hidden');
    await wakeLock.nth(0).release();

    expect(lock.isHeld).toBe(false);
  });

  it('takes it again when the page comes back while still wanted', async () => {
    const lock = screenLock();
    await lock.hold();
    setVisibility('hidden');
    await wakeLock.nth(0).release();

    setVisibility('visible');
    await settle();

    expect(lock.isHeld).toBe(true);
    expect(wakeLock.granted).toHaveLength(2);
  });

  it('does not ask twice while it already holds the lock', async () => {
    const lock = screenLock();
    await lock.hold();

    setVisibility('visible');
    await lock.hold();
    await settle();

    expect(wakeLock.granted).toHaveLength(1);
    expect(wakeLock.nth(0).released).toBe(false);
  });

  it('gives back a lock granted after it was released', async () => {
    const lock = screenLock();
    await lock.hold();
    await lock.release();
    await lock.hold();
    setVisibility('hidden');
    await wakeLock.nth(1).release();

    wakeLock.holdNext = true;
    setVisibility('visible');
    await lock.release();
    wakeLock.grantHeld();
    await settle();

    expect(lock.isHeld).toBe(false);
    expect(wakeLock.granted).toHaveLength(3);
    expect(wakeLock.nth(2).released).toBe(true);
  });

  it('does not take the lock on return when it is no longer wanted', async () => {
    const lock = screenLock();
    await lock.hold();
    await lock.release();

    setVisibility('hidden');
    setVisibility('visible');
    await settle();

    expect(lock.isHeld).toBe(false);
    expect(wakeLock.granted).toHaveLength(1);
  });

  it('reports that it could not hold the lock when the browser has none', async () => {
    withWakeLock(undefined);
    const lock = screenLock();

    expect(await lock.hold()).toBe(false);
    expect(lock.isHeld).toBe(false);
  });
});
