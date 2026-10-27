import { useEffect, useRef } from 'react';
import { sound } from '../../audio/SoundEngine';
import { useExperience } from '../../context/ExperienceContext';
import { useSound } from '../../context/SoundContext';
import { inertProps } from '../../utils/dom';
import './sound-control.scss';

const BARS = 5;
const BINS = [1, 2, 4, 7, 12];

/**
 * Fixed sound toggle. The bars are driven by the real analyser output, so they
 * only move when audio is actually playing.
 */
export function SoundControl() {
  const { playing, toggle } = useSound();
  const { introActive } = useExperience();
  const barsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bars = barsRef.current ? [...barsRef.current.children] as HTMLElement[] : [];
    let frame = 0;
    let data: Uint8Array | null = null;
    const draw = () => {
      const analyser = sound.analyser;
      if (analyser && playing) {
        data ??= new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        bars.forEach((bar, i) => {
          // Low/mid bins carry most of the ambient score's energy.
          const bin = data![BINS[i]] / 255;
          bar.style.transform = `scaleY(${0.18 + Math.min(1, Math.pow(bin, 1.6) * 1.4) * 0.82})`;
        });
      } else {
        bars.forEach((bar) => { bar.style.transform = 'scaleY(0.18)'; });
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // "M" toggles sound from anywhere (except while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'm' || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
      toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  return (
    <div className={`sound${introActive ? ' is-hidden' : ''}`} {...inertProps(introActive)}>
      <span className="sound__label mono" aria-hidden="true">{playing ? 'Sound on' : 'Sound off'}</span>
      <button
        type="button"
        className={`sound__btn${playing ? ' is-playing' : ''}`}
        aria-pressed={playing}
        aria-label={playing ? 'Mute sound (M)' : 'Play sound (M)'}
        onClick={toggle}
      >
        <span ref={barsRef} className="sound__bars" aria-hidden="true">
          {Array.from({ length: BARS }, (_, i) => <i key={i} />)}
        </span>
      </button>
    </div>
  );
}
