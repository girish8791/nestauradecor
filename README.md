# nestauradecor
Interior website.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint     # oxlint
```

Vite + React + TypeScript with plain CSS. Design tokens (colours, 8px spacing scale, type sizes, container) live in `src/styles/tokens.css`; the shared button styles in `src/styles/buttons.css`.

## Sections

- **Navbar** (`src/components/Navbar.*`): Nest tan bar with the olive logo (`public/logo-olive.*`), centred links and a "Request a call back" pill. Below 820px the links open from a Menu button.
- **Hero** (`src/components/Hero.*`): the room photo (`public/media/hero-room-*`), then after 5 seconds a silent looping walkthrough video (`hero-walkthrough-720.mp4` / `-1080.mp4`). The video is skipped for reduced motion and Save-Data. A light tint, a soft shade behind the copy and warm corner light keep the text readable; the foot of the hero dissolves into the page cream.
- **Why choose us** (`src/components/WhyUs.*`): from the Figma "Why choose us frame". Five points with walnut icon circles, the team photo card (`why-team.*`) and the bronze showpiece (`why-branch-1144.*` / `-2289.*`, Figma's 2x export) rising from the hero into the section.

## Fonts

Cormorant Garamond (hero headline fallback), Jost (body), Google Sans (section headings), loaded from Google Fonts in `index.html`. Buttons use Helvetica Neue, falling back to Helvetica/Arial where it isn't installed. The hero headline names Distrampler (from the Figma) first; it shows once its font file is added.

## Open items

- "Book Consultation" and "Request a call back" link to `#callback`, "Our work" to `#possibilities` and "How we work" to `#process`; those sections are not built yet.
- The team photo is 740px wide; a larger original would be sharper on high-density screens. Check its licence before launch.
