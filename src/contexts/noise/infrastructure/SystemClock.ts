import type { ClockPort } from '../domain/ports/out/ClockPort';

export class SystemClock implements ClockPort {
  now(): number {
    return performance.now();
  }
}
