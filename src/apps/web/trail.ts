import { DEFAULT_COLUMNS } from '@contexts/noise/domain/model/RecentTrail';
import {
  LOUDEST_DB,
  QUIETEST_DB,
} from '@contexts/noise/domain/model/SoundLevel';

const WIDTH = 300;
const HEIGHT = 90;
const STEP = WIDTH / (DEFAULT_COLUMNS - 1);

const y = (db: number): number => {
  const fraction = (db - QUIETEST_DB) / (LOUDEST_DB - QUIETEST_DB);
  return HEIGHT - fraction * HEIGHT;
};

export const trailMarkup = (): string => `
  <svg class="trail" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="none"
       role="img" aria-label="The last minute">
    <line class="trail-limit" x1="0" x2="${WIDTH}" y1="0" y2="0" />
    <polyline class="trail-line" points="" />
  </svg>`;

export interface TrailElements {
  readonly line: SVGPolylineElement;
  readonly limit: SVGLineElement;
}

export const trailElements = (root: ParentNode): TrailElements => ({
  line: root.querySelector('.trail-line') as SVGPolylineElement,
  limit: root.querySelector('.trail-limit') as SVGLineElement,
});

/**
 * The last minute, with now on the right.
 *
 * Every column is the same width, so the line enters at the right edge, grows leftwards
 * until it fills the panel and then scrolls. Stretching it to the full width instead would
 * mean a line that changes shape without the noise changing at all.
 */
export const drawTrail = (
  elements: TrailElements,
  points: readonly number[],
  limitDb: number,
): void => {
  const newest = points.length - 1;
  elements.line.setAttribute(
    'points',
    points.map((db, i) => `${WIDTH - (newest - i) * STEP},${y(db)}`).join(' '),
  );
  const limitY = String(y(limitDb));
  elements.limit.setAttribute('y1', limitY);
  elements.limit.setAttribute('y2', limitY);
};
