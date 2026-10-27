import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useExperience } from '../../context/ExperienceContext';
import { clients, testimonials, testimonialsIntro } from '../../data/content';
import { clamp, pad2 } from '../../utils/math';
import './testimonials.scss';

export function Testimonials() {
  const { reducedMotion } = useExperience();
  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const pos = useRef({ x: 0, min: 0 });

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    pos.current.min = Math.min(0, viewport.clientWidth - track.scrollWidth);
  }, []);

  const cardOffset = (i: number) => {
    const card = trackRef.current?.children[i] as HTMLElement | undefined;
    return card ? -card.offsetLeft + (trackRef.current!.children[0] as HTMLElement).offsetLeft : 0;
  };

  const goTo = useCallback((i: number) => {
    const next = clamp(i, 0, testimonials.length - 1);
    setIndex(next);
    const x = clamp(cardOffset(next), pos.current.min, 0);
    pos.current.x = x;
    gsap.to(trackRef.current, { x, duration: reducedMotion ? 0 : 1, ease: 'expo.out' });
  }, [reducedMotion]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Drag with inertia, then settle on the nearest card.
  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    let startX = 0, startPos = 0, lastX = 0, lastT = 0, v = 0, id: number | null = null, moved = false;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      id = e.pointerId; moved = false;
      startX = lastX = e.clientX; startPos = pos.current.x; lastT = performance.now(); v = 0;
      gsap.killTweensOf(track);
      viewport.classList.add('is-dragging');
    };
    const move = (e: PointerEvent) => {
      if (id !== e.pointerId) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4 && !moved) { moved = true; viewport.setPointerCapture(e.pointerId); }
      let x = startPos + dx;
      if (x > 0) x *= 0.35;
      if (x < pos.current.min) x = pos.current.min + (x - pos.current.min) * 0.35;
      pos.current.x = x;
      gsap.set(track, { x });
      const now = performance.now();
      v = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
    };
    const up = (e: PointerEvent) => {
      if (id !== e.pointerId) return;
      id = null;
      viewport.classList.remove('is-dragging');
      const projected = pos.current.x + v * 320;
      let best = 0, bestD = Infinity;
      for (let i = 0; i < testimonials.length; i++) {
        const d = Math.abs(clamp(cardOffset(i), pos.current.min, 0) - projected);
        if (d < bestD) { bestD = d; best = i; }
      }
      goTo(best);
    };
    viewport.addEventListener('pointerdown', down);
    viewport.addEventListener('pointermove', move);
    viewport.addEventListener('pointerup', up);
    viewport.addEventListener('pointercancel', up);
    return () => {
      viewport.removeEventListener('pointerdown', down);
      viewport.removeEventListener('pointermove', move);
      viewport.removeEventListener('pointerup', up);
      viewport.removeEventListener('pointercancel', up);
    };
  }, [goTo]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      gsap.from(q('.voices__head > *'), {
        y: 50, autoAlpha: 0, stagger: 0.08, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: root, start: 'top 75%' },
      });
      gsap.from(q('.voice'), {
        x: 120, autoAlpha: 0, stagger: 0.08, duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: q('.voices__viewport')[0], start: 'top 85%' },
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={rootRef} id="voices" className="voices section" data-section="Voices" aria-labelledby="voices-heading">
      <div className="voices__head">
        <p className="overline"><span className="overline__num">(05)</span> What Our Clients Say</p>
        <h2 id="voices-heading" className="voices__title">{testimonialsIntro.heading}</h2>
        <p className="voices__intro">{testimonialsIntro.body}</p>
      </div>

      <div
        ref={viewportRef}
        className="voices__viewport"
        role="region"
        aria-roledescription="carousel"
        aria-label="Client testimonials. Drag or use the left and right arrow keys."
        tabIndex={0}
        data-cursor="drag"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
        }}
      >
        <ul ref={trackRef} className="voices__track">
          {testimonials.map((t, i) => (
            <li key={i} className={`voice${i === index ? ' is-current' : ''}`} aria-roledescription="slide" aria-label={`${i + 1} of ${testimonials.length}`}>
              <figure>
                <span className="voice__mark" aria-hidden="true">“</span>
                <blockquote className="voice__quote">{t.quote}</blockquote>
                <figcaption className="voice__by">
                  <span className="voice__name">{t.name}</span>
                  <span className="mono">{t.role}, {t.company}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      <div className="voices__nav">
        <span className="mono voices__count" aria-live="polite">{pad2(index + 1)} / {pad2(testimonials.length)}</span>
        <div className="voices__buttons">
          <button type="button" className="glass-btn" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous testimonial">←</button>
          <button type="button" className="glass-btn" onClick={() => goTo(index + 1)} disabled={index === testimonials.length - 1} aria-label="Next testimonial">→</button>
        </div>
      </div>

      <div className="clients" aria-labelledby="clients-heading">
        <p id="clients-heading" className="overline">Trusted By</p>
        <div className="clients__marquee">
          {[0, 1].map((copy) => (
            <ul key={copy} className="clients__track" aria-hidden={copy === 1}>
              {clients.map((c) => <li key={c}>{c}<span aria-hidden="true">✦</span></li>)}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
