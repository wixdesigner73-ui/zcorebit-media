import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { sound } from '../../audio/SoundEngine';
import { img } from '../../data/images';
import { REVEAL_IMAGES } from '../../data/scenes';
import { LOGO } from '../../utils/assets';

type Props = { onComplete: () => void; reducedMotion: boolean };

export function BrandReveal({ onComplete, reducedMotion }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const onComplete = () => doneRef.current();
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(q('.reveal__panel'), { clipPath: 'inset(0% 0% 0% 0%)' });
        gsap.timeline().from(root, { autoAlpha: 0, duration: 0.3 }).add(onComplete, 1.2);
        return;
      }
      sound.swell();
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo(q('.reveal__logo'), { clipPath: 'inset(0% 100% 0% 0%)', scale: 1.08, filter: 'blur(10px)' }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power3.inOut' }, 0.15)
        .to(q('.reveal__logo'), { y: () => -window.innerHeight * 0.3, scale: 0.62, duration: 1.3, ease: 'power3.inOut' }, 1.25)
        .fromTo(q('.reveal__panel'), { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, stagger: 0.12, ease: 'expo.inOut' }, 1.15)
        .fromTo(q('.reveal__panel img'), { scale: 1.4 }, { scale: 1.06, duration: 2.6, stagger: 0.12 }, 1.15)
        .fromTo(q('.reveal__panel'), { rotationY: (i: number) => [26, 0, -26][i], z: -260 }, { rotationY: (i: number) => [14, 0, -14][i], z: 0, duration: 2.2, stagger: 0.12 }, 1.15)
        .fromTo(q('.reveal__title .line-mask > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.08 }, 1.9)
        .fromTo(q('.reveal__title em'), { rotationX: -95, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 2.25)
        .fromTo(q('.reveal__meta'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 2.4)
        // Push through the composition into the site.
        .to(q('.reveal__panel'), { scale: 1.6, z: 200, autoAlpha: 0, duration: 1.4, stagger: 0.05, ease: 'power3.in' }, 4.1)
        .to(q('.reveal__title, .reveal__logo, .reveal__meta'), { autoAlpha: 0, y: '-=20', duration: 0.8, ease: 'power2.in' }, 4.2)
        .add(onComplete, 4.6);
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  const panels = REVEAL_IMAGES.map(img);

  return (
    <section ref={rootRef} className="reveal" aria-label="Zcorebit Media — Your vision in motion">
      <div className="reveal__panels" aria-hidden="true">
        {panels.map((image) => (
          <figure key={image.key} className="reveal__panel" style={{ background: image.color }}>
            <img src={image.src} srcSet={image.srcSet} sizes="30vw" alt="" />
          </figure>
        ))}
      </div>
      <div className="reveal__shade" />
      <img className="reveal__logo" src={LOGO.white} alt="Zcorebit Media" />
      <h2 className="reveal__title" aria-label="Your vision in motion.">
        <span className="line-mask" aria-hidden="true"><span>Your vision</span></span>
        <span className="line-mask reveal__line" aria-hidden="true">
          <span><em>in</em> motion.</span>
        </span>
      </h2>
      <p className="reveal__meta mono">Creative production house · Lahore, Pakistan</p>
    </section>
  );
}
