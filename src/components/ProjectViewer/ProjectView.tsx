import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useExperience } from '../../context/ExperienceContext';
import { scrollToTarget } from '../../context/ScrollContext';
import type { Project } from '../../data/content';
import { projects } from '../../data/content';
import { img } from '../../data/images';
import { pad2 } from '../../utils/math';
import { BRIEF_EVENT } from '../Services/Services';
import { useTransition } from '../Transitions/TransitionContext';
import { getOrigin, rectOf, takeFlight } from '../Transitions/transitionStore';
import './project.scss';

type Props = { project: Project };

export function ProjectView({ project }: Props) {
  const { reducedMotion } = useExperience();
  const { go, goToSection } = useTransition();
  const rootRef = useRef<HTMLElement>(null);
  const coverRef = useRef<HTMLElement>(null);
  const index = projects.findIndex((p) => p.slug === project.slug);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const origin = getOrigin();
  const backLabel = origin === 'gallery' ? 'Back to gallery' : origin === 'work' ? 'Back to work' : 'All work';
  const cover = img(project.images[0]);
  const exhibit = project.images.slice(1).map(img);

  const back = () => {
    if (origin === 'gallery') go('/gallery');
    else goToSection('work');
  };

  // Shared-element flight from the tile the visitor clicked, else a reveal.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    scrollToTarget(0, { immediate: true });
    const root = rootRef.current;
    const coverEl = coverRef.current;
    if (!root || !coverEl) return;
    const q = gsap.utils.selector(root);
    const flight = takeFlight();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      if (flight && !reducedMotion) {
        const flyer = document.createElement('figure');
        flyer.className = 'flight';
        const image = img(flight.imageKey);
        flyer.innerHTML = `<img src="${image.src}" alt="" />`;
        Object.assign(flyer.style, { left: `${flight.rect.x}px`, top: `${flight.rect.y}px`, width: `${flight.rect.w}px`, height: `${flight.rect.h}px` });
        document.body.appendChild(flyer);
        gsap.set(coverEl, { autoAlpha: 0 });
        const target = rectOf(coverEl);
        tl.to(flyer, { left: target.x, top: target.y, width: target.w, height: target.h, borderRadius: 12, duration: 1.15, ease: 'expo.inOut' }, 0)
          .set(coverEl, { autoAlpha: 1 })
          .add(() => flyer.remove());
      } else if (!reducedMotion) {
        tl.fromTo(coverEl, { clipPath: 'inset(30% 12% 30% 12% round 12px)' }, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.4, ease: 'expo.inOut' }, 0.1)
          .fromTo(coverEl.querySelector('img'), { scale: 1.3 }, { scale: 1, duration: 1.8 }, 0.1);
      }
      if (!reducedMotion) {
        tl.from(q('.project__client .line-mask > span'), { yPercent: 110, duration: 1.3, stagger: 0.05 }, 0.25)
          .from(q('.project__eyebrow, .project__name, .project__top > *'), { autoAlpha: 0, y: 20, duration: 1, stagger: 0.06 }, 0.45);

        // Exhibition: frames rise in and drift as you scroll.
        q('.exhibit__frame').forEach((frame) => {
          gsap.from(frame, { clipPath: 'inset(18% 0% 18% 0% round 12px)', y: 60, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: frame, start: 'top 90%' } });
          gsap.fromTo(frame.querySelector('img'), { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
        gsap.from(q('.project__info > *'), { y: 40, autoAlpha: 0, stagger: 0.08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: q('.project__info')[0], start: 'top 85%' } });
      }
    }, root);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      ctx.revert();
      document.querySelectorAll('.flight').forEach((el) => el.remove());
    };
  }, [project.slug, reducedMotion]);

  // ← / → between projects, Esc returns to where the visitor came from.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select') || document.querySelector('.menu[aria-hidden="false"]')) return;
      if (e.key === 'ArrowRight') go(`/work/${next.slug}`);
      if (e.key === 'ArrowLeft') go(`/work/${prev.slug}`);
      if (e.key === 'Escape') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const startSimilar = () => {
    window.dispatchEvent(new CustomEvent(BRIEF_EVENT, { detail: '' }));
    goToSection('contact');
  };

  const nextCover = img(next.images[0]);

  return (
    <main ref={rootRef} id="main" className="project">
      <div className="project__top">
        <button type="button" className="glass-btn" onClick={back} data-cursor="close">← {backLabel}</button>
      </div>

      <header className="project__hero">
        <p className="project__eyebrow mono">
          <span>{project.category}</span>
          <span>{pad2(index + 1)} / {pad2(projects.length)}</span>
        </p>
        <h1 className="project__client" aria-label={`${project.client} — ${project.title}`}>
          <span className="line-mask" aria-hidden="true"><span>{project.client}</span></span>
        </h1>
        <p className="project__name" aria-hidden="true"><em>{project.title}</em></p>
      </header>

      <figure ref={coverRef} className="project__cover" style={{ aspectRatio: String(cover.aspect), background: cover.color, ['--ar' as string]: cover.aspect }}>
        <img src={cover.src} srcSet={cover.srcSet} sizes="(max-width: 1024px) 96vw, 80vw" alt={cover.alt} />
      </figure>

      <section className="project__info" aria-label="About the project">
        <p className="overline">The project</p>
        <p className="project__desc">{project.description}</p>
        <dl className="project__facts">
          <div><dt className="mono">Client</dt><dd>{project.client}</dd></div>
          <div><dt className="mono">Category</dt><dd>{project.category}</dd></div>
          <div><dt className="mono">Project</dt><dd>{project.title}</dd></div>
        </dl>
        <button type="button" className="glass-btn glass-btn--brand" onClick={startSimilar}>Start a similar project →</button>
      </section>

      <section className="exhibit" aria-label={`${project.client} gallery`}>
        {exhibit.map((image, i) => (
          <figure key={image.key} className={`exhibit__frame exhibit__frame--${i + 1}`} style={{ aspectRatio: String(image.aspect), background: image.color }}>
            <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 1024px) 96vw, 60vw" alt={image.alt} loading="lazy" />
          </figure>
        ))}
      </section>

      <nav className="project__next" aria-label="Next project">
        <a
          href={`${import.meta.env.BASE_URL}work/${next.slug}`}
          data-cursor="open"
          onClick={(e) => {
            e.preventDefault();
            const figure = e.currentTarget.querySelector('figure');
            go(`/work/${next.slug}`, { flight: figure ? { imageKey: nextCover.key, rect: rectOf(figure) } : undefined });
          }}
        >
          <span className="mono project__next-k">Next project</span>
          <span className="project__next-client">{next.client}</span>
          <span className="project__next-title"><em>{next.title}</em></span>
          <figure className="project__next-media">
            <img src={nextCover.src} srcSet={nextCover.srcSet} sizes="60vw" alt="" loading="lazy" />
          </figure>
        </a>
      </nav>

      <div className="project__pager" role="group" aria-label="Project navigation">
        <button type="button" className="glass-btn" onClick={() => go(`/work/${prev.slug}`)} aria-label={`Previous project: ${prev.client}`}>←</button>
        <span className="mono">{pad2(index + 1)} / {pad2(projects.length)}</span>
        <button type="button" className="glass-btn" onClick={() => go(`/work/${next.slug}`)} aria-label={`Next project: ${next.client}`}>→</button>
      </div>
    </main>
  );
}
