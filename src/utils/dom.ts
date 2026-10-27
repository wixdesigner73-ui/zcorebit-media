// React 18 doesn't know the `inert` attribute; an empty string renders it.
export function inertProps(inert: boolean): Record<string, string> {
  return inert ? { inert: '' } : {};
}

export function prefersReducedData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection?.saveData || /2g/.test(connection?.effectiveType ?? ''));
}

export function isLowPowerDevice() {
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 4 || memory <= 4;
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
