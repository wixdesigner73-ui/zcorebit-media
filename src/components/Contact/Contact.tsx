import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useExperience } from '../../context/ExperienceContext';
import { scrollToTarget } from '../../context/ScrollContext';
import { contact, studio } from '../../data/content';
import { LOGO } from '../../utils/assets';
import { ContactForm } from './ContactForm';
import './contact.scss';

export function Contact() {
  const { reducedMotion } = useExperience();
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      gsap.from(q('.contact__title .line-mask > span'), {
        yPercent: 110, duration: 1.4, stagger: 0.1, ease: 'expo.out',
        scrollTrigger: { trigger: q('.contact__title')[0], start: 'top 80%' },
      });
      gsap.from(q('.contact__lead > *, .contact__channels > *'), {
        y: 30, autoAlpha: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out',
        scrollTrigger: { trigger: q('.contact__lead')[0], start: 'top 85%' },
      });
      gsap.from(q('.cform'), {
        y: 50, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: q('.cform')[0], start: 'top 88%' },
      });
      // The logo rises out of the floor as the journey ends.
      gsap.fromTo(q('.contact__logo'), { yPercent: 40, clipPath: 'inset(0% 0% 100% 0%)' }, {
        yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: q('.contact__logo')[0], start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={rootRef} id="contact" className="contact" data-section="Contact" aria-labelledby="contact-heading">
      <div className="contact__glow" aria-hidden="true" />
      <div className="contact__inner">
        <p className="overline"><span className="overline__num">(06)</span> Get in Touch</p>
        <h2 id="contact-heading" className="contact__title" aria-label={contact.heading}>
          <span className="line-mask" aria-hidden="true"><span>Have a</span></span>
          <span className="line-mask" aria-hidden="true"><span><em>project</em> in mind?</span></span>
        </h2>

        <div className="contact__grid">
          <div className="contact__lead">
            <p className="contact__body">{contact.body}</p>
            <p className="contact__badge mono"><span aria-hidden="true" />{contact.responseTime}</p>
            <div className="contact__ctas">
              <a className="glass-btn glass-btn--brand" href={contact.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp Us</a>
              <a className="glass-btn" href={contact.phoneHref}>Call Us</a>
            </div>

            <dl className="contact__channels">
              <div>
                <dt className="mono">Email</dt>
                <dd><a href={`mailto:${contact.email}`} className="contact__link">{contact.email}</a></dd>
              </div>
              <div>
                <dt className="mono">Phone / WhatsApp</dt>
                <dd><a href={contact.phoneHref} className="contact__link">{contact.phoneDisplay}</a></dd>
              </div>
              <div>
                <dt className="mono">Studio</dt>
                <dd>
                  <address>{contact.address}</address>
                  <a href={contact.maps} target="_blank" rel="noopener noreferrer" className="contact__link contact__small">Open in Google Maps ↗</a>
                </dd>
              </div>
              <div>
                <dt className="mono">Follow</dt>
                <dd className="contact__socials">
                  {contact.socials.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="contact__link" aria-label={`Zcorebit Media on ${s.label}`}>{s.label} ↗</a>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          <ContactForm />
        </div>
      </div>

      <footer className="footer">
        <div className="footer__row">
          <p className="footer__tag">{studio.signature}</p>
          <p className="footer__line">{studio.footerLine}</p>
          <button type="button" className="footer__top mono" onClick={() => scrollToTarget(0)}>Back to top ↑</button>
        </div>
        <img className="contact__logo" src={LOGO.white} alt="Zcorebit Media" loading="lazy" />
        <p className="footer__legal mono">© {new Date().getFullYear()} Zcorebit Media. All rights reserved.</p>
      </footer>
    </section>
  );
}
