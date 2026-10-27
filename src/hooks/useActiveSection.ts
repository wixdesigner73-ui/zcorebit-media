import { useSyncExternalStore } from 'react';

// Tracks which home-page section is in view (set by ScrollTriggers in Home).
let current = { index: 0, label: 'Opening' };
const listeners = new Set<() => void>();

export function setActiveSection(index: number, label: string) {
  if (current.index === index && current.label === label) return;
  current = { index, label };
  listeners.forEach((fn) => fn());
}

export function useActiveSection() {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    () => current,
  );
}
