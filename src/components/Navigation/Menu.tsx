import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useExperience } from '../../context/ExperienceContext';
import { contact, studio } from '../../data/content';
import { img } from '../../data/images';
import { NAV } from '../../data/navigation';
import { pad2 } from '../../utils/math';
import { inertProps } from '../../utils/dom';
import { useTransition } from '../Transitions/TransitionContext';

export function Menu() {
  const { menuOpen, setMenuOpen, replayIntro, reducedMotion } = useExperience();
  const { go, goToSection } = useTransition();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(0);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const d = reducedMotion ? 0.01 : 1;
    if (menuOpen) {
      setMounted(true);
      gsap.killTweensOf([root, q('.menu__link'), q('.menu__foot > *'), q('.menu__preview')]);
      gsap.timeline()
        .set(root, { visibility: 'visible' })
        .fromTo(root, { clipPath: 'inset(0% 0% 100% 0% round var(--radius))' }, { clipPath: 'inset(0% 0% 0% 0% round var(--radius))', duration: 0.9 * d, ease: 'expo.inOut' })
        .fromTo(q('.menu__link'), { yPercent: 110 }, { yPercent: 0, duration: 1 * d, stagger: 0.05 * d, ease: 'expo.out' }, 0.35 * d)
        .fromTo(q('.menu__preview'), { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 1 * d, ease: 'expo.out' }, 0.45 * d)
        .fromTo(q('.menu__foot > *'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8 * d, stagger: 0.05 * d, ease: 'expo.out' }, 0.55 * d);
      requestAnimationFrame(() => (root.querySelector('.menu__link') as HTMLElement | null)?.focus({ preventScroll: true }));
    } else if (mounted) {
      gsap.timeline()
        .to(root, { clipPath: 'inset(0% 0% 100% 0% round var(--radius))', duration: 0.75 * d, ease: 'expo.inOut' })
        .set(root, { visibility: 'hidden' });
    }
  }, [menuOpen, reducedMotion, mounted]);

  // Escape closes; Tab is kept inside the dialog.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenuOpen(false); return; }
      if (e.key !== 'Tab' || !rootRef.current) return;
      const focusables = [...rootRef.current.querySelectorAll<HTMLElement>('a, button')];
      const trigger = document.querySelector<HTMLElement>('.header__menu');
      const all = trigger ? [trigger, ...focusables] : focusables;
      const i = all.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); all[all.length - 1].focus(); }
      else if (!e.shiftKey && i === all.length - 1) { e.preventDefault(); all[0].focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, setMenuOpen]);

  return (
    <div
      ref={rootRef}
      id="site-menu"
      className="menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!menuOpen}
      {...inertProps(!menuOpen)}
    >
      <div className="grain" aria-hidden="true" />
      <div className="menu__preview" aria-hidden="true">
        {NAV.map((item, i) => {
          const image = img(item.image);
          return (
            <img
              key={item.id}
              src={image.src}
              srcSet={image.srcSet}
              sizes="40vw"
              alt=""
              loading="lazy"
              className={i === hovered ? 'is-active' : ''}
            />
          );
        })}
      </div>

      <nav className="menu__nav" aria-label="Primary">
        <ol>
          {NAV.map((item, i) => (
            <li key={item.id} className="line-mask">
              <a
                className="menu__link"
                href={item.route ?? `#${item.id}`}
                onMouseEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.route) go(item.route, { origin: 'home' });
                  else goToSection(item.id);
                }}
              >
                <span className="menu__num mono">{pad2(i)}</span>
                <span className="menu__label">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="menu__foot">
        <div>
          <p className="mono menu__k">Write</p>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </div>
        <div>
          <p className="mono menu__k">Call / WhatsApp</p>
          <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
        </div>
        <div>
          <p className="mono menu__k">Studio</p>
          <a href={contact.maps} target="_blank" rel="noopener noreferrer">{contact.address}</a>
        </div>
        <div className="menu__social">
          <p className="mono menu__k">{studio.tagline}</p>
          {contact.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>
          ))}
          <button type="button" className="menu__replay" onClick={() => { navigate('/'); replayIntro(); }}>Replay intro ↺</button>
        </div>
      </div>
    </div>
  );
}
