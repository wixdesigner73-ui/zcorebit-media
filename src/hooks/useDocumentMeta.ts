import { useEffect } from 'react';
import { asset } from '../utils/assets';

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://media.zcorebit.com').replace(/\/$/, '');

type Meta = { title: string; description: string; path: string; image?: string };

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  document.querySelector(selector)?.setAttribute(attr, value);
}

/** Per-route title, description, canonical and Open Graph tags. */
export function useDocumentMeta({ title, description, path, image }: Meta) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    const img = image ? `${SITE_URL}${asset(image)}` : `${SITE_URL}/assets/og-image.jpg`;
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', url);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:image"]', 'content', img);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', img);
  }, [title, description, path, image]);
}
