# Zcorebit Media — immersive website

A cinematic, photography-first website for **Zcorebit Media** (Lahore, Pakistan), built with
React, Vite, TypeScript, Three.js, GSAP + ScrollTrigger and Lenis. No website builder — plain
source code you can host anywhere.

## Quick start

Requires **Node.js 18.18+** (tested on Node 24).

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-checks, then builds to /dist
npm run preview   # serves /dist at http://localhost:4173
```

Other scripts: `npm run typecheck`, `npm run images` (see *Replacing images*).

## The experience

| # | Section | What it does |
|---|---------|--------------|
| 1 | **Opening** (`components/Intro`) | Loader whose logo fills with *real* asset progress → *Enter with sound / without sound* → incoming-message sequence over the showreel (bounce-in, blur-to-focus, stacked depth, fan-out on hover, notification chime) → cards drop away → brand reveal (logo unmask, 3D photo triptych, “Your vision *in* motion.”). **Skip intro** is always available. Plays once per browser session and only on the home page. |
| 2 | **Hero** (`components/Hero`) | Photo cards fly up and assemble into a rotating 3D helix. Drag (inertia), arrow keys, pointer-depth parallax; spreads apart as you scroll. |
| 3 | **Studio** (`components/About`) | Scroll-lit statement, masked showreel that opens to full bleed, pinned *Core / Bit / Media* philosophy. |
| 4 | **Services** (`components/Services`) | All 10 services; cursor-following image preview, expandable detail with tags, *Start a brief* pre-fills the contact form. |
| 5 | **Work** (`components/Work`) | Pinned horizontal sequence of the 6 projects with in-frame parallax (vertical list on tablet/phone). |
| 6 | **Gallery** (`components/Gallery`) | WebGL “dome” — an infinite wall of every project frame with lens warp, cursor magnifier, drag inertia, keyboard control, reset, and a camera focus before opening a project. In-page preview plus fullscreen `/gallery` (wheel explores there). DOM fallback without WebGL. |
| 7 | **Project pages** (`/work/:slug`) | Shared-element flight from the clicked frame, project facts, aspect-true exhibition layout, next/prev (buttons and ← →), Esc returns to where you came from. |
| 8 | **Voices** (`components/Testimonials`) | The 9 client testimonials in a draggable, keyboard-accessible track + client marquee. |
| 9 | **Contact** (`components/Contact`) | Closing type, WhatsApp/call/email, address + map, socials, validated contact form, full-width logo sign-off. |

Persistent UI: logo, section indicator, fullscreen menu (Esc, focus-trapped), *Let’s talk*, sound
control with live waveform (also the **M** key), contextual custom cursor (desktop only), page
curtain transitions.

## Sound

`src/audio/SoundEngine.ts` is a single Web Audio graph shared by the whole site, so music never
doubles up or restarts between routes. Audio only starts after a click (browser autoplay rules),
fades in and out, pauses when the tab is hidden, and the visitor’s choice is remembered
(`localStorage`).

- **No licensed track yet?** It plays an original **generative ambient score** synthesised live in
  the browser — real audio, nothing to license.
- **To use a track:** add a properly licensed file at `public/assets/audio/soundtrack.mp3`
  (or set `VITE_SOUNDTRACK`). It’s detected automatically.

## Editing content

All business copy lives in **`src/data/content.ts`** (taken from media.zcorebit.com): studio text,
services, projects, testimonials, clients, contact details and the intro messages. Image choices for
the hero/reveal are in `src/data/scenes.ts`; alt text in `src/data/images.ts`.

> The intro messages (“Wait… who shot this?” etc.) are interface copy, labelled on screen as
> *illustrative messages* — they are not presented as reviews.

## Replacing images

The current site’s portfolio uses Unsplash stock photography, so this build does too (the same 9
images, plus additional Unsplash images — see `CREDITS.md`). To use real project stills:

1. Put a high-resolution file at `scripts/originals/<key>.jpg` (e.g. `vantex-01.jpg`).
   Keys are listed in `scripts/image-sources.json`.
2. Delete that key’s files in `public/assets/images/` and run `npm run images`
   (or `npm run images -- --force` to rebuild everything).
3. Update its alt text in `src/data/images.ts`.

The script writes WebP at 640/1280/1920 px and records size + dominant colour in
`src/data/images.generated.json`. Aspect ratios are preserved everywhere.

## Configuration (`.env`)

Copy `.env.example` to `.env`. All values are optional.

| Variable | Purpose |
|----------|---------|
| `VITE_SITE_URL` | Public URL for canonical / Open Graph / JSON-LD (default `https://media.zcorebit.com`) |
| `VITE_BASE` | Base path. `/` for Vercel/Netlify/custom domain; `/<repo>/` for a GitHub Pages project site |
| `VITE_FORM_ENDPOINT` | Form backend (e.g. Formspree). If empty, the form opens a pre-filled email and offers WhatsApp |
| `VITE_SOUNDTRACK` | Path to the soundtrack inside `/public` |

## Deploying

**Vercel** — import the GitHub repo. Framework: Vite, build `npm run build`, output `dist`.
`vercel.json` already rewrites deep links (`/work/...`, `/gallery`) to the app.

**Netlify** — build `npm run build`, publish `dist`. `public/_redirects` handles deep links.

**GitHub Pages** — set `VITE_BASE=/<repo-name>/` (unless using a custom domain), run
`npm run build`, publish `dist` (e.g. with the *actions/deploy-pages* workflow). The build writes
`404.html` so deep links work.

Update `public/robots.txt` and `public/sitemap.xml` if the domain changes.

## Project structure

```
public/assets/       logo/ images/ videos/ audio/  (+ favicon, og-image, robots, sitemap)
scripts/             fetch-images.mjs, image-sources.json
src/
  audio/             SoundEngine (Web Audio, generative score)
  components/        Intro, Hero, About, Services, Work, Gallery, ProjectViewer,
                     Testimonials, Contact, Navigation, AudioController, Cursor, Transitions
  context/           Experience (intro/menu/motion), Sound, Scroll (Lenis + ScrollTrigger)
  data/              content.ts, images.ts, scenes.ts, navigation.ts
  hooks/  pages/  styles/  utils/
```

## Performance & accessibility notes

- Three.js loads on demand as its own chunk (~116 kB gzip) only when a gallery is shown; rendering
  pauses off-screen; device pixel ratio is capped; textures load per visible tile.
- Responsive WebP images with `srcset`; lazy loading below the fold; the loader waits only for
  essential opening assets.
- One scroll controller (Lenis driven by GSAP’s ticker). Reduced-motion users get native scrolling,
  no pinning, and simplified transitions.
- Semantic landmarks and headings, alt text, visible focus, keyboard support (menu, gallery, project
  nav, testimonials, intro), per-route titles/descriptions/OG tags, JSON-LD business data, and a
  `<noscript>` fallback with the core business information.
