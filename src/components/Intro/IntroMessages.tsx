import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { sound } from '../../audio/SoundEngine';
import { useExperience } from '../../context/ExperienceContext';
import { introMessages } from '../../data/content';
import { imgUrl } from '../../data/images';
import { HERO_VIDEO, LOGO } from '../../utils/assets';

// Choreography, in ms. Editable in one place.
const TIMING = { first: 950, between: 1450, settle: 500, arrival: 760, autoContinue: 6500 };
// Resting tilt of each card once it has been pushed back into the stack.
const TILT = [-2.4, 1.8, -1.3, 2.6, -1.9, 0];
// Horizontal launch offset — cards slide in from alternating sides.
const LAUNCH = [-46, 38, -30, 52, -40, 0];
// How far each card is flung when the stack drops away.
const DROP = [-13, 9, -7, 15, -10, 6];

type Props = { reducedMotion: boolean; onExitStart: () => void };

export function IntroMessages({ reducedMotion, onExitStart }: Props) {
  const { touch } = useExperience();
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cardHeight, setCardHeight] = useState(103);
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const glassRefs = useRef<(HTMLDivElement | null)[]>([]);
  const exitingRef = useRef(false);

  // Measure card height (CSS controls it per breakpoint).
  useLayoutEffect(() => {
    const measure = () => setCardHeight(stackRef.current?.offsetHeight || 103);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Scene entrance: reveal the reel from the poster once a real frame exists.
  useEffect(() => {
    const video = videoRef.current;
    const poster = posterRef.current;
    if (!video || !poster) return;
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      gsap.to(poster, { autoAlpha: 0, duration: reducedMotion ? 0.2 : 1.4, ease: 'power2.inOut' });
    };
    video.addEventListener('playing', reveal, { once: true });
    const fallback = setTimeout(reveal, 3000);
    video.play().catch(() => {});
    gsap.fromTo(sectionRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' });
    return () => clearTimeout(fallback);
  }, [reducedMotion]);

  // Message delivery clock.
  useEffect(() => {
    const timers: number[] = [];
    introMessages.forEach((_, i) => {
      timers.push(window.setTimeout(() => setCount(i + 1), TIMING.first + i * TIMING.between * (reducedMotion ? 0.5 : 1)));
    });
    const readyAt = TIMING.first + (introMessages.length - 1) * TIMING.between * (reducedMotion ? 0.5 : 1) + TIMING.settle;
    timers.push(window.setTimeout(() => setReady(true), readyAt));
    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  // Each arrival: bounce in, ping, and nudge the background.
  useLayoutEffect(() => {
    if (count === 0) return;
    const index = count - 1;
    const glass = glassRefs.current[index];
    sound.ping();
    if (!glass || reducedMotion) return;
    glass.animate(
      [
        { transform: `translate3d(${LAUNCH[index]}px, 26px, -120px) rotateX(32deg) scale(.18)`, filter: 'blur(16px)', opacity: 0, offset: 0, easing: 'cubic-bezier(.16,1,.3,1)' },
        { transform: 'translate3d(0,0,0) rotateX(0deg) scale(1.09)', filter: 'blur(1.5px)', opacity: 1, offset: 0.32, easing: 'cubic-bezier(.45,0,.55,1)' },
        { transform: 'translate3d(0,0,0) scale(.975)', filter: 'blur(0px)', opacity: 1, offset: 0.62, easing: 'cubic-bezier(.45,0,.55,1)' },
        { transform: 'translate3d(0,0,0) scale(1.01)', filter: 'blur(0px)', opacity: 1, offset: 0.84, easing: 'cubic-bezier(.45,0,.55,1)' },
        { transform: 'translate3d(0,0,0) scale(1)', filter: 'blur(0px)', opacity: 1, offset: 1 },
      ],
      { duration: TIMING.arrival },
    );
    // Background reacts: slow push-in plus a brief exposure lift.
    gsap.to(mediaRef.current, { scale: 1.03 + count * 0.014, duration: 1.8, ease: 'power2.out' });
    gsap.fromTo(shadeRef.current, { opacity: 0.38 }, { opacity: 0.56, duration: 1.3, ease: 'power2.out' });
  }, [count, reducedMotion]);

  const exit = useCallback(() => {
    if (!ready || exitingRef.current) return;
    exitingRef.current = true;
    setExpanded(false);
    const glasses = glassRefs.current.filter(Boolean).slice().reverse() as HTMLDivElement[];
    const distance = window.innerHeight + 260;
    const tl = gsap.timeline();
    if (reducedMotion) {
      tl.to(glasses, { autoAlpha: 0, duration: 0.2 })
        .add(onExitStart)
        .to(sectionRef.current, { autoAlpha: 0, duration: 0.3 });
      return;
    }
    glasses.forEach((glass, i) => {
      const r = DROP[i % DROP.length];
      tl.to(glass, { x: r * 0.2, y: -22, rotation: r * -0.12, duration: 0.17, ease: 'power1.out' }, i * 0.1)
        .to(glass, { x: r * 7, y: distance, rotation: r, duration: 0.83, ease: 'power3.in' }, i * 0.1 + 0.17);
    });
    tl.add(onExitStart, 0.85)
      .to(sectionRef.current, { yPercent: 105, duration: 1.1, ease: 'power4.inOut' }, 0.85);
  }, [ready, reducedMotion, onExitStart]);

  // Deliberate scroll, swipe, keys or a click continue; otherwise auto-continue.
  useEffect(() => {
    if (!ready) return;
    let wheel = 0;
    let lastWheel = 0;
    let touchY: number | null = null;
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now - lastWheel > 200) wheel = 0;
      lastWheel = now;
      wheel += Math.max(0, e.deltaY);
      if (wheel > 45) exit();
    };
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchY !== null && touchY - e.changedTouches[0].clientY > 45) exit();
      touchY = null;
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('.intro__skip')) return;
      if (['ArrowDown', 'PageDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); exit(); }
    };
    const auto = window.setTimeout(exit, TIMING.autoContinue);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(auto);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [ready, exit]);

  const gap = 12;
  const delivered = introMessages.slice(0, count);

  return (
    <section ref={sectionRef} className="messages" aria-label="Incoming messages">
      <div ref={mediaRef} className="messages__media">
        <video
          ref={videoRef}
          className="messages__video"
          src={HERO_VIDEO.src}
          poster={HERO_VIDEO.poster}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <img ref={posterRef} className="messages__poster" src={HERO_VIDEO.poster} alt="" />
      </div>
      <div ref={shadeRef} className="messages__shade" />
      <div className="grain" aria-hidden="true" />

      <div
        ref={stackRef}
        className="messages__stack"
        data-ready={ready}
        data-expanded={expanded}
        role="button"
        tabIndex={ready ? 0 : -1}
        aria-disabled={!ready}
        aria-label={ready ? 'Continue to Zcorebit Media' : 'Messages arriving'}
        onClick={exit}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse' && ready) setExpanded(true); }}
        onPointerMove={(e) => { if (e.pointerType === 'mouse' && ready && !expanded) setExpanded(true); }}
        onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) setExpanded(true); }}
        onBlur={() => setExpanded(false)}
        onPointerLeave={() => setExpanded(false)}
        style={{ ['--fan-reach' as string]: `${((count - 1) * (cardHeight + gap)) / 2}px` }}
      >
        <ol className="messages__list" aria-label="Messages">
          {delivered.map((message, index) => {
            const depth = count - 1 - index;
            const y = expanded ? (depth - (count - 1) / 2) * (cardHeight + gap) : depth * 13.5;
            const scale = expanded ? 1 : 1 - Math.min(depth, 3) * 0.055;
            const rotate = expanded || depth === 0 ? 0 : TILT[index] * Math.min(depth, 2) * 0.6;
            return (
              <li
                key={index}
                className="note"
                data-depth={depth}
                style={{
                  zIndex: 10 - depth,
                  transform: `translate3d(0, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`,
                  opacity: !expanded && depth > 3 ? 0 : 1,
                }}
              >
                <div className="note__glass" ref={(el) => { glassRefs.current[index] = el; }}>
                  <div className={`note__portrait${message.image === 'logo' ? ' note__portrait--logo' : ''}`} aria-hidden="true">
                    <img src={message.image === 'logo' ? LOGO.icon : imgUrl(message.image, 640)} alt="" />
                  </div>
                  <div className="note__copy">
                    <div className="note__meta">
                      <span className="note__sender">{message.sender}</span>
                      <span className="note__time">now</span>
                    </div>
                    <p className="note__text">{message.text}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {count > 0 ? `${introMessages[count - 1].sender}: ${introMessages[count - 1].text}` : ''}
      </p>

      <div className={`messages__hint${ready ? ' is-visible' : ''}`}>
        <span className="mono">{touch ? 'Tap or swipe up to enter' : 'Scroll, click or press ↓ to enter'}</span>
        <button className="messages__continue" type="button" onClick={exit} aria-label="Continue" tabIndex={ready ? 0 : -1}>
          ↓
        </button>
      </div>
      <p className="messages__caption mono">Intro sequence · illustrative messages</p>
    </section>
  );
}
