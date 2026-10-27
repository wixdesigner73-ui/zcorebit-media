import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useExperience } from '../../context/ExperienceContext';
import { philosophy, studio } from '../../data/content';
import { img } from '../../data/images';
import { HERO_VIDEO } from '../../utils/assets';
import { pad2 } from '../../utils/math';
import { useTransition } from '../Transitions/TransitionContext';
import './about.scss';

// Words rendered in the serif italic accent.
const ACCENT = new Set(['stories']);

export function About() {
  const { reducedMotion } = useExperience();
  const { goToSection } = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      // Statement: words light up as they cross the viewport.
      gsap.fromTo(
        q('.about__word'),
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: q('.about__statement')[0], start: 'top 82%', end: 'bottom 45%', scrub: true },
        },
      );

      // Masked film frame opens to full bleed.
      gsap.fromTo(
        q('.about__frame'),
        { clipPath: 'inset(16% 24% 16% 24% round 14px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          ease: 'none',
          scrollTrigger: { trigger: q('.about__film')[0], start: 'top 85%', end: 'top 10%', scrub: true },
        },
      );
      gsap.fromTo(q('.about__frame video'), { scale: 1.3 }, {
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: q('.about__film')[0], start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.fromTo(q('.about__film-caption'), { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, ease: 'none',
        scrollTrigger: { trigger: q('.about__film')[0], start: 'top 30%', end: 'top 0%', scrub: true },
      });

      gsap.from(q('.about__copy > *'), {
        y: 40, autoAlpha: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: q('.about__copy')[0], start: 'top 80%' },
      });

      // Philosophy — pinned on larger screens, stacked on phones.
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        const words = q('.philo__word');
        const texts = q('.philo__text');
        const images = q('.philo__right .philo__image');
        const counter = q('.philo__count-current')[0];
        gsap.set(words.slice(1), { yPercent: 105 });
        gsap.set(texts.slice(1), { autoAlpha: 0, y: 20 });
        gsap.set(images.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut', duration: 1 },
          scrollTrigger: {
            trigger: q('.philo')[0],
            start: 'top top',
            end: '+=220%',
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => {
              const beat = Math.min(words.length - 1, Math.floor(self.progress * words.length * 0.999));
              if (counter) counter.textContent = pad2(beat + 1);
            },
          },
        });
        for (let i = 1; i < words.length; i++) {
          tl.to(words[i - 1], { yPercent: -105 }, `b${i}`)
            .to(words[i], { yPercent: 0 }, `b${i}`)
            .to(texts[i - 1], { autoAlpha: 0, y: -20, duration: 0.6 }, `b${i}`)
            .to(texts[i], { autoAlpha: 1, y: 0, duration: 0.6 }, `b${i}+=0.4`)
            .to(images[i], { clipPath: 'inset(0% 0% 0% 0%)' }, `b${i}`)
            .fromTo(images[i].querySelector('img'), { scale: 1.3 }, { scale: 1 }, `b${i}`)
            .to({}, { duration: 0.6 });
        }
        tl.to(q('.philo__bar-fill'), { scaleX: 1, ease: 'none', duration: tl.duration() }, 0);
      });
      mm.add('(max-width: 767px)', () => {
        q('.philo__beat').forEach((beat) => {
          gsap.from(beat, { y: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: beat, start: 'top 85%' } });
        });
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  // Only stream the film while it's on screen.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (video.preload !== 'auto') video.preload = 'auto';
        video.play().catch(() => {});
      } else video.pause();
    }, { rootMargin: '200px' });
    io.observe(video);
    return () => io.disconnect();
  }, []);

  const words = studio.craftHeading.split(' ');

  return (
    <div ref={rootRef}>
      <section id="studio" className="about section" data-section="Studio" aria-labelledby="about-heading">
        <p className="overline"><span className="overline__num">(01)</span> Our Craft</p>
        <h2 id="about-heading" className="about__statement" aria-label={studio.craftHeading}>
          {words.map((word, i) => {
            const bare = word.replace(/[.,]/g, '').toLowerCase();
            return (
              <span key={i} className="about__word" aria-hidden="true">
                {ACCENT.has(bare) ? <em>{word}</em> : word}{' '}
              </span>
            );
          })}
        </h2>

        <div className="about__copy">
          <p className="mono about__k">About Zcorebit Media</p>
          {studio.about.map((p) => <p key={p.slice(0, 20)} className="about__p">{p}</p>)}
          <p className="about__signature">{studio.signature}</p>
          <button type="button" className="glass-btn" onClick={() => goToSection('contact')}>Get in touch →</button>
        </div>
      </section>

      <div className="about__film" aria-label="Showreel">
        <div className="about__frame">
          <video
            ref={videoRef}
            src={HERO_VIDEO.src}
            poster={HERO_VIDEO.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-label="Zcorebit Media showreel (muted)"
          />
          <div className="about__film-shade" />
          <p className="about__film-caption">
            <span className="mono">Showreel</span>
            <span className="about__film-line">{studio.tagline}</span>
          </p>
        </div>
      </div>

      <section className="philo" data-section="Studio" aria-labelledby="philo-heading">
        <div className="philo__inner">
          <div className="philo__left">
            <p className="overline" id="philo-heading"><span className="overline__num">(01.b)</span> The Philosophy</p>
            <div className="philo__count mono" aria-hidden="true">
              <span className="philo__count-current">01</span>
              <span> / {pad2(philosophy.length)}</span>
            </div>
            <div className="philo__words">
              {philosophy.map((beat) => (
                <div key={beat.word} className="philo__beat">
                  <div className="philo__mask"><h3 className="philo__word">{beat.word}</h3></div>
                  <p className="philo__text">{beat.text}</p>
                  <figure className="philo__image philo__image--inline">
                    <img src={img(beat.image).src} srcSet={img(beat.image).srcSet} sizes="90vw" alt={img(beat.image).alt} loading="lazy" />
                  </figure>
                </div>
              ))}
            </div>
            <div className="philo__bar" aria-hidden="true"><span className="philo__bar-fill" /></div>
          </div>
          <div className="philo__right" aria-hidden="true">
            {philosophy.map((beat) => {
              const image = img(beat.image);
              return (
                <figure key={beat.word} className="philo__image">
                  <img src={image.src} srcSet={image.srcSet} sizes="50vw" alt="" loading="lazy" />
                </figure>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
