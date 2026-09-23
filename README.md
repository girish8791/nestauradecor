# nestauradecor
Interior website.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run lint     # oxlint
```

Vite + React + TypeScript with plain CSS. `npm run build` also prerenders the page (`src/entry-server.tsx`, `scripts/prerender.mjs`) so the markup is in `dist/index.html` and paints before the script loads; `src/main.tsx` then hydrates it. Components must not read `window` or media queries while rendering (use effects or `src/useMediaQuery.ts`). Design tokens (colours, 8px spacing scale, type sizes, container) live in `src/styles/tokens.css`; the shared button styles in `src/styles/buttons.css`.

## Sections

- **Navbar** (`src/components/Navbar.*`): Nest tan bar with the olive logo (`public/logo-olive.*`), centred links and a "Request a call back" pill. Below 1024px the links open from a line-only menu button.
- **Hero** (`src/components/Hero.*`): the room photo (`public/media/hero-room-*`), then after 5 seconds a silent looping walkthrough video (`hero-walkthrough-720.mp4` / `-1080.mp4`). The video downloads only after the page has loaded, and is skipped for reduced motion, Save-Data and connections under about 3 Mbps. A light tint, a soft shade behind the copy and warm corner light keep the text readable; the foot of the hero dissolves into the page cream.
- **Why choose us** (`src/components/WhyUs.*`): from the Figma "Why choose us frame". Five points with walnut icon circles, the team photo card (`why-team.*`) and the bronze showpiece (`why-branch-1144.*` / `-2289.*`, Figma's 2x export) rising from the hero into the section.

## Fonts

Self-hosted in `public/fonts` (`src/styles/fonts.css`): Distrampler for headings and Helvetica Neue (light, regular, medium, bold) for text and buttons. They are WOFF2 subset to Latin plus the punctuation and symbols the site uses (about 100 KB in all, from 1.35 MB of TTF/OTF); the Helvetica files keep their original kerning. A character outside that set falls back to Helvetica/Arial, so re-subset from the originals in git history if new symbols are needed. Distrampler and Helvetica Neue Light are preloaded in `index.html`.

## Call-back form

The footer form (`src/components/Footer.tsx`) posts each request to a Google Apps Script web app (`scripts/lead-form.gs`), which adds a row to a Google Sheet and emails the details. The thank-you panel then offers WhatsApp with the request already written. If the request cannot be sent (no connection, script down, `VITE_LEAD_ENDPOINT` not set), the panel asks the visitor to send it on WhatsApp instead, so no enquiry is lost.

One-time setup, in the Google account that should own the leads:

1. Create a Google Sheet (e.g. "Nest Aura Decor leads"), then **Extensions → Apps Script**.
2. Replace the editor's contents with `scripts/lead-form.gs`. To email someone other than this account, set `NOTIFY` at the top (comma-separated for several).
3. **Deploy → New deployment → Web app**: execute as **Me**, access **Anyone**. Approve the permissions (Sheets and Gmail) and copy the web app URL.
4. Set `VITE_LEAD_ENDPOINT` to that URL: in `.env.local` for local builds (see `.env.example`) and in the host's environment variables, then rebuild.

Junk is kept out on both sides (`src/phone.ts` and the same rules in the script): a hidden field only bots fill, mobile numbers that must be ten digits starting 6-9 and not made up (9999999999, 9876543210), and the same number twice in ten minutes counted once. Anything merely odd (filled in under 8 seconds, a link in the message) is still saved, with a note in the "Check" column and in the email subject.

The "Leads" tab and its header row are created with the first request. After editing the script, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Hosting and headers

Railway builds the repo and serves `dist` with Caddy. The `Caddyfile` at the root replaces Railpack's default one, which sets almost no headers; ours adds HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and a Content-Security-Policy that allows scripts, styles, images, fonts and video from this site only, plus form posts to the leads script. The policy names the inline script in `index.html` by hash; `npm run build` fails if that script changes without the hash, and `caddy validate` checks the file itself.

## Open items

- Placeholders to fill: team projects/years and email.
- Add `og:image` (an absolute URL, e.g. a 1200 × 630 crop of the hero) to `index.html` once the domain is known; the other sharing tags are in place.
- The team photo is 740px wide; a larger original would be sharper on high-density screens. Check its licence before launch.
