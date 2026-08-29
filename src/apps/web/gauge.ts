const CX = 150;
const CY = 150;
const R = 118;
const ARC_LENGTH = Math.PI * R;

/** Where a fraction of the dial sits, in the coordinates of the drawing. */
const pointAt = (fraction: number): { x: number; y: number } => {
  const angle = Math.PI + fraction * Math.PI;
  return { x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
};

/**
 * A pointer's position on the dial, as a fraction.
 *
 * The arc is a couple of millimetres wide and a thumb is not, so the whole half-disc
 * answers: touch anywhere and the mark goes to that angle.
 */
export const fractionAtPointer = (x: number, y: number): number => {
  const dx = x - CX;
  const dy = y - CY;
  // Below the dial there is no angle to read: pi and minus pi meet exactly at the quiet
  // end, so a thumb one pixel low would jump to the loud end. Side decides it instead.
  if (dy >= 0) return dx < 0 ? 0 : 1;
  return Math.min(1, Math.max(0, (Math.atan2(dy, dx) + Math.PI) / Math.PI));
};

export const gaugeMarkup = (): string => {
  const start = pointAt(0);
  const end = pointAt(1);
  const arc = `M ${start.x} ${start.y} A ${R} ${R} 0 0 1 ${end.x} ${end.y}`;
  return `
    <svg class="gauge" viewBox="0 0 300 172" role="img" aria-label="Sound level">
      <path class="gauge-track" d="${arc}" />
      <path class="gauge-fill" d="${arc}" stroke-dasharray="${ARC_LENGTH}"
            stroke-dashoffset="${ARC_LENGTH}" />
      <line class="gauge-limit" x1="0" y1="0" x2="0" y2="0" />
      <text class="gauge-reading" x="${CX}" y="${CY - 34}">–</text>
      <text class="gauge-unit" x="${CX}" y="${CY - 6}">dB approx.</text>
      <text class="gauge-min" x="14" y="168">30</text>
      <text class="gauge-max" x="286" y="168">110</text>
    </svg>`;
};

export interface GaugeElements {
  readonly svg: SVGSVGElement;
  readonly fill: SVGPathElement;
  readonly limit: SVGLineElement;
  readonly reading: SVGTextElement;
}

export const gaugeElements = (root: ParentNode): GaugeElements => ({
  svg: root.querySelector('.gauge') as SVGSVGElement,
  fill: root.querySelector('.gauge-fill') as SVGPathElement,
  limit: root.querySelector('.gauge-limit') as SVGLineElement,
  reading: root.querySelector('.gauge-reading') as SVGTextElement,
});

export const drawLevel = (elements: GaugeElements, fraction: number): void => {
  elements.fill.setAttribute(
    'stroke-dashoffset',
    String(ARC_LENGTH * (1 - fraction)),
  );
};

export const drawLimit = (elements: GaugeElements, fraction: number): void => {
  const angle = Math.PI + fraction * Math.PI;
  const inner = {
    x: CX + (R - 17) * Math.cos(angle),
    y: CY + (R - 17) * Math.sin(angle),
  };
  const outer = {
    x: CX + (R + 17) * Math.cos(angle),
    y: CY + (R + 17) * Math.sin(angle),
  };
  elements.limit.setAttribute('x1', String(inner.x));
  elements.limit.setAttribute('y1', String(inner.y));
  elements.limit.setAttribute('x2', String(outer.x));
  elements.limit.setAttribute('y2', String(outer.y));
};

/** Turns a pointer event into a position on the dial, in the drawing's own coordinates. */
export const pointerFraction = (
  svg: SVGSVGElement,
  event: PointerEvent,
): number => {
  const box = svg.getBoundingClientRect();
  const scale = 300 / box.width;
  return fractionAtPointer(
    (event.clientX - box.left) * scale,
    (event.clientY - box.top) * scale,
  );
};
