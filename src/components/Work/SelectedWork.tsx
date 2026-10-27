import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useExperience } from '../../context/ExperienceContext';
import { scrollToTarget } from '../../context/ScrollContext';
import { projects, workIntro } from '../../data/content';
import { img } from '../../data/images';
import { pad2 } from '../../utils/math';
import { useTransition } from '../Transitions/TransitionContext';
import { rectOf } from '../Transitions/transitionStore';
import './work.scss';

export function SelectedWork() {
  const { reducedMotion } = useExperience();
  const { go } = useTransition();
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track || reducedMotion) return;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      gsap.from(q('.work__head > *'), {
        y: 50, autoAlpha: 0, stagger: 0.08, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: root, start: 'top 75%' },
      });

      const mm = gsap.matchMedia();
      mm.add('(min-width: 1025px)', () => {
        const distance = () => track.scrollWidth - window.innerWidth + 8;
        const scroller = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: q('.work__pin')[0],
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        // Parallax inside each frame + reveal as it enters.
        q('.work__card:not(.work__card--cta)').forEach((card) => {
          const image = card.querySelector('img');
          gsap.fromTo(image, { xPercent: -8 }, {
            xPercent: 8, ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: scroller, start: 'left right', end: 'right left', scrub: true },
          });
          gsap.from(card.querySelector('.work__figure'), {
            clipPath: 'inset(12% 0% 12% 0% round 12px)', ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: scroller, start: 'left right', end: 'left 45%', scrub: true },
          });
          gsap.from(card.querySelector('.work__meta'), {
            y: 40, autoAlpha: 0, ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: scroller, start: 'left 85%', end: 'left 45%', scrub: true },
          });
        });
        gsap.to(q('.work__progress-fill'), {
          scaleX: 1, ease: 'none',
          scrollTrigger: { trigger: q('.work__pin')[0], start: 'top top', end: () => `+=${distance()}`, scrub: true },
        });
      });
      mm.add('(max-width: 1024px)', () => {
        q('.work__card:not(.work__card--cta)').forEach((card) => {
          gsap.from(card, { y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
          gsap.fromTo(card.querySelector('img'), { yPercent: -6 }, {
            yPercent: 6, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={rootRef} id="work" className="work" data-section="Work" aria-labelledby="work-heading">
      <div className="work__head section">
        <p className="overline"><span className="overline__num">(03)</span> Our Work</p>
        <h2 id="work-heading" className="work__title" aria-label={workIntro.heading}>
          <span aria-hidden="true">Films that move</span>
          <span aria-hidden="true">brands <em>forward.</em></span>
        </h2>
        <p className="work__intro">{workIntro.body}</p>
      </div>

      <div className="work__pin">
        <div ref={trackRef} className="work__track">
          {projects.map((project, i) => {
            const cover = img(project.images[0]);
            return (
              <article key={project.slug} className="work__card">
                <a
                  href={`${import.meta.env.BASE_URL}work/${project.slug}`}
                  className="work__link"
                  data-cursor="view"
                  onClick={(e) => {
                    e.preventDefault();
                    const figure = e.currentTarget.querySelector('.work__figure');
                    go(`/work/${project.slug}`, {
                      origin: 'work',
                      flight: figure ? { imageKey: cover.key, rect: rectOf(figure) } : undefined,
                    });
                  }}
                >
                  <figure className="work__figure" style={{ background: cover.color }}>
                    <img src={cover.src} srcSet={cover.srcSet} sizes="(max-width: 1024px) 92vw, 56vw" alt={cover.alt} loading="lazy" />
                  </figure>
                  <div className="work__meta">
                    <span className="work__index mono">{pad2(i + 1)} / {pad2(projects.length)}</span>
                    <h3 className="work__client">{project.client}</h3>
                    <p className="work__name"><em>{project.title}</em></p>
                    <span className="work__cat mono">{project.category}</span>
                    <p className="work__summary">{project.summary}</p>
                  </div>
                </a>
              </article>
            );
          })}
          <article className="work__card work__card--cta">
            <p className="overline">Explore everything</p>
            <p className="work__cta-title">Step inside <em>the archive.</em></p>
            <p className="work__summary">Every frame from every project, in one explorable space.</p>
            <div className="work__cta-actions">
              <button type="button" className="glass-btn glass-btn--solid" onClick={() => scrollToTarget('#gallery')}>Enter the gallery ↓</button>
            </div>
          </article>
        </div>
        <div className="work__progress" aria-hidden="true"><span className="work__progress-fill" /></div>
      </div>
    </section>
  );
}
