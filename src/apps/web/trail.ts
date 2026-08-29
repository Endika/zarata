import {
  LOUDEST_DB,
  QUIETEST_DB,
} from '@contexts/noise/domain/model/SoundLevel';

const WIDTH = 300;
const HEIGHT = 90;

const y = (db: number): number => {
  const fraction = (db - QUIETEST_DB) / (LOUDEST_DB - QUIETEST_DB);
  return HEIGHT - fraction * HEIGHT;
};

export const trailMarkup = (): string => `
  <svg class="trail" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="none"
       role="img" aria-label="This session">
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

/** The session so far, stretched across the full width however long it has run. */
export const drawTrail = (
  elements: TrailElements,
  points: readonly number[],
  limitDb: number,
): void => {
  const step = points.length > 1 ? WIDTH / (points.length - 1) : WIDTH;
  elements.line.setAttribute(
    'points',
    points.map((db, i) => `${i * step},${y(db)}`).join(' '),
  );
  const limitY = String(y(limitDb));
  elements.limit.setAttribute('y1', limitY);
  elements.limit.setAttribute('y2', limitY);
};
