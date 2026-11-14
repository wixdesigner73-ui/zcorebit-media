import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useExperience } from '../../context/ExperienceContext';
import { getLenis } from '../../context/ScrollContext';
import { introMessages, studio } from '../../data/content';
import { imgUrl } from '../../data/images';
import { HERO_IMAGES, REVEAL_IMAGES } from '../../data/scenes';
import { HERO_VIDEO, LOGO, preloadImage } from '../../utils/assets';
import { prefersReducedData } from '../../utils/dom';
import { IntroMessages } from './IntroMessages';
import { BrandReveal } from './BrandReveal';
import './intro.scss';

type Phase = 'loading' | 'messages' | 'reveal' | 'leaving';

const MIN_LOADER_MS = 1500;

/** Essential assets for the opening — everything else loads lazily later. */
function essentialAssets() {
  const keys = new Set<string>([
    ...introMessages.map((m) => m.image).filter((k) => k !== 'logo'),
    ...REVEAL_IMAGES,
    ...HERO_IMAGES.slice(0, 10),
  ]);
  return [HERO_VIDEO.poster, LOGO.white, LOGO.icon, ...[...keys].map((k) => imgUrl(k, 640))];
}

/**
 * One continuous scene: the showreel background lives here for the whole
 * opening and the loader, messages and brand reveal are layers on top of it,
 * so nothing ever cuts to black between phases.
 */
export function Intro() {
  const { revealScenes, finishIntro, reducedMotion } = useExperience();
  const [phase, setPhase] = useState<Phase>('loading');
  const [loaderGone, setLoaderGone] = useState(false);
  const [progress, setProgress] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loaderRef = useRef<HTMLElement>(null);
  const leavingRef = useRef(false);
  const saveData = useRef(prefersReducedData()).current;

  // Make sure the page underneath starts from the top.
  useEffect(() => {
    getLenis()?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, []);

  // Slow settle on the background while loading.
  useEffect(() => {
    if (reducedMotion) return;
    const tween = gsap.fromTo(mediaRef.current, { scale: 1.14 }, { scale: 1.03, duration: 7, ease: 'power2.out' });
    return () => { tween.kill(); };
  }, [reducedMotion]);

  // Real progress: images + fonts + first video frame (video capped so a slow
  // connection never blocks entry).
  useEffect(() => {
    let cancelled = false;
    const assets = essentialAssets();
    const video = videoRef.current;
    let done = 0;
    const total = assets.length + 2;
    const tick = () => { if (!cancelled) setProgress(++done / total); };

    const posterReveal = () => gsap.to(posterRef.current, { autoAlpha: 0, duration: reducedMotion ? 0.2 : 1.2, ease: 'power2.inOut' });
    let revealed = false;
    const reveal = () => { if (!revealed) { revealed = true; posterReveal(); } };
    video?.addEventListener('playing', reveal, { once: true });
    video?.play().catch(() => {});

    const videoReady = saveData || !video
      ? Promise.resolve().then(tick)
      : Promise.race([
          new Promise<void>((r) => video.addEventListener('loadeddata', () => r(), { once: true })),
          new Promise<void>((r) => video.addEventListener('error', () => r(), { once: true })),
          new Promise<void>((r) => setTimeout(r, 4000)),
        ]).then(tick);

    const started = performance.now();
    Promise.all([
      ...assets.map((src) => preloadImage(src).then(tick)),
      document.fonts.ready.then(tick),
      videoReady,
    ]).then(() => {
      const wait = reducedMotion ? 0 : Math.max(0, MIN_LOADER_MS - (performance.now() - started));
      setTimeout(() => {
        if (cancelled) return;
        // Cross-fade: the loader dissolves while the first message is already on its way.
        setPhase('messages');
        gsap.to(loaderRef.current, {
          autoAlpha: 0,
          scale: 1.04,
          duration: reducedMotion ? 0.2 : 0.9,
          ease: 'power2.inOut',
          onComplete: () => setLoaderGone(true),
        });
      }, wait + 250);
    });
    return () => { cancelled = true; };
  }, [reducedMotion, saveData]);

  const leave = useCallback(
    (fast = false) => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setPhase('leaving');
      revealScenes();
      gsap.to(rootRef.current, {
        autoAlpha: 0,
        duration: reducedMotion ? 0.2 : fast ? 0.6 : 1.2,
        ease: 'power2.inOut',
        onComplete: finishIntro,
      });
    },
    [finishIntro, revealScenes, reducedMotion],
  );

  const onArrive = useCallback((count: number) => {
    if (reducedMotion) return;
    gsap.to(mediaRef.current, { scale: 1.03 + count * 0.012, duration: 1.8, ease: 'power2.out', overwrite: 'auto' });
  }, [reducedMotion]);

  const onExitStart = useCallback(() => {
    setPhase('reveal');
    gsap.to(shadeRef.current, { opacity: 0.88, duration: reducedMotion ? 0.2 : 1.2, ease: 'power2.inOut' });
  }, [reducedMotion]);

  return (
    <div ref={rootRef} className="intro" role="dialog" aria-modal="true" aria-label="Welcome to Zcorebit Media">
      <div ref={mediaRef} className="intro__media" aria-hidden="true">
        {!saveData && (
          <video ref={videoRef} className="intro__video" src={HERO_VIDEO.src} poster={HERO_VIDEO.poster} muted loop playsInline preload="auto" />
        )}
        <img ref={posterRef} className="intro__poster" src={HERO_VIDEO.poster} alt="" />
      </div>
      <div ref={shadeRef} className="intro__shade" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      {phase !== 'leaving' && (phase === 'messages' || phase === 'reveal') && (
        <IntroMessages reducedMotion={reducedMotion} onArrive={onArrive} onExitStart={onExitStart} />
      )}

      {(phase === 'reveal' || phase === 'leaving') && <BrandReveal onComplete={() => leave()} reducedMotion={reducedMotion} />}

      {!loaderGone && (
        <section ref={loaderRef} className="loader" aria-label="Loading Zcorebit Media">
          <p className="loader__intro">
            {studio.positioning}.
            <br />
            From idea to cinematic delivery.
          </p>
          <div className="loader__center">
            <div className="loader__logo" role="img" aria-label="Zcorebit Media" style={{ ['--p' as string]: `${Math.round(progress * 100)}%` }}>
              <img className="loader__logo-base" src={LOGO.white} alt="" />
              <img className="loader__logo-fill" src={LOGO.white} alt="" />
            </div>
            <p className="loader__status mono" role="status">
              Getting things ready <span>{String(Math.round(progress * 100)).padStart(2, '0')}%</span>
            </p>
          </div>
          <p className="loader__since mono">
            <img src={LOGO.icon} alt="" width={16} height={14} />
            {studio.location}
          </p>
        </section>
      )}

      {phase !== 'leaving' && (
        <button className="intro__skip mono" type="button" onClick={() => leave(true)}>
          Skip intro <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
