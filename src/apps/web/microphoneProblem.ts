/** What to tell someone whose microphone would not open, from what the browser threw. */
export const microphoneProblem = (error: unknown): string => {
  const name = error instanceof Error ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Microphone access is blocked. Allow it for this site in your browser settings, then try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No microphone was found on this device.';
    case 'NotReadableError':
      return 'The microphone is in use by another app. Close it and try again.';
    default:
      return 'The microphone could not be opened. Try again, or reload the page.';
  }
};
