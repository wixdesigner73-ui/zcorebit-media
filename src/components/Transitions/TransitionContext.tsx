import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useExperience } from '../../context/ExperienceContext';
import { scrollToTarget } from '../../context/ScrollContext';
import { LOGO } from '../../utils/assets';
import { setFlight, setOrigin, setPendingSection, type Flight, type Origin } from './transitionStore';
import './transitions.scss';

type GoOptions = { flight?: Flight; origin?: Origin };
type TransitionApi = {
  /** Navigate with the cinematic curtain (or a shared-element flight). */
  go: (to: string, opts?: GoOptions) => void;
  /** Scroll to a home-page section, navigating home first if needed. */
  goToSection: (id: string) => void;
};

const TransitionCtx = createContext<TransitionApi | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { reducedMotion, setMenuOpen } = useExperience();
  const curtainRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const curtain = useCallback(
    (swap: () => void) => {
      const el = curtainRef.current;
      if (!el || reducedMotion) { swap(); return; }
      busy.current = true;
      const tl = gsap.timeline({ onComplete: () => { busy.current = false; } });
      tl.set(el, { display: 'grid' })
        .fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.inOut' })
        .fromTo(el.querySelector('img'), { scale: 0.7, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'expo.out' }, 0.35)
        .add(() => {
          swap();
          window.scrollTo(0, 0);
          scrollToTarget(0, { immediate: true });
        })
        .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut' }, '+=0.12')
        .to(el.querySelector('img'), { autoAlpha: 0, y: -20, duration: 0.4 }, '<')
        .set(el, { display: 'none' });
    },
    [reducedMotion],
  );

  const go = useCallback(
    (to: string, opts: GoOptions = {}) => {
      if (busy.current) return;
      setMenuOpen(false);
      if (opts.origin !== undefined) setOrigin(opts.origin);
      if (to === location.pathname) { scrollToTarget(0); return; }
      if (opts.flight && !reducedMotion) {
        setFlight(opts.flight);
        navigate(to);
        return;
      }
      curtain(() => navigate(to));
    },
    [curtain, location.pathname, navigate, reducedMotion, setMenuOpen],
  );

  const goToSection = useCallback(
    (id: string) => {
      setMenuOpen(false);
      if (location.pathname === '/') {
        // Let the menu close (and Lenis restart) before scrolling.
        requestAnimationFrame(() => scrollToTarget(`#${id}`));
        return;
      }
      setPendingSection(id);
      curtain(() => navigate('/'));
    },
    [curtain, location.pathname, navigate, setMenuOpen],
  );

  return (
    <TransitionCtx.Provider value={{ go, goToSection }}>
      {children}
      <div ref={curtainRef} className="curtain" aria-hidden="true">
        <img src={LOGO.icon} alt="" width={72} height={62} />
      </div>
    </TransitionCtx.Provider>
  );
}

export function useTransition() {
  const ctx = useContext(TransitionCtx);
  if (!ctx) throw new Error('useTransition must be used inside <TransitionProvider>');
  return ctx;
}
