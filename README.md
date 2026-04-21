# Data-Team-Tarot

A standup fortune predictor for the data team. Three times a week (Mon/Wed/Fri) a deterministic tarot card is drawn from a data-team-themed Major Arcana deck, paired with a team-submitted fortune. Tue/Thu collapse onto the most recent Mon/Wed draw; Sat/Sun collapse onto Fri, so the draw only changes three times a week.

Live at [cheddarsoap.com](https://cheddarsoap.com/).

## Stack

- **Astro 6** static site (`output: 'static'`) with a **React 19** island for the draw UI
- **Cloudflare Pages** hosting, with **Pages Functions** for the submission API and site-wide auth gate
- Content stored as JSON in `src/content/` via Astro content collections

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
```

Requires Node `>=22.12.0`. No test runner or linter is configured.

## Project Layout

```
src/
  pages/          index.astro (daily draw), deck.astro, cemetery.astro, submit.astro
  layouts/        BaseLayout.astro
  components/     DailyDraw.tsx, Card.tsx, PriorDraws.tsx, SubmissionForm.tsx, Nav.astro
  content/        cards.json (22 Major Arcana), fortunes.json (submissions)
  content.config.ts
  utils/          dailyDraw.ts - deterministic hash-based draw + date collapsing
  styles/         sparse.css (utility framework), tarot.css (layout layer)
functions/
  _middleware.ts           site-wide HMAC-cookie password gate
  api/fortunes.ts          POST endpoint that commits new fortunes to GitHub
public/
  standards/      Sparse coding standard definitions (CSS, TS, React)
```

## How a Fortune Gets Added

The site is static, but submissions still work because of a Pages Function:

1. User hits `/submit` and posts to `POST /api/fortunes`
2. `functions/api/fortunes.ts` validates the payload, pulls the current `src/content/fortunes.json` from GitHub, appends a new `fortune-NNN` entry with today's date, and commits via the GitHub Contents API (retries on 409/422)
3. The commit triggers a fresh Cloudflare Pages build
4. Next page load shows the new fortune at SSG time

Think of it as a mailbox: the site is a printed newspaper, but the Function is the editor that files new stories before the next print run.

## Content Schemas

**Cards** (`src/content/cards.json`):
```ts
{ name: string, numeral: string, number: number, art: string, suit?: string }
```

**Fortunes** (`src/content/fortunes.json`):
```ts
{ text: string, card?: string, added: string }
```

## Environment Variables

Set in Cloudflare Pages settings for the production deploy:

- `SITE_PASSWORD` - password for the site-wide gate
- `COOKIE_SECRET` - HMAC secret for signing the `dtt_session` cookie (30-day expiry)
- `GITHUB_TOKEN` - PAT with contents write access to this repo
- `GITHUB_REPO` - `owner/repo` for the Contents API calls
- `GITHUB_BRANCH` - defaults to `main`

## Code Standards

This project follows a strict custom standard called **Sparse**, defined in `public/standards/`. Summary:

- **CSS**: no hardcoded numeric values, only CSS variables; max 5 of any variable type; rems only; exactly 2 colors; max 2 classes per element
- **TypeScript**: strict mode; `unknown` over `any`; arrow functions only; named exports only; explicit return types; readonly inputs
- **React**: three-layer split (components = JSX only, hooks = stateful logic, services = pure sync); one component per file, named after the file; explicit prop destructuring, no `...rest`

See `public/standards/Sparse.css.md`, `Sparse.ts.md`, and `sparse.React.md` for the full rules.

## Theme

Dark by default. Off-white text (`#faf9f5`) on near-black background (`#262624`) with a copper accent (`#b87333`).
