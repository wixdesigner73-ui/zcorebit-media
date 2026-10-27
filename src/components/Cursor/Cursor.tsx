import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useExperience } from '../../context/ExperienceContext';
import './cursor.scss';

const LABELS: Record<string, string> = {
  drag: 'Drag',
  view: 'View',
  open: 'Open',
  close: 'Close',
  explore: 'Explore',
  enter: 'Enter',
};

/**
 * Lightweight contextual cursor. Any element with data-cursor="drag|view|..."
 * switches the label; links and buttons enlarge the ring. Disabled on touch.
 */
export function Cursor() {
  const { touch, reducedMotion } = useExperience();
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const resetRef = useRef<() => void>(() => {});
  const { pathname } = useLocation();

  // The page under a still pointer changes on navigation — drop stale labels.
  useEffect(() => { resetRef.current(); }, [pathname]);

  useEffect(() => {
    if (touch) return;
    const ring = ringRef.current!;
    const dot = dotRef.current!;
    const label = labelRef.current!;
    document.documentElement.classList.add('has-cursor');

    let x = -100, y = -100, rx = -100, ry = -100;
    let visible = false;
    let frame = 0;
    let state = '';

    const setState = (next: string) => {
      if (next === state) return;
      state = next;
      ring.dataset.state = next;
      label.textContent = LABELS[next] ?? '';
    };
    resetRef.current = () => setState('');

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      if (!visible) { visible = true; rx = x; ry = y; ring.classList.add('is-visible'); dot.classList.add('is-visible'); }
      const target = e.target as Element | null;
      const tagged = target?.closest<HTMLElement>('[data-cursor]');
      if (tagged?.dataset.cursor) setState(tagged.dataset.cursor);
      else if (target?.closest('a, button, [role="button"], label, select')) setState('link');
      else if (target?.closest('input, textarea')) setState('text');
      else setState('');
    };
    const onLeave = () => { visible = false; ring.classList.remove('is-visible'); dot.classList.remove('is-visible'); };
    const onDown = () => ring.classList.add('is-down');
    const onUp = () => ring.classList.remove('is-down');

    const loop = () => {
      const k = reducedMotion ? 1 : 0.2;
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [touch, reducedMotion]);

  if (touch) return null;
  return (
    <>
      <div ref={ringRef} className="cursor" aria-hidden="true">
        <span ref={labelRef} className="cursor__label" />
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
