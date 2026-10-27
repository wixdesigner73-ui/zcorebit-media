export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
/** Frame-rate independent damping factor for exponential smoothing. */
export const damp = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);
/** Wraps v into the range [-size/2, size/2). */
export const wrap = (v: number, size: number) => ((((v + size / 2) % size) + size) % size) - size / 2;

export function shuffle<T>(values: readonly T[], seed = 7): T[] {
  // Deterministic shuffle so SSR/hydration and reloads keep the same order.
  const result = [...values];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
