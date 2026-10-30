# Enchiridion Technologies — website

Marketing site for Enchiridion Technologies: a software studio focused on AI application
development and integration, full-stack web development, and cloud infrastructure.

Built with Next.js 15 (App Router, static export), Tailwind CSS v4, GSAP (ScrollTrigger +
SplitText), Lenis smooth scrolling, and three.js / React Three Fiber.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build    # static export to ./out (deployed to S3 + CloudFront by GitHub Actions)
```

Set `NEXT_PUBLIC_SITE_URL` to the production origin so Open Graph image URLs resolve correctly.

## Where things live

| Path | What |
| --- | --- |
| `src/content/site.ts` | All copy, links, nav items, contact form options, and the `works` list (cover image, hover video/image, link, role, services, tools) |
| `src/app/globals.css` | Design tokens (brand palette, breakpoints, spacing), typography utilities (`heading-*`, `body-*`) |
| `src/components/providers/` | App shell: Lenis, fonts, the global `js-s-*` scroll-text animations |
| `src/components/gl/` | WebGL: blob gradient + starfield + pointer trail (`background-scene.tsx`), logo particle cloud sampled from `public/scroll-hd.png` (`particle-field.ts`, `shape-sampling.ts`), scroll-driven morph / spin / dissolve (`particle-scroll-controller.tsx`), featured-work image planes (`rig-canvas.tsx`) |
| `src/components/gl/particle-config.ts` | Tunables for particle size, colour gain, spin, morph and the background gradient |
| `src/features/home/` | Home page sections (hero, resume, featured projects, services, process, get in touch, footer) |
| `src/features/work/` | `/work` showcase: WebGL carousel (`work-carousel.tsx`) with cover→video displacement transitions, barrel scroll, wrap-around and snapping; details panel + rolling counter (`work-page.tsx`) |
| `src/features/about/` | About page |
| `src/components/` | Navbar + viewport frame, custom cursor, preloader, contact drawer, UI primitives |

### Scroll animation hooks

Add these classes to any element and the provider wires the GSAP ScrollTrigger for you:
`js-s-print-opacity` (per-character print-in, `data-start-from-zero`), `js-s-lines` (masked
line slide-in), `js-s-fade-in`, `js-s-fade-out`, `js-s-fade-in-out`. Fine-tune with
`data-start`, `data-end`, `data-scrub`, `data-delay`, `data-scale`.

Sections drive the particle cloud with `data-geometry="logo|diamond"`, `data-geometry-scale`,
`data-geometry-position`, and `data-dissolve="in|out"` (+ `data-dissolve-start/end`).

### Adding a project

Append an entry to `works` in `src/content/site.ts`. Covers should be 1.6:1 (e.g. 1600×1000) in
`public/covers/`; hover media is an MP4 in `public/videos/` (`hoverType: "video"`) or a second image
(`hoverType: "image"`). The first three entries appear on the home page; all entries appear in `/work`.

### Contact form

The site is static, so the contact drawer composes a prefilled `mailto:` message. Swap the
submit handler in `src/components/contact-drawer.tsx` for an API call when a backend exists.
