import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { sound } from '../audio/SoundEngine';

const STORAGE_KEY = 'zc-sound';

type SoundPreference = 'on' | 'off' | null;

function readPreference(): SoundPreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'on' || value === 'off' ? value : null;
  } catch {
    return null;
  }
}

function writePreference(value: 'on' | 'off') {
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage blocked */ }
}

type SoundApi = {
  playing: boolean;
  preference: SoundPreference;
  enable: () => Promise<boolean>;
  disable: () => void;
  toggle: () => void;
};

const SoundCtx = createContext<SoundApi | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const playing = useSyncExternalStore(
    (fn) => sound.subscribe(fn),
    () => sound.playing,
  );

  useEffect(() => {
    const onVisibility = () => sound.setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const enable = useCallback(async () => {
    writePreference('on');
    return sound.play();
  }, []);

  // Browsers only allow audio after a gesture: a saved "sound on" resumes on
  // the visitor's first click, tap or key press.
  useEffect(() => {
    if (readPreference() !== 'on') return;
    const resume = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest?.('.sound')) return; // the button handles itself
      if (!sound.playing) void sound.play();
      off();
    };
    const off = () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    return off;
  }, []);

  const disable = useCallback(() => {
    writePreference('off');
    sound.pause();
  }, []);

  const toggle = useCallback(() => {
    if (sound.playing) disable();
    else void enable();
  }, [enable, disable]);

  const value = useMemo<SoundApi>(
    () => ({ playing, preference: readPreference(), enable, disable, toggle }),
    [playing, enable, disable, toggle],
  );

  return <SoundCtx.Provider value={value}>{children}</SoundCtx.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundCtx);
  if (!ctx) throw new Error('useSound must be used inside <SoundProvider>');
  return ctx;
}
