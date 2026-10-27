// Small module-level stores shared across routes (no re-render needed).

export type FlightRect = { x: number; y: number; w: number; h: number };
export type Flight = { imageKey: string; rect: FlightRect };
export type Origin = 'gallery' | 'work' | 'home' | null;

let pendingFlight: Flight | null = null;
let origin: Origin = null;
let pendingSection: string | null = null;

/** Shared-element hand-off: the gallery/work tile the visitor clicked. */
export function setFlight(flight: Flight | null) { pendingFlight = flight; }
export function takeFlight() { const f = pendingFlight; pendingFlight = null; return f; }

/** Where the visitor came from — drives contextual "Back" labels. */
export function setOrigin(value: Origin) { origin = value; }
export function getOrigin() { return origin; }

/** Section to scroll to once the home page has mounted. */
export function setPendingSection(id: string | null) { pendingSection = id; }
export function takePendingSection() { const s = pendingSection; pendingSection = null; return s; }

export function rectOf(el: Element): FlightRect {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}
