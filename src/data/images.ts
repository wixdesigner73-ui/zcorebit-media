import manifest from './images.generated.json';
import { asset } from '../utils/assets';

type ManifestEntry = { width: number; height: number; color: string; source: string; existing: boolean };
const entries = manifest as Record<string, ManifestEntry>;

export const IMAGE_WIDTHS = [640, 1280, 1920] as const;

// Descriptive alt text for every image used on the site.
const ALT: Record<string, string> = {
  'vantex-01': 'Industrial factory interior with heavy machinery under warm light.',
  'vantex-02': 'Engineer working at an automated manufacturing line.',
  'vantex-03': 'Sparks flying from metalwork on a workshop floor.',
  'vantex-04': 'Modern industrial facade with yellow panels against a stormy sky.',
  'vantex-05': 'Hands reviewing technical drawings on a drafting table.',
  'marbell-01': 'Grand hotel lobby with chandeliers and arched ceilings.',
  'marbell-02': 'Luxury resort pool glowing at dusk.',
  'marbell-03': 'Hotel pool terrace with reflections at twilight.',
  'marbell-04': 'Tropical resort pool framed by palms and mountains.',
  'marbell-05': 'Aerial view above the clouds toward mountain peaks at sunset.',
  'luma-01': 'Model in a tailored beige suit against a neutral backdrop.',
  'luma-02': 'Black headphones on a bright yellow background.',
  'luma-03': 'Amber dropper bottle on a plinth in soft window shadow.',
  'luma-04': 'Serum bottle styled with eucalyptus on a wooden tray.',
  'luma-05': 'Studio microphone in moody low-key light.',
  'aurelio-01': 'Sunlit hotel lounge with tall windows and palms.',
  'aurelio-02': 'Hotel suite bed bathed in natural light.',
  'aurelio-03': 'Whitewashed resort with pool and palm trees at dusk.',
  'aurelio-04': 'Fine dining table with a plated dish.',
  'aurelio-05': 'Overhead view of plated dishes with fresh herbs.',
  'solvane-01': 'Model in a red outfit posed against a deep blue sky.',
  'solvane-02': 'Model in striped trousers posing against a teal wall.',
  'solvane-03': 'Model in a yellow outfit on an outdoor basketball court.',
  'solvane-04': 'Woman in a floral dress on the beach with a straw bag.',
  'solvane-05': 'Clothing rail in a fashion studio.',
  'amaan-01': 'Black and white portrait of a woman looking into the lens.',
  'amaan-02': 'Children smiling together and reaching toward the camera.',
  'amaan-03': 'Many hands forming a red painted heart.',
  'amaan-04': 'Road winding through a desert canyon.',
  'amaan-05': 'Sunrise over gentle shoreline waves.',
  'philosophy-core': 'A creative team sketching concepts and storyboards at a studio desk.',
  'philosophy-bit': 'A production crew holding a clapperboard on set.',
  'philosophy-media': 'A colourist grading the finished film in an edit suite.',
  'service-brand': 'Clapperboard held up on location before a take.',
  'service-social': 'Concert-goer filming the stage on a phone.',
  'service-ugc': 'Creator working on a laptop with coffee in a café.',
  'service-product': 'White smartwatch product shot on a light background.',
  'service-post': 'Editing workstation with monitors and camera gear.',
  'service-photography': 'Camera with telephoto lens on a dark background.',
  'service-personal': 'Smiling portrait of a man against a light wall.',
  'service-corporate': 'Presentation on a large screen in front of an audience.',
  'service-motion': 'Projector beam cutting through red light.',
  'service-events': 'Confetti falling over a crowd at a live event.',
  'reel-01': 'Vintage film projector beaming light through haze.',
  'reel-02': 'Rows of red cinema seats.',
  'reel-03': 'Dark, empty cinema auditorium.',
  'reel-04': 'Photographer catching a camera in an autumn forest.',
  'reel-05': 'Photographer on a cliff above a misty valley.',
  'reel-06': 'Person walking along a wooden boardwalk at sunset.',
  'reel-07': 'Concert crowd silhouetted against stage lights.',
  'reel-08': 'Crowd under confetti and stage lights.',
  'reel-09': 'Portrait of a woman against a soft pink background.',
  'reel-10': 'Small green island in a turquoise sea.',
  'reel-11': 'Skyscrapers seen from street level.',
  'reel-12': 'Audience seated in a dark auditorium.',
  'reel-13': 'Portrait of a woman in cool blue light.',
  'reel-14': 'Minimal interior with plants and a floor lamp.',
};

export type Img = {
  key: string;
  src: string;
  srcSet: string;
  width: number;
  height: number;
  aspect: number;
  color: string;
  alt: string;
};

export function img(key: string): Img {
  const entry = entries[key];
  if (!entry) throw new Error(`Unknown image "${key}"`);
  const url = (w: number) => asset(`assets/images/${key}-${w}.webp`);
  return {
    key,
    src: url(1280),
    srcSet: IMAGE_WIDTHS.map((w) => `${url(w)} ${Math.min(w, entry.width)}w`).join(', '),
    width: entry.width,
    height: entry.height,
    aspect: entry.width / entry.height,
    color: entry.color,
    alt: ALT[key] ?? '',
  };
}

export function imgUrl(key: string, width: (typeof IMAGE_WIDTHS)[number]) {
  return asset(`assets/images/${key}-${width}.webp`);
}

export const allImageKeys = Object.keys(entries);
