import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { sound } from '../../audio/SoundEngine';
import { img } from '../../data/images';
import { REVEAL_IMAGES } from '../../data/scenes';
import { LOGO } from '../../utils/assets';

type Props = { onComplete: () => void; reducedMotion: boolean };

/**
 * Logo, three photographs and the tagline, stacked in a column so the layout
 * never changes size mid-animation. Everything moves with opacity/transform
 * only — no clip slits — and the whole group dissolves into the site.
 */
export function BrandReveal({ onComplete, reducedMotion }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const done = () => doneRef.current();
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.timeline().from(root, { autoAlpha: 0, duration: 0.3 }).add(done, 1.4);
        return;
      }
      sound.swell();
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo(q('.reveal__logo'), { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, 0.1)
        .fromTo(q('.reveal__panel'), { autoAlpha: 0, y: 70, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.4, stagger: 0.12 }, 0.45)
        .fromTo(q('.reveal__panel img'), { scale: 1.35 }, { scale: 1.04, duration: 2.6, stagger: 0.12, ease: 'power2.out' }, 0.45)
        .fromTo(q('.reveal__title .line-mask > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.09 }, 1.0)
        .fromTo(q('.reveal__meta'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 1.5)
        // Hold, then everything dissolves together into the site.
        .to(q('.reveal__group'), { autoAlpha: 0, y: -24, scale: 1.03, duration: 0.9, ease: 'power2.inOut' }, 3.1)
        .add(done, 3.3);
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  const panels = REVEAL_IMAGES.map(img);

  return (
    <section ref={rootRef} className="reveal" aria-label="Zcorebit Media — Your vision in motion">
      <div className="reveal__group">
        <img className="reveal__logo" src={LOGO.white} alt="Zcorebit Media" />
        <div className="reveal__panels" aria-hidden="true">
          {panels.map((image) => (
            <figure key={image.key} className="reveal__panel" style={{ background: image.color }}>
              <img src={image.src} srcSet={image.srcSet} sizes="30vw" alt="" />
            </figure>
          ))}
        </div>
        <h2 className="reveal__title" aria-label="Your vision in motion.">
          <span className="line-mask" aria-hidden="true"><span>Your vision <em>in</em> motion.</span></span>
        </h2>
        <p className="reveal__meta mono">Creative production house · Lahore, Pakistan</p>
      </div>
    </section>
  );
}
