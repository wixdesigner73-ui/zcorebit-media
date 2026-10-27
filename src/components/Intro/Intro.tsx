import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useExperience } from '../../context/ExperienceContext';
import { useSound } from '../../context/SoundContext';
import { getLenis } from '../../context/ScrollContext';
import { introMessages, studio } from '../../data/content';
import { imgUrl } from '../../data/images';
import { HERO_IMAGES, REVEAL_IMAGES } from '../../data/scenes';
import { HERO_VIDEO, LOGO, preloadImage } from '../../utils/assets';
import { IntroMessages } from './IntroMessages';
import { BrandReveal } from './BrandReveal';
import './intro.scss';

type Phase = 'loading' | 'choose' | 'messages' | 'reveal' | 'leaving';

const MIN_LOADER_MS = 1700;

/** Essential assets for the opening — everything else loads lazily later. */
function essentialAssets() {
  const keys = new Set<string>([
    ...introMessages.map((m) => m.image).filter((k) => k !== 'logo'),
    ...REVEAL_IMAGES,
    ...HERO_IMAGES.slice(0, 12),
  ]);
  return [HERO_VIDEO.poster, LOGO.white, LOGO.icon, ...[...keys].map((k) => imgUrl(k, 640))];
}

export function Intro() {
  const { revealScenes, finishIntro, reducedMotion } = useExperience();
  const { enable, preference } = useSound();
  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const leavingRef = useRef(false);

  // Real progress: images + fonts + first video frame (video capped so a slow
  // connection never blocks entry).
  useEffect(() => {
    let cancelled = false;
    const assets = essentialAssets();
    let done = 0;
    const total = assets.length + 2;
    const tick = () => { if (!cancelled) setProgress(++done / total); };

    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    video.src = HERO_VIDEO.src;
    const videoReady = Promise.race([
      new Promise<void>((r) => video.addEventListener('loadeddata', () => r(), { once: true })),
      new Promise<void>((r) => video.addEventListener('error', () => r(), { once: true })),
      new Promise<void>((r) => setTimeout(r, 4500)),
    ]).then(tick);

    const started = performance.now();
    Promise.all([
      ...assets.map((src) => preloadImage(src).then(tick)),
      document.fonts.ready.then(tick),
      videoReady,
    ]).then(() => {
      const wait = Math.max(0, MIN_LOADER_MS - (performance.now() - started));
      setTimeout(() => { if (!cancelled) setPhase('choose'); }, reducedMotion ? 0 : wait + 450);
    });
    return () => { cancelled = true; video.removeAttribute('src'); video.load(); };
  }, [reducedMotion]);

  useEffect(() => {
    if (phase === 'choose') enterRef.current?.focus({ preventScroll: true });
  }, [phase]);

  // Make sure the page underneath starts from the top.
  useEffect(() => {
    getLenis()?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, []);

  // Soft spotlight that follows the pointer over the entry photograph.
  useEffect(() => {
    const spot = spotRef.current;
    if (!spot || reducedMotion) return;
    const x = gsap.quickTo(spot, '--x', { duration: 0.9, ease: 'power3' });
    const y = gsap.quickTo(spot, '--y', { duration: 0.9, ease: 'power3' });
    const move = (e: PointerEvent) => { x(e.clientX); y(e.clientY); };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [reducedMotion]);

  const leave = useCallback(
    (fast = false) => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setPhase('leaving');
      revealScenes();
      gsap.to(rootRef.current, {
        autoAlpha: 0,
        duration: reducedMotion ? 0.2 : fast ? 0.6 : 1.1,
        ease: 'power2.inOut',
        onComplete: finishIntro,
      });
    },
    [finishIntro, revealScenes, reducedMotion],
  );

  const enter = (withSound: boolean) => {
    if (withSound) void enable();
    else if (preference !== 'off') { try { localStorage.setItem('zc-sound', 'off'); } catch { /* ignore */ } }
    // Entry photograph slides away to the message scene.
    gsap.to(entryRef.current, {
      yPercent: -6,
      autoAlpha: 0,
      duration: reducedMotion ? 0.2 : 0.9,
      ease: 'power3.inOut',
      onComplete: () => setPhase('messages'),
    });
  };

  const skip = () => {
    // A click is a valid gesture, so a remembered "sound on" can start here.
    if (preference === 'on' && (phase === 'loading' || phase === 'choose')) void enable();
    leave(true);
  };

  return (
    <div ref={rootRef} className="intro" role="dialog" aria-modal="true" aria-label="Welcome to Zcorebit Media">
      {(phase === 'reveal' || phase === 'leaving') && <BrandReveal onComplete={() => leave()} reducedMotion={reducedMotion} />}

      {(phase === 'messages' || phase === 'reveal') && (
        <IntroMessages
          reducedMotion={reducedMotion}
          onExitStart={() => setPhase('reveal')}
        />
      )}

      {(phase === 'loading' || phase === 'choose') && (
        <section ref={entryRef} className={`entry entry--${phase}`} aria-label="Loading Zcorebit Media">
          <img className="entry__image" src={HERO_VIDEO.poster} alt="" {...{ fetchpriority: 'high' }} />
          <div className="entry__shade" />
          <div ref={spotRef} className="entry__spot" />
          <div className="grain" aria-hidden="true" />

          <p className="entry__intro">
            {studio.positioning}.
            <br />
            From idea to cinematic delivery.
          </p>
          <p className="entry__since mono">
            <img src={LOGO.icon} alt="" width={16} height={14} />
            {studio.location}
          </p>

          <div className="entry__center">
            <div className="entry__logo" role="img" aria-label="Zcorebit Media" style={{ ['--p' as string]: `${Math.round(progress * 100)}%` }}>
              <img className="entry__logo-base" src={LOGO.white} alt="" />
              <img className="entry__logo-fill" src={LOGO.white} alt="" />
            </div>

            {phase === 'loading' ? (
              <p className="entry__status mono" role="status">
                Getting things ready <span>{String(Math.round(progress * 100)).padStart(2, '0')}%</span>
              </p>
            ) : (
              <div className="entry__actions">
                <button ref={enterRef} className="entry__enter" type="button" onClick={() => enter(true)} data-cursor="enter">
                  <span>Enter with sound</span>
                  <span className="entry__note mono">sound on</span>
                  <span className="entry__eq" aria-hidden="true"><i /><i /><i /><i /></span>
                </button>
                <button className="entry__silent" type="button" onClick={() => enter(false)}>
                  Enter without sound
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {phase !== 'leaving' && (
        <button className="intro__skip mono" type="button" onClick={skip}>
          Skip intro <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
