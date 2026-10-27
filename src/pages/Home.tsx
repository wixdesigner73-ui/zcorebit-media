import { useEffect, useLayoutEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { About } from '../components/About/About';
import { Contact } from '../components/Contact/Contact';
import { GallerySection } from '../components/Gallery/GallerySection';
import { Hero } from '../components/Hero/Hero';
import { Services } from '../components/Services/Services';
import { Testimonials } from '../components/Testimonials/Testimonials';
import { takePendingSection } from '../components/Transitions/transitionStore';
import { SelectedWork } from '../components/Work/SelectedWork';
import { useExperience } from '../context/ExperienceContext';
import { scrollToTarget } from '../context/ScrollContext';
import { studio } from '../data/content';
import { NAV } from '../data/navigation';
import { setActiveSection } from '../hooks/useActiveSection';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function Home() {
  const { introDone } = useExperience();

  useDocumentMeta({
    title: 'Zcorebit Media | Premium Creative Production House in Pakistan',
    description: studio.metaDescription,
    path: '/',
  });

  // Header section indicator.
  useLayoutEffect(() => {
    const triggers = [...document.querySelectorAll<HTMLElement>('[data-section]')].map((el) => {
      const label = el.dataset.section!;
      const index = Math.max(0, NAV.findIndex((n) => n.label === label));
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => { if (self.isActive) setActiveSection(index, label); },
      });
    });
    return () => triggers.forEach((t) => t.kill());
  }, []);

  // Re-measure once late content (fonts, images) has settled.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);
    const t = setTimeout(refresh, 1500);
    return () => { window.removeEventListener('load', refresh); clearTimeout(t); };
  }, []);

  // Arriving from another page with a section in mind (menu, "Let's talk").
  useEffect(() => {
    if (!introDone) return;
    const id = takePendingSection();
    if (id) setTimeout(() => scrollToTarget(`#${id}`, { immediate: true }), 60);
  }, [introDone]);

  return (
    <main id="main">
      <Hero />
      <About />
      <Services />
      <SelectedWork />
      <GallerySection />
      <Testimonials />
      <Contact />
    </main>
  );
}
