import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

const INTRO_KEY = 'zc-intro-seen';

function introSeen() {
  try { return sessionStorage.getItem(INTRO_KEY) === '1'; } catch { return false; }
}

type ExperienceApi = {
  /** Intro overlay currently mounted. */
  introActive: boolean;
  /** Intro has finished (or was skipped / not needed) — scenes may start. */
  introDone: boolean;
  revealScenes: () => void;
  finishIntro: () => void;
  replayIntro: () => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  reducedMotion: boolean;
  touch: boolean;
};

const ExperienceCtx = createContext<ExperienceApi | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  // The opening plays once per browser session, and only when landing on the
  // home page — deep links into projects or the gallery go straight in.
  const [introActive, setIntroActive] = useState(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const path = window.location.pathname.slice(base.length) || '/';
    return path === '/' && !introSeen();
  });
  const [introDone, setIntroDone] = useState(!introActive);
  const [menuOpen, setMenuOpen] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const touch = useMediaQuery('(hover: none), (pointer: coarse)');

  // Lets scenes beneath the overlay start while the intro is still fading out.
  const revealScenes = useCallback(() => setIntroDone(true), []);

  const finishIntro = useCallback(() => {
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* ignore */ }
    setIntroDone(true);
    setIntroActive(false);
  }, []);

  const replayIntro = useCallback(() => {
    setMenuOpen(false);
    setIntroDone(false);
    setIntroActive(true);
  }, []);

  const value = useMemo(
    () => ({ introActive, introDone, revealScenes, finishIntro, replayIntro, menuOpen, setMenuOpen, reducedMotion, touch }),
    [introActive, introDone, revealScenes, finishIntro, replayIntro, menuOpen, reducedMotion, touch],
  );
  return <ExperienceCtx.Provider value={value}>{children}</ExperienceCtx.Provider>;
}

export function useExperience() {
  const ctx = useContext(ExperienceCtx);
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceProvider>');
  return ctx;
}
