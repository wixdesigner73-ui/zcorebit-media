import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useExperience } from '../../context/ExperienceContext';
import { useActiveSection } from '../../hooks/useActiveSection';
import { pad2 } from '../../utils/math';
import { inertProps } from '../../utils/dom';
import { LOGO } from '../../utils/assets';
import { useTransition } from '../Transitions/TransitionContext';
import { Menu } from './Menu';
import './navigation.scss';

export function Header() {
  const { menuOpen, setMenuOpen, introActive } = useExperience();
  const { go, goToSection } = useTransition();
  const location = useLocation();
  const section = useActiveSection();
  const menuButton = useRef<HTMLButtonElement>(null);
  const onHome = location.pathname === '/';

  // Return focus to the trigger when the menu closes.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !menuOpen) menuButton.current?.focus({ preventScroll: true });
    wasOpen.current = menuOpen;
  }, [menuOpen]);

  const label = onHome
    ? `${pad2(section.index)} — ${section.label}`
    : location.pathname.startsWith('/gallery')
      ? 'The archive'
      : location.pathname.startsWith('/work')
        ? 'Project'
        : '';

  return (
    <>
      <header className={`header${introActive ? ' is-hidden' : ''}${menuOpen ? ' is-menu' : ''}`} {...inertProps(introActive)}>
        <a
          className="header__logo"
          href={import.meta.env.BASE_URL}
          aria-label="Zcorebit Media — home"
          onClick={(e) => {
            e.preventDefault();
            if (onHome) goToSection('top');
            else go('/');
          }}
        >
          <img src={LOGO.white} alt="Zcorebit Media" width={180} height={49} />
        </a>

        <p className="header__section mono" aria-live="off">
          <span className="header__dot" aria-hidden="true" />
          <span key={label} className="header__label">{label}</span>
        </p>

        <div className="header__actions">
          <button className="glass-btn header__talk" type="button" onClick={() => goToSection('contact')}>
            Let’s talk
          </button>
          <button
            ref={menuButton}
            className="header__menu"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(!menuOpen)}
            data-cursor={menuOpen ? 'close' : undefined}
          >
            <span className="header__menu-lines" aria-hidden="true"><i /><i /></span>
          </button>
        </div>
      </header>
      <Menu />
    </>
  );
}
