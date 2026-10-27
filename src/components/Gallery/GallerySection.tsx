import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useExperience } from '../../context/ExperienceContext';
import { projects } from '../../data/content';
import { Gallery } from './Gallery';

export function GallerySection() {
  const { reducedMotion } = useExperience();
  const rootRef = useRef<HTMLElement>(null);
  const frames = projects.reduce((n, p) => n + p.images.length, 0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      gsap.from(q('.gsec__head > *'), {
        y: 40, autoAlpha: 0, stagger: 0.08, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: root, start: 'top 75%' },
      });
      // The gallery window grows from an inset frame to full width.
      gsap.fromTo(q('.gsec__window'), { clipPath: 'inset(8% 10% 8% 10% round 20px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 16px)', ease: 'none',
        scrollTrigger: { trigger: q('.gsec__window')[0], start: 'top 95%', end: 'top 15%', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={rootRef} id="gallery" className="gsec" data-section="Gallery" aria-labelledby="gallery-heading">
      <div className="gsec__head">
        <p className="overline"><span className="overline__num">(04)</span> The Archive</p>
        <h2 id="gallery-heading" className="gsec__title">Explore <em>every</em> frame.</h2>
        <p className="gsec__meta mono">{frames} frames · {projects.length} projects · drag, click, open</p>
      </div>
      <div className="gsec__window">
        <Gallery mode="section" />
      </div>
    </section>
  );
}
