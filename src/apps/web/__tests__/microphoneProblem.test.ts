import { describe, expect, it } from 'vitest';
import { microphoneProblem } from '../microphoneProblem';

const thrown = (name: string): DOMException => new DOMException('', name);

describe('what a refused microphone says', () => {
  it('asks for permission when access was denied', () => {
    expect(microphoneProblem(thrown('NotAllowedError'))).toContain('blocked');
  });

  it('says so when there is no microphone at all', () => {
    expect(microphoneProblem(thrown('NotFoundError'))).toContain(
      'No microphone',
    );
  });

  it('points at the other app when the microphone is busy', () => {
    expect(microphoneProblem(thrown('NotReadableError'))).toContain(
      'another app',
    );
  });

  it('still says something for anything else, such as no mediaDevices over plain http', () => {
    expect(microphoneProblem(new TypeError('undefined'))).toContain(
      'could not be opened',
    );
    expect(microphoneProblem('nonsense')).toContain('could not be opened');
  });
});
