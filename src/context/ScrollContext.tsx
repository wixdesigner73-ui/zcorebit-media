import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from './ExperienceContext';

gsap.registerPlugin(ScrollTrigger);

/**
 * The single smooth-scroll controller. Lenis drives window scrolling and is
 * ticked by GSAP's ticker so ScrollTrigger and Lenis share one frame loop.
 */
let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

export function scrollToTarget(target: string | HTMLElement | number, opts: { immediate?: boolean; offset?: number } = {}) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, offset: opts.offset ?? 0, immediate: opts.immediate, force: true });
    return;
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: opts.immediate ? 'auto' : 'smooth' });
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: opts.immediate ? 'auto' : 'smooth' });
  }
}

export function ScrollProvider({ children }: { children: ReactNode }) {
  const { reducedMotion, introActive, menuOpen } = useExperience();

  useEffect(() => {
    if (reducedMotion) return;
    const instance = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4, syncTouch: false });
    lenis = instance;
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, [reducedMotion]);

  // Freeze page scroll under the intro overlay and the menu.
  useEffect(() => {
    const locked = introActive || menuOpen;
    document.documentElement.classList.toggle('scroll-locked', locked);
    if (locked) lenis?.stop();
    else lenis?.start();
  }, [introActive, menuOpen]);

  return <>{children}</>;
}
