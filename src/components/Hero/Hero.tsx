import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../../context/ExperienceContext';
import { scrollToTarget } from '../../context/ScrollContext';
import { studio } from '../../data/content';
import { img } from '../../data/images';
import { HERO_IMAGES } from '../../data/scenes';
import { isLowPowerDevice } from '../../utils/dom';
import { clamp, lerp, smoothstep } from '../../utils/math';
import './hero.scss';

type Card = { el: HTMLDivElement; index: number; scatter: number; spin: number };

/**
 * Hero "spiral": photo cards rise from below, assemble into a rotating 3D
 * helix around the headline, respond to pointer depth and can be dragged with
 * inertia. Scrolling away spreads the helix apart.
 */
export function Hero() {
  const { introDone, reducedMotion, touch } = useExperience();
  const sectionRef = useRef<HTMLElement>(null);
  const spiralRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [formed, setFormed] = useState(false);

  const images = useMemo(() => {
    const count = touch || isLowPowerDevice() ? 14 : HERO_IMAGES.length;
    return HERO_IMAGES.slice(0, count).map(img);
  }, [touch]);

  // Seeded scatter so the cloud looks the same on each visit.
  const seeds = useMemo(
    () => images.map((_, i) => ({ scatter: Math.sin(i * 12.9898) * 0.5, spin: Math.cos(i * 78.233) * 55 })),
    [images],
  );

  useEffect(() => {
    const section = sectionRef.current;
    const spiral = spiralRef.current;
    if (!section || !spiral || !introDone) return;

    const cards: Card[] = cardRefs.current
      .map((el, index) => (el ? { el, index, ...seeds[index] } : null))
      .filter(Boolean) as Card[];
    const n = cards.length;
    // Depth-of-field blur is the costliest part; skip it on weaker devices.
    const lite = touch || isLowPowerDevice();

    let angle = 0;
    let yaw = 0, targetYaw = 0;
    let tilt = 0, targetTilt = 0;
    let pan = 0, targetPan = 0;
    let pointerYaw = 0, pointerTilt = 0, pointerYawTarget = 0, pointerTiltTarget = 0;
    let velocity = 0;
    let flight = reducedMotion ? 99999 : 0;
    let exit = 0;
    let dragging = false;
    let pointerId: number | null = null;
    let lastX = 0, lastY = 0;
    let last = performance.now();
    let frame = 0;
    let visible = true;
    let width = section.clientWidth;
    let height = section.clientHeight;

    const layout = () => {
      const narrow = width < 600;
      const radius = Math.min(width * (narrow ? 0.42 : 0.36), 600);
      const step = narrow ? 44 : 58;
      const cardW = narrow ? clamp(width * 0.27, 96, 140) : clamp(width * 0.14, 140, 200);
      spiral.style.transform = `translate3d(0, ${pan}px, 0) rotateX(${tilt + pointerTilt}deg) scale(${1 + exit * 0.35})`;

      for (const { el, index, scatter, spin } of cards) {
        const a = index * (narrow ? 50 : 32) + angle + yaw + pointerYaw;
        const rad = (a * Math.PI) / 180;
        const depth = Math.cos(rad);
        const time = flight - index * 42;
        const rise = clamp(time / 1400, 0, 1);
        const assemble = smoothstep(clamp((time - 950) / 1900, 0, 1));
        const lift = 1 - Math.pow(1 - rise, 3);
        const spread = 1 + exit * 1.4;
        const x = lerp(scatter * width * 0.85, Math.sin(rad) * radius * spread, assemble);
        const targetY = (index - (n - 1) / 2) * step * (1 + exit * 0.6);
        const y = lerp(height * 0.85 + index * 12, lerp((index - (n - 1) / 2) * 27, targetY, assemble), lift);
        const z = lerp(-220, depth * radius, assemble);
        el.style.width = `${cardW}px`;
        el.style.height = `${cardW * 1.32}px`;
        el.style.opacity = String(clamp(rise * 3, 0, 1) * (1 - exit * 0.9));
        el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${a * assemble}deg) rotateZ(${spin * (1 - assemble)}deg)`;
        const blur = lite ? '' : ` blur(${(Math.max(0, -depth) * 1.3 * assemble).toFixed(2)}px)`;
        el.style.filter = `brightness(${(0.42 + (depth + 1) * 0.24).toFixed(3)})${blur}`;
      }
    };

    // Choreography follows wall-clock time so slow devices don't play it in slow motion.
    const startedAt = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      if (!reducedMotion) flight = now - startedAt;
      if (!reducedMotion && !dragging) {
        angle += dt * 0.0062;
        targetYaw += (velocity * dt) / 16.67;
        velocity *= Math.pow(0.94, dt / 16.67);
      }
      const ease = 1 - Math.exp(-dt / 110);
      yaw = lerp(yaw, targetYaw, ease);
      tilt = lerp(tilt, targetTilt, ease);
      pan = lerp(pan, targetPan, ease);
      const soft = 1 - Math.exp(-dt / 380);
      pointerYaw = lerp(pointerYaw, pointerYawTarget, soft);
      pointerTilt = lerp(pointerTilt, pointerTiltTarget, soft);
      layout();
      if (flight > 2800) setFormed(true);
      if (visible) frame = requestAnimationFrame(tick);
    };

    const start = () => { cancelAnimationFrame(frame); last = performance.now(); frame = requestAnimationFrame(tick); };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(section);

    const onResize = () => { width = section.clientWidth; height = section.clientHeight; };
    window.addEventListener('resize', onResize);

    // Pointer depth (desktop): the helix leans toward the cursor.
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && !dragging && !reducedMotion) {
        const r = section.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        pointerYawTarget = nx * 18;
        pointerTiltTarget = -ny * 10;
      }
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      targetYaw += dx * 0.24;
      velocity = clamp(dx * 0.18, -4, 4);
      if (e.pointerType === 'mouse') {
        targetTilt = clamp(targetTilt - dy * 0.06, -16, 16);
        targetPan = clamp(targetPan + dy * 0.6, -height * 0.25, height * 0.25);
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest('a, button')) return;
      dragging = true;
      pointerId = e.pointerId;
      velocity = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      section.classList.add('is-dragging');
      if (e.pointerType === 'mouse') section.setPointerCapture(e.pointerId);
    };
    const release = () => {
      dragging = false;
      pointerId = null;
      section.classList.remove('is-dragging');
      // Drift back to centre vertically.
      targetTilt *= 0.4;
      targetPan *= 0.4;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { targetYaw -= 20; e.preventDefault(); }
      if (e.key === 'ArrowRight') { targetYaw += 20; e.preventDefault(); }
      if (e.key === 'Home') { targetYaw = 0; targetTilt = 0; targetPan = 0; }
    };

    section.addEventListener('pointermove', onPointerMove);
    section.addEventListener('pointerdown', onPointerDown);
    section.addEventListener('pointerup', release);
    section.addEventListener('pointercancel', release);
    section.addEventListener('keydown', onKey);

    // Scroll-out: the helix spreads apart and dissolves as the page moves on.
    const st = reducedMotion
      ? null
      : ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: '+=70%',
          pin: true,
          pinSpacing: true,
          scrub: true,
          onUpdate: (self) => { exit = self.progress; },
        });
    const titleTween = reducedMotion
      ? null
      : gsap.to(section.querySelectorAll('.hero__title, .hero__copy, .hero__hint'), {
          autoAlpha: 0,
          y: -40,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '+=55%', scrub: true },
        });

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      st?.kill();
      titleTween?.scrollTrigger?.kill();
      titleTween?.kill();
      window.removeEventListener('resize', onResize);
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerdown', onPointerDown);
      section.removeEventListener('pointerup', release);
      section.removeEventListener('pointercancel', release);
      section.removeEventListener('keydown', onKey);
    };
  }, [introDone, reducedMotion, seeds, touch]);

  return (
    <section
      id="top"
      ref={sectionRef}
      className={`hero${introDone ? ' is-active' : ''}${formed ? ' is-formed' : ''}`}
      data-section="Opening"
      data-cursor="drag"
      tabIndex={0}
      aria-describedby="hero-help"
    >
      <h1 className="sr-only">Zcorebit Media — {studio.positioning}</h1>
      <p id="hero-help" className="sr-only">Drag or use the left and right arrow keys to rotate the photo spiral. Scroll to continue.</p>

      <div className="hero__stage" aria-hidden="true">
        <div ref={spiralRef} className="hero__spiral">
          {images.map((image, i) => (
            <div key={image.key} ref={(el) => { cardRefs.current[i] = el; }} className="hero__card" style={{ background: image.color }}>
              <img
                src={image.src.replace('-1280.', '-640.')}
                alt=""
                width={image.width}
                height={image.height}
                decoding="async"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <p className="hero__title" aria-hidden="true">
        <span className="hero__line">Your vision</span>
        <span className="hero__line hero__line--mid">
          <em>in</em>
          <span>motion.</span>
        </span>
      </p>

      <div className="hero__copy">
        <p className="hero__intro">{studio.positioning}.</p>
        <p className="hero__sub">{studio.heroSub}</p>
      </div>

      <p className="hero__hint mono" aria-hidden="true">Drag to explore · Scroll to continue</p>
      <button className="hero__down" type="button" aria-label="Scroll to the studio introduction" onClick={() => scrollToTarget('#studio')}>
        ↓
      </button>
    </section>
  );
}
