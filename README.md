# zarata

[![CI](https://github.com/Endika/zarata/actions/workflows/ci.yml/badge.svg)](https://github.com/Endika/zarata/actions/workflows/ci.yml)
[![Licence](https://img.shields.io/badge/licence-MIT-yellow)](LICENSE)

A sound level meter that lives in your phone. Watch the noise, drag a limit onto the dial,
and it beeps when the room crosses it. The screen stays awake while it listens.

_Zarata_ is Basque for noise.

## What it does

- **One screen.** A semicircular meter, the level in the middle, the last minute below.
- **Drag the limit.** Put the red mark anywhere on the dial with your thumb. It is remembered.
- **It beeps when crossed** — and stops when the noise drops back, without chattering at the
  edge.
- **The last minute, always moving.** The line enters on the right and the oldest column
  falls off the left, so it goes at the same pace after an hour as after ten seconds. Each
  column keeps the peak of its slice rather than the average — a bang matters more.
- **The screen stays on** while it is listening, and lets go when you stop.
- **The version is at the bottom.** An installed PWA can serve yesterday's build from its
  cache, and this says which one you are looking at.

Nothing is recorded, nothing is uploaded, and there is no account. The sound never leaves the
phone.

## What the number means

A browser cannot measure real sound pressure. It gives a level relative to digital full scale,
and turning that into dB SPL depends on the microphone of each phone. **The scale here is an
approximation** — good enough to tell a quiet room from a loud one and to put a limit where it
bothers you, and not good enough for anything anyone would certify.

The browser's automatic gain control, noise suppression and echo cancellation are switched off:
they exist to make you sound good on a call, and they ruin a measurement.

## Development

```
npm install
npm run dev
npm run test:run
npm run build
```

Hexagonal, one bounded context. `domain` holds the rules and knows nothing else, `application`
orchestrates them, `infrastructure` speaks to the microphone, the speaker, the screen and
storage, and `apps/web` draws. The domain is the part with tests; the adapters are thin on
purpose.

## Licence

MIT
