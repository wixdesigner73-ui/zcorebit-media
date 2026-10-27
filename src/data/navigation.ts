// Menu / section map shared by the header, menu and home-page section tracking.
export type NavItem = { id: string; label: string; route?: string; image: string };

export const NAV: NavItem[] = [
  { id: 'top', label: 'Opening', image: 'reel-05' },
  { id: 'studio', label: 'Studio', image: 'philosophy-core' },
  { id: 'services', label: 'Services', image: 'service-brand' },
  { id: 'work', label: 'Work', image: 'marbell-01' },
  { id: 'gallery', label: 'Gallery', route: '/gallery', image: 'solvane-01' },
  { id: 'voices', label: 'Voices', image: 'aurelio-01' },
  { id: 'contact', label: 'Contact', image: 'reel-01' },
];
