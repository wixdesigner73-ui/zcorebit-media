// Resolve a path inside /public against the configured base URL so the site
// works from a domain root or a GitHub Pages sub-path.
export function asset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

export const LOGO = {
  icon: asset('assets/logo/icon.png'),
  white: asset('assets/logo/logo-white.png'),
  black: asset('assets/logo/logo-black.png'),
};

export const HERO_VIDEO = {
  src: asset('assets/videos/hero.mp4'),
  poster: asset('assets/videos/hero-poster.webp'),
};

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      image.decode?.().catch(() => {}).finally(() => resolve());
    };
    image.onerror = () => resolve();
    image.src = src;
  });
}
