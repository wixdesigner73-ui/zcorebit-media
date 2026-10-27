import { useEffect } from 'react';
import { Gallery } from '../components/Gallery/Gallery';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function GalleryPage() {
  useDocumentMeta({
    title: 'The Archive — Interactive Gallery | Zcorebit Media',
    description: 'Explore every frame from Zcorebit Media projects in an interactive 3D gallery — brand films, hospitality, commercial and documentary work.',
    path: '/gallery',
  });

  // The fullscreen gallery owns wheel input — lock page scroll.
  useEffect(() => {
    document.documentElement.classList.add('scroll-locked');
    return () => document.documentElement.classList.remove('scroll-locked');
  }, []);

  return (
    <main id="main">
      <h1 className="sr-only">Zcorebit Media — interactive project gallery</h1>
      <Gallery mode="fullscreen" />
    </main>
  );
}
