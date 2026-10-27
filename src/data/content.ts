// All business content below is taken verbatim from https://media.zcorebit.com
// (home, /about, /services, /work, /contact). Edit here — components read from
// this file only.

export const studio = {
  name: 'Zcorebit Media',
  tagline: 'Your vision in motion.',
  positioning: 'Pakistan’s Premium Creative Production House',
  location: 'Creative Production House — Lahore, Pakistan',
  heroSub:
    'From idea to cinematic delivery — corporate films, brand films, and premium production for hotels, luxury brands, and enterprises across Pakistan.',
  metaDescription:
    "Zcorebit Media is Pakistan's premium creative production house — brand films, social content, UGC, product content, and post-production for brands and businesses. Start a project today.",
  craftHeading: 'We don’t just produce visuals. We build stories that move brands.',
  about: [
    'Zcorebit Media is a Pakistan-based creative production company specialising in cinematic films, commercial content, photography, and strategy-led visual storytelling for brands.',
    'From creative strategy and concept development to production and post-production, we bring ideas to life through thoughtful storytelling, cinematic visuals, and precise execution. We work with brands, businesses, and organisations to create visual experiences that capture attention, build trust, and leave a lasting impression.',
  ],
  signature: 'Zcorebit Media — Your vision in motion.',
  footerLine: 'We turn ideas into cinematic films, commercial content, and visual stories that make an impact.',
};

export const philosophy = [
  { word: 'Core', text: 'Represents your idea, challenge, or requirement.', image: 'philosophy-core' },
  { word: 'Bit', text: 'Symbolizes the craft and precision we build into every frame.', image: 'philosophy-bit' },
  { word: 'Media', text: 'Represents our commitment to stay with you from concept to completion.', image: 'philosophy-media' },
] as const;

export type Service = {
  id: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  image: string;
};

export const servicesIntro = {
  heading: 'Creative production. Built to make an impact.',
  body: 'From brand films and social content to product shoots and post-production — every service is built around the same craft: strategy, cinematic execution, and precise delivery.',
};

export const services: Service[] = [
  {
    id: 'brand-commercial-production',
    title: 'Brand & Commercial Production',
    summary: 'Brand films, commercials, and campaign content built to make brands unforgettable.',
    description:
      'From brand films to full-scale commercials and campaign rollouts, we craft content engineered to capture attention, build brand equity, and turn viewers into customers.',
    tags: ['Brand Films', 'Commercials', 'TVC', 'DVC', 'Campaign Films'],
    image: 'service-brand',
  },
  {
    id: 'social-content-production',
    title: 'Social Content Production',
    summary: 'Scroll-stopping reels, shorts, and social ads built for every platform.',
    description:
      'Fast-paced, platform-native content — reels, shorts, and social ads — designed to stop the scroll, hold attention, and perform across every feed.',
    tags: ['Reels', 'Shorts', 'Social Ads', 'Short-form Content'],
    image: 'service-social',
  },
  {
    id: 'ugc-creator-content',
    title: 'UGC & Creator Content',
    summary: 'Authentic creator-style content that builds trust and drives conversions.',
    description:
      "Genuine, creator-led videos — reviews, unboxings, and testimonials — that feel native to the feed and build the trust that scripted ads can't.",
    tags: ['UGC', 'Creator Videos', 'Reviews', 'Unboxing', 'Testimonials'],
    image: 'service-ugc',
  },
  {
    id: 'product-content',
    title: 'Product Shoot',
    summary: 'Product videos and photography that make every listing convert.',
    description:
      'Clean, conversion-focused product videos, photography, and lifestyle shoots built for e-commerce, catalogues, and campaigns that need to sell on sight.',
    tags: ['Product Videos', 'Product Photography', 'Lifestyle Shoots', 'E-commerce Content'],
    image: 'service-product',
  },
  {
    id: 'video-editing-post-production',
    title: 'Video Editing & Post Production',
    summary: 'The craft behind the final frame — editing, grading, and finishing.',
    description:
      'Editing, colour grading, motion graphics, VFX, and sound design that turn raw footage into a polished final film, ready for any screen.',
    tags: ['Editing', 'Color Grading', 'Motion Graphics', 'VFX', 'Sound Design'],
    image: 'service-post',
  },
  {
    id: 'commercial-photography',
    title: 'Commercial Photography',
    summary: 'Product, fashion, food, and lifestyle photography shot to sell.',
    description:
      'High-end commercial photography across product, fashion, food, lifestyle, and corporate categories — every frame lit, styled, and composed to convert.',
    tags: ['Product', 'Fashion', 'Food', 'Lifestyle', 'Corporate'],
    image: 'service-photography',
  },
  {
    id: 'personal-branding',
    title: 'Personal Branding',
    summary: 'Personal brand content that turns expertise into influence.',
    description:
      'Personal brand content built around you — video, photography, and short-form storytelling that turns expertise and personality into a recognisable presence.',
    tags: [],
    image: 'service-personal',
  },
  {
    id: 'corporate-content',
    title: 'Corporate Event Shoot',
    summary: 'Company films and founder videos that build credibility and trust.',
    description:
      'Company films, founder videos, and interviews that put a human face on your brand and build the credibility investors, partners, and customers look for.',
    tags: ['Company Films', 'Founder Videos', 'Interviews', 'Corporate Testimonials'],
    image: 'service-corporate',
  },
  {
    id: 'motion-animation',
    title: 'Motion Graphics & Animation',
    summary: '2D and 3D animation that explains, engages, and elevates.',
    description:
      '2D and 3D animation, explainer videos, kinetic typography, and product animation — built to simplify complex ideas and add a premium layer of motion.',
    tags: ['2D', '3D', 'Explainers', 'Kinetic Typography', 'Product Animation'],
    image: 'service-motion',
  },
  {
    id: 'event-brand-activations',
    title: 'Event & Brand Activations',
    summary: 'Event films and aftermovies that capture the energy of the room.',
    description:
      'Full event coverage, aftermovies, and launch films that capture the energy of your activation and extend its impact long after the room empties.',
    tags: ['Event Films', 'Aftermovies', 'Launches', 'Corporate Events'],
    image: 'service-events',
  },
];

export type Project = {
  slug: string;
  client: string;
  title: string;
  category: 'Corporate' | 'Hospitality' | 'Commercial' | 'Documentary';
  summary: string;
  description: string;
  images: string[];
};

export const workIntro = {
  heading: 'Films that move brands forward.',
  body: 'A selection of corporate, hospitality, commercial, and documentary projects — each shaped by strategy, craft, and precise execution.',
};

export const projects: Project[] = [
  {
    slug: 'vantex-manufacturing-film',
    client: 'Vantex',
    title: 'Manufacturing Film',
    category: 'Corporate',
    summary: 'Designed to communicate manufacturing excellence with cinematic precision.',
    description:
      'Designed to communicate manufacturing excellence with cinematic precision — from the factory floor to boardroom-ready delivery.',
    images: ['vantex-01', 'vantex-02', 'vantex-03', 'vantex-04', 'vantex-05'],
  },
  {
    slug: 'marbell-hotel-brand-film',
    client: 'Marbell',
    title: 'Hotel Brand Film',
    category: 'Hospitality',
    summary: 'Luxury hospitality captured through cinematic storytelling and aerial cinematography.',
    description:
      'Luxury hospitality captured through cinematic storytelling and aerial cinematography, built to elevate the guest experience online.',
    images: ['marbell-01', 'marbell-02', 'marbell-03', 'marbell-04', 'marbell-05'],
  },
  {
    slug: 'luma-product-launch-campaign',
    client: 'Luma',
    title: 'Product Launch Campaign',
    category: 'Commercial',
    summary: 'A high-impact campaign created to introduce a new product with clarity, energy, and visual precision.',
    description:
      'A high-impact campaign created to introduce a new product with clarity, energy, and visual precision across every platform.',
    images: ['luma-01', 'luma-02', 'luma-03', 'luma-04', 'luma-05'],
  },
  {
    slug: 'aurelio-hotel-brand-film',
    client: 'Aurelio',
    title: 'Hotel Brand Film',
    category: 'Hospitality',
    summary: 'Creating visuals that elevate the guest experience and strengthen hospitality brands.',
    description:
      'Creating visuals that elevate the guest experience and strengthen hospitality brands, from arrival to amenities.',
    images: ['aurelio-01', 'aurelio-02', 'aurelio-03', 'aurelio-04', 'aurelio-05'],
  },
  {
    slug: 'solvane-fashion-campaign',
    client: 'Solvane',
    title: 'Fashion Campaign',
    category: 'Commercial',
    summary: 'Premium visuals crafted for a bold, image-driven fashion brand.',
    description:
      'Premium visuals crafted for a bold, image-driven fashion brand — styled, lit, and graded to editorial standard.',
    images: ['solvane-01', 'solvane-02', 'solvane-03', 'solvane-04', 'solvane-05'],
  },
  {
    slug: 'amaan-purpose-driven-film',
    client: 'Amaan',
    title: 'Purpose-Driven Film',
    category: 'Documentary',
    summary: 'Authentic storytelling designed to inspire awareness, trust, and meaningful engagement.',
    description:
      'Authentic storytelling designed to inspire awareness, trust, and meaningful engagement around a cause worth telling.',
    images: ['amaan-01', 'amaan-02', 'amaan-03', 'amaan-04', 'amaan-05'],
  },
];

export const testimonialsIntro = {
  heading: 'Trusted by brands that value great work.',
  body: 'Hear directly from the people behind the brands we’ve had the opportunity to work with.',
};

export const testimonials = [
  {
    quote:
      'Zcorebit Media has been a dependable creative partner for Vantex. They understand our requirements, manage productions professionally, and consistently deliver strong visual work. Their attention to detail and ability to translate complex ideas into engaging content really sets them apart.',
    name: 'Sabahat',
    role: 'GM Marketing',
    company: 'Vantex Industries',
  },
  {
    quote:
      'Zcorebit Media did a great job of capturing the experience of Aurelio, from the property and its atmosphere to our events and hospitality. The team was professional, responsive, and attentive to the details that made the final visuals feel polished and authentic.',
    name: 'Nida',
    role: 'Marketing Head',
    company: 'Aurelio Hotels',
  },
  {
    quote:
      'Zcorebit Media understands that hospitality is about more than showcasing a property. They capture the atmosphere, details, and experiences that make a destination memorable. Their team has been creative, professional, and committed throughout the production process.',
    name: 'Shan',
    role: 'CEO',
    company: 'Dunes Hospitality Group',
  },
  {
    quote:
      'Zcorebit Media understood the character of Marbell and translated it into visuals that felt natural, elevated, and true to the property. The team was responsive, easy to work with, and paid close attention to the details that mattered.',
    name: 'Daniyal',
    role: 'CEO',
    company: 'Marbell',
  },
  {
    quote:
      'Zcorebit Media captured the experience of Castle & Co beautifully. They understood the setting, atmosphere, and details that make the property unique, while keeping the content natural and authentic. The entire production was handled professionally from start to finish.',
    name: 'Umer',
    role: 'CEO',
    company: 'Castle & Co',
  },
  {
    quote:
      'Zcorebit Media quickly understood the visual direction we had in mind for Brushwood and brought it to life with a fresh, polished approach. They were creative, collaborative, and open to our ideas throughout the production.',
    name: 'Saima',
    role: 'CEO',
    company: 'Brushwood',
  },
  {
    quote:
      'What we value about Zcorebit Media is that they go beyond simply producing content. They take the time to understand the idea behind a project and find the right visual language to tell it. Their creative involvement really stood out.',
    name: 'Israr',
    role: 'CEO',
    company: 'Green Orchard',
  },
  {
    quote:
      'Zcorebit Media brought a thoughtful approach to our project from concept through delivery. They understood the brief quickly, were flexible throughout production, and focused on creating work that felt right for the brand.',
    name: 'Haseeb',
    role: 'CEO',
    company: 'Arc Studios',
  },
  {
    quote:
      'Zcorebit Media understood what we needed to communicate and translated the brief into clear, engaging visuals. The team was professional, responsive, and attentive throughout the production, making the entire process smooth and straightforward.',
    name: 'Daniyal',
    role: 'Marketing Head',
    company: 'Meridian',
  },
];

export const clients = [
  'NORTHPEAK',
  'CASTLE & CO',
  'BRUSHWOOD',
  'VELIN',
  'ARC STUDIOS',
  'GREEN ORCHARD',
  'SNAPWELL',
  'DUNES HOTEL GROUP',
  'ORB',
  'MERIDIAN',
];

export const contact = {
  heading: 'Have a project in mind?',
  body: 'Tell us what you’re looking to create — even if the idea is still taking shape. We’ll take it from there.',
  responseTime: 'We typically respond within an hour',
  email: 'info@zcorebit.com',
  phoneDisplay: '+92 303 6393028',
  phoneHref: 'tel:+923036393028',
  whatsapp: 'https://wa.me/923036393028',
  address: 'Building No. 92-G, 2nd Floor, G-Block, Sector G, DHA Phase 1, Lahore',
  maps: 'https://maps.app.goo.gl/vutJ6R8FSEWKh3YW7',
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/zcorebitmedia' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/zcorebit?originalSubdomain=pk' },
  ],
};

// Interface copy for the opening sequence. These are stylised introductory
// notifications — NOT client testimonials — and are labelled as such in the UI.
export const introMessages = [
  { sender: 'Unknown number', text: 'Wait… who shot this?', image: 'solvane-01' },
  { sender: 'The group chat', text: 'These visuals are unreal.', image: 'marbell-01' },
  { sender: 'Your art director', text: 'I absolutely love their work.', image: 'luma-02' },
  { sender: 'Film club', text: 'Every frame feels like a movie.', image: 'reel-01' },
  { sender: 'Marketing team', text: 'This is the kind of storytelling we need.', image: 'vantex-01' },
  { sender: 'Zcorebit Media', text: 'Welcome to Zcorebit Media.', image: 'logo' },
];
