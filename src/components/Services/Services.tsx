import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../../context/ExperienceContext';
import { services, servicesIntro } from '../../data/content';
import { img } from '../../data/images';
import { pad2 } from '../../utils/math';
import { useTransition } from '../Transitions/TransitionContext';
import './services.scss';

/** Event the contact form listens to so "Start a brief" pre-selects a service. */
export const BRIEF_EVENT = 'zc:brief';

export function Services() {
  const { reducedMotion, touch } = useExperience();
  const { goToSection } = useTransition();
  const rootRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      gsap.from(q('.services__head > *'), {
        y: 50, autoAlpha: 0, stagger: 0.08, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: root, start: 'top 75%' },
      });
      q('.svc').forEach((row) => {
        gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 92%' } })
          .from(row.querySelector('.svc__line'), { scaleX: 0, duration: 1.4, ease: 'expo.inOut' })
          .from(row.querySelectorAll('.svc__num, .svc__title, .svc__summary'), { yPercent: 60, autoAlpha: 0, duration: 1, stagger: 0.06, ease: 'expo.out' }, 0.15);
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  // Expanding a row changes page height — re-measure pinned sections below.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const t = setTimeout(() => ScrollTrigger.refresh(), 760);
    return () => clearTimeout(t);
  }, [open]);

  // Floating preview that trails the cursor (desktop only).
  useEffect(() => {
    const root = rootRef.current;
    const preview = previewRef.current;
    if (!root || !preview || touch) return;
    const xTo = gsap.quickTo(preview, 'x', { duration: reducedMotion ? 0 : 0.7, ease: 'power3' });
    const yTo = gsap.quickTo(preview, 'y', { duration: reducedMotion ? 0 : 0.7, ease: 'power3' });
    const rTo = gsap.quickTo(preview, 'rotation', { duration: 0.9, ease: 'power3' });
    let lastX = 0;
    let placed = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const list = root.querySelector('.services__list')!.getBoundingClientRect();
      const x = e.clientX - list.left;
      const y = e.clientY - list.top;
      // First sighting: jump straight to the pointer instead of flying in from 0,0.
      if (!placed) { gsap.set(preview, { x, y }); placed = true; }
      xTo(x);
      yTo(y);
      if (!reducedMotion) rTo(gsap.utils.clamp(-10, 10, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerover', onMove);
    return () => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerover', onMove);
    };
  }, [touch, reducedMotion]);

  const startBrief = (title: string) => {
    window.dispatchEvent(new CustomEvent(BRIEF_EVENT, { detail: title }));
    goToSection('contact');
  };

  return (
    <section ref={rootRef} id="services" className="services section" data-section="Services" aria-labelledby="services-heading">
      <div className="services__head">
        <p className="overline"><span className="overline__num">(02)</span> What We Do</p>
        <h2 id="services-heading" className="services__title" aria-label={servicesIntro.heading}>
          <span aria-hidden="true">Creative production.</span>
          <span aria-hidden="true"><em>Built to</em> make an impact.</span>
        </h2>
        <p className="services__intro">{servicesIntro.body}</p>
      </div>

      <div className="services__list" onPointerLeave={() => setActive(null)}>
        <div
          ref={previewRef}
          className={`services__preview${active !== null && open === null ? ' is-visible' : ''}`}
          aria-hidden="true"
        >
          {services.map((s, i) => {
            const image = img(s.image);
            return (
              <img
                key={s.id}
                src={image.src.replace('-1280.', '-640.')}
                alt=""
                loading="lazy"
                className={i === active ? 'is-active' : ''}
              />
            );
          })}
        </div>

        <ol>
          {services.map((service, i) => {
            const expanded = open === i;
            const image = img(service.image);
            return (
              <li key={service.id} id={service.id} className={`svc${expanded ? ' is-open' : ''}${active === i ? ' is-hover' : ''}`}>
                <span className="svc__line" aria-hidden="true" />
                <button
                  type="button"
                  className="svc__row"
                  aria-expanded={expanded}
                  aria-controls={`${service.id}-panel`}
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') setActive(i); }}
                  onFocus={() => setActive(i)}
                  onClick={() => setOpen(expanded ? null : i)}
                  data-cursor={expanded ? 'close' : 'open'}
                >
                  <span className="svc__num mono">{pad2(i + 1)}</span>
                  <span className="svc__title">{service.title}</span>
                  <span className="svc__summary">{service.summary}</span>
                  <span className="svc__plus" aria-hidden="true" />
                </button>
                <div id={`${service.id}-panel`} className="svc__panel" role="region" aria-label={service.title}>
                  <div className="svc__panel-inner">
                    <figure className="svc__media">
                      <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 600px) 90vw, 30vw" alt={image.alt} loading="lazy" />
                    </figure>
                    <div className="svc__detail">
                      <p className="svc__desc">{service.description}</p>
                      {service.tags.length > 0 && (
                        <ul className="svc__tags" aria-label="Includes">
                          {service.tags.map((t) => <li key={t} className="mono">{t}</li>)}
                        </ul>
                      )}
                      <button type="button" className="glass-btn glass-btn--brand" onClick={() => startBrief(service.title)} tabIndex={expanded ? 0 : -1}>
                        Start a brief →
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="services__foot">
        <p>Not sure which service fits? <span className="services__foot-dim">Tell us what you're making — we'll help you scope it.</span></p>
        <button type="button" className="glass-btn" onClick={() => goToSection('contact')}>Start a project →</button>
      </div>
    </section>
  );
}
