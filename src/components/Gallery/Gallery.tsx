import { useEffect, useMemo, useRef, useState } from 'react';
import { useExperience } from '../../context/ExperienceContext';
import { projects } from '../../data/content';
import { img, imgUrl } from '../../data/images';
import { supportsWebGL } from '../../utils/dom';
import { useTransition } from '../Transitions/TransitionContext';
import type { GalleryItem, GalleryScene as Scene } from './GalleryScene';
import './gallery.scss';

type Props = {
  /** "section" lives inside the home page; "fullscreen" is the /gallery route. */
  mode: 'section' | 'fullscreen';
};

export function buildGalleryItems(): GalleryItem[] {
  return projects.flatMap((p) =>
    p.images.map((key) => {
      const image = img(key);
      return {
        key,
        slug: p.slug,
        label: `${p.client} — ${p.title}`,
        category: p.category,
        aspect: image.aspect,
        color: image.color,
        small: imgUrl(key, 640),
        large: imgUrl(key, 1280),
      };
    }),
  );
}

export function Gallery({ mode }: Props) {
  const { reducedMotion, touch, introDone } = useExperience();
  const { go } = useTransition();
  const goRef = useRef(go);
  goRef.current = go;
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [hovered, setHovered] = useState<GalleryItem | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [webgl] = useState(supportsWebGL);
  const [ready, setReady] = useState(false);
  const items = useMemo(buildGalleryItems, []);
  const fullscreen = mode === 'fullscreen';

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !webgl || !introDone) return;
    let disposed = false;
    let io: IntersectionObserver | null = null;

    // Don't download three.js, create a WebGL context or fetch textures until
    // the gallery is about to scroll into view.
    const near = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      near.disconnect();
      void create();
    }, { rootMargin: '100% 0px' });
    near.observe(stage);

    const create = () => import('./GalleryScene').then(({ GalleryScene }) => {
      if (disposed) return;
      const scene = new GalleryScene(stage, items, {
        wheel: fullscreen,
        reducedMotion,
        compact: touch,
        onHover: setHovered,
        onInteract: () => setInteracted(true),
        onOpen: (item, rect) => {
          goRef.current(`/work/${item.slug}`, {
            flight: { imageKey: item.key, rect },
            origin: fullscreen ? 'gallery' : 'home',
          });
        },
      });
      sceneRef.current = scene;
      setReady(true);
      io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? scene.start() : scene.stop()), { rootMargin: '120px' });
      io.observe(stage);
    });

    return () => {
      disposed = true;
      near.disconnect();
      io?.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [items, fullscreen, reducedMotion, touch, webgl, introDone]);

  // Escape leaves the fullscreen gallery.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.menu[aria-hidden="false"]')) go('/');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, go]);

  useEffect(() => {
    if (fullscreen) stageRef.current?.focus({ preventScroll: true });
  }, [fullscreen]);

  const hint = touch
    ? fullscreen ? 'Drag to explore · Tap a frame to open' : 'Swipe sideways to explore · Tap to open'
    : fullscreen ? 'Drag · Scroll · Arrow keys · R to reset · Esc to exit' : 'Drag to explore · Click a frame to open';

  return (
    <div className={`gallery gallery--${mode}${ready ? ' is-ready' : ''}`}>
      {webgl ? (
        <div
          ref={stageRef}
          className="gallery__stage"
          tabIndex={0}
          role="application"
          aria-roledescription="Interactive photo gallery"
          aria-label="Project gallery. Drag or use arrow keys to explore, Enter to open the centred frame, R to reset."
          data-cursor="drag"
        />
      ) : (
        <FallbackGrid items={items} onOpen={(item) => go(`/work/${item.slug}`, { origin: fullscreen ? 'gallery' : 'home' })} />
      )}

      <div className="gallery__vignette" aria-hidden="true" />

      <div className={`gallery__caption${hovered ? ' is-visible' : ''}`} aria-hidden="true">
        <span className="mono gallery__cat">{hovered?.category}</span>
        <span className="gallery__label">{hovered?.label}</span>
      </div>

      <div className="gallery__controls">
        <p className={`gallery__hint mono${interacted ? ' is-dim' : ''}`}>{hint}</p>
        {webgl && (
          <button type="button" className="glass-btn" onClick={() => sceneRef.current?.reset()}>
            Reset view
          </button>
        )}
        {fullscreen ? (
          <button type="button" className="glass-btn" onClick={() => go('/')}>
            ← Back
          </button>
        ) : (
          <button type="button" className="glass-btn glass-btn--solid" onClick={() => go('/gallery', { origin: 'home' })} data-cursor="open">
            Open fullscreen ↗
          </button>
        )}
      </div>

      {/* Crawlable, keyboard-friendly index of the same work. */}
      <ul className="sr-only" aria-label="Projects in the gallery">
        {projects.map((p) => (
          <li key={p.slug}>
            <a href={`${import.meta.env.BASE_URL}work/${p.slug}`} onClick={(e) => { e.preventDefault(); go(`/work/${p.slug}`); }}>
              {p.client} — {p.title} ({p.category})
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** No-WebGL fallback: a horizontally draggable strip of real links. */
function FallbackGrid({ items, onOpen }: { items: GalleryItem[]; onOpen: (item: GalleryItem) => void }) {
  return (
    <div className="gallery__fallback">
      {items.map((item) => (
        <button key={item.key} type="button" className="gallery__fallback-item" onClick={() => onOpen(item)} style={{ aspectRatio: String(item.aspect) }}>
          <img src={item.small} alt={img(item.key).alt} loading="lazy" />
          <span className="mono">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
