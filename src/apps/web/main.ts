import './styles.css';
import { MonitorNoiseUseCase } from '@contexts/noise/application/MonitorNoiseUseCase';
import { Threshold } from '@contexts/noise/domain/model/Threshold';
import type { Reading } from '@contexts/noise/domain/ports/in/MonitorNoisePort';
import { LocalStorageSettings } from '@contexts/noise/infrastructure/LocalStorageSettings';
import { OscillatorSiren } from '@contexts/noise/infrastructure/OscillatorSiren';
import { ScreenWakeLock } from '@contexts/noise/infrastructure/ScreenWakeLock';
import { SystemClock } from '@contexts/noise/infrastructure/SystemClock';
import { WebAudioMicrophone } from '@contexts/noise/infrastructure/WebAudioMicrophone';
import {
  drawLimit,
  drawLevel,
  gaugeElements,
  gaugeMarkup,
  pointerFraction,
} from './gauge';
import { drawTrail, trailElements, trailMarkup } from './trail';

const app = document.querySelector('#app') as HTMLElement;
app.innerHTML = `
  ${gaugeMarkup()}
  <p class="limit-label">Limit <b data-limit>--</b> dB &middot; drag it on the dial</p>
  <div class="panel">
    ${trailMarkup()}
    <div class="trail-facts"><span data-elapsed>0:00</span><span data-peak>1 min peak --</span></div>
  </div>
  <button type="button" data-listening="false">Start listening</button>
  <p class="note">Approximate. A phone is not a sound level meter. Nothing is recorded.</p>`;

const gauge = gaugeElements(app);
const trail = trailElements(app);
const limitLabel = app.querySelector('[data-limit]') as HTMLElement;
const elapsedLabel = app.querySelector('[data-elapsed]') as HTMLElement;
const peakLabel = app.querySelector('[data-peak]') as HTMLElement;
const button = app.querySelector('button') as HTMLButtonElement;

// One context for the microphone and the tone, created on the first tap: iOS will not
// let audio begin without a gesture, and two contexts would be one more than needed.
let context: AudioContext | null = null;
let monitor: MonitorNoiseUseCase | null = null;
let startedAt = 0;

const settings = new LocalStorageSettings();
const screen = new ScreenWakeLock();

const paint = (reading: Reading): void => {
  drawLevel(gauge, reading.level.fraction);
  drawLimit(gauge, reading.threshold.fraction);
  gauge.reading.textContent = String(Math.round(reading.level.db));
  limitLabel.textContent = String(reading.threshold.db);
  drawTrail(trail, reading.trail, reading.threshold.db);
  peakLabel.textContent = `1 min peak ${Math.round(reading.peak.db)}`;
  document.body.dataset['alarming'] = String(reading.alarming);
};

const monitorNow = (): MonitorNoiseUseCase => {
  if (monitor) return monitor;
  context ??= new AudioContext();
  monitor = new MonitorNoiseUseCase(
    new WebAudioMicrophone(context),
    new OscillatorSiren(context),
    screen,
    settings,
    new SystemClock(),
  );
  monitor.onReading(paint);
  return monitor;
};

const showElapsed = (): void => {
  if (!monitor?.isListening) return;
  const seconds = Math.floor((performance.now() - startedAt) / 1000);
  const minutes = Math.floor(seconds / 60);
  elapsedLabel.textContent = `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  requestAnimationFrame(showElapsed);
};

button.addEventListener('click', () => {
  const running = monitorNow();
  if (running.isListening) {
    void running.stop();
    button.textContent = 'Start listening';
    button.dataset['listening'] = 'false';
    document.body.dataset['alarming'] = 'false';
    return;
  }
  void context?.resume();
  void running.start().then(() => {
    startedAt = performance.now();
    button.textContent = 'Stop';
    button.dataset['listening'] = 'true';
    showElapsed();
  });
});

const drag = (event: PointerEvent): void => {
  const running = monitorNow();
  running.setThreshold(Threshold.atFraction(pointerFraction(gauge.svg, event)));
};

gauge.svg.addEventListener('pointerdown', (event) => {
  gauge.svg.setPointerCapture(event.pointerId);
  drag(event);
});
gauge.svg.addEventListener('pointermove', (event) => {
  if (event.buttons > 0) drag(event);
});

// First paint, before anything is listening, so the dial is not blank on arrival.
const initial = Threshold.of(settings.readThresholdDb() ?? 85);
drawLimit(gauge, initial.fraction);
drawLevel(gauge, 0);
drawTrail(trail, [], initial.db);
limitLabel.textContent = String(initial.db);
