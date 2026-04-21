# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Team Tarot - a standup fortune predictor built with Astro 6 (SSG) plus a React island for the draw UI. A deterministic tarot card is drawn for the team three times a week (Mon/Wed/Fri), using a data-team-themed Major Arcana deck. Tue/Thu draws collapse onto Mon/Wed; Sat/Sun collapse onto Fri, so the draw only changes three times a week.

Deployed to Cloudflare Pages at https://cheddarsoap.com/. Submissions flow through a Cloudflare Pages Function that commits new fortunes to this GitHub repo via the GitHub Contents API, which triggers the next build.

## Astro Docs

Before writing or editing any `.astro` files, Astro config, or Astro-related code, always fetch the latest Astro 6 docs via Context7 MCP (`resolve-library-id` then `query-docs`). Astro 6 has breaking changes from earlier versions - do not rely on training data alone.

## Commands

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run preview` - preview production build

No test runner or linter is configured.

## Code Standards ("Sparse" Rules)

This project follows a custom constraint system called "Sparse", defined in `public/standards/`. These are strict rules, not suggestions. Key constraints:

### CSS (`public/standards/Sparse.css.md`)
- Max 5 of any CSS variable type
- No hardcoded numeric values - only CSS variables
- No ems, only rems
- Max 3 distinct types per class
- Only 4 percentages: 25%, 50%, 75%, 100%
- Exactly 2 colors
- Max 2 classes per element
- One animation speed, one border radius, no box shadows

### TypeScript (`public/standards/Sparse.ts.md`)
- Strict mode required
- `unknown` over `any`
- All function inputs `readonly`, all functions have explicit return types
- Arrow functions only, no function declarations
- Interfaces for object shapes, type aliases for primitives/unions/mapped types
- Discriminated unions over class hierarchies
- Literal type unions over enums
- Named exports only (no default), export statements at bottom of file

### React (`public/standards/sparse.React.md`)
- Three-layer split: components (JSX only), hooks (stateful logic via TanStack), services (pure sync logic)
- Function components only
- One component per `.tsx` file, named after file
- Explicit prop destructuring, no `...rest`

## Architecture

**Rendering**
- Astro 6 SSG (`output: 'static'` in `astro.config.mjs`) with `@astrojs/react` for client islands
- `src/pages/` - `index.astro` (daily draw), `deck.astro`, `cemetery.astro` (prior draws), `submit.astro`
- `src/layouts/BaseLayout.astro` - base HTML shell
- `src/components/` - `DailyDraw.tsx`, `Card.tsx`, `PriorDraws.tsx`, `SubmissionForm.tsx` (React), `Nav.astro`
- `src/utils/dailyDraw.ts` - deterministic hash-based draw + Mon/Wed/Fri date collapsing
- `src/styles/sparse.css` - core utility-first CSS framework following Sparse rules
- `src/styles/tarot.css` - layout layer (navbar, page, card styling) on top of sparse.css

**Content**
- Astro content collections defined in `src/content.config.ts` using the `file` loader
- `src/content/cards.json` - the 22 Major Arcana (data-team themed), schema: `{ name, numeral, number, art, suit? }`
- `src/content/fortunes.json` - submitted fortunes, schema: `{ text, card?, added }`
- Cards are JSON entries, not markdown

**Cloudflare Pages Functions (`functions/`)**
- `functions/_middleware.ts` - site-wide HMAC-cookie password gate (env: `SITE_PASSWORD`, `COOKIE_SECRET`). Serves a login page at `/__login` and sets a signed session cookie (`dtt_session`, 30 days).
- `functions/api/fortunes.ts` - `POST /api/fortunes` endpoint. Validates payload, fetches `src/content/fortunes.json` from GitHub, appends a new `fortune-NNN` entry with today's date, and commits via the GitHub Contents API. Retries on 409/422. Env: `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH` (defaults to `main`).
- The commit triggers a fresh Cloudflare Pages build, which picks up the new fortune at SSG time.

**Standards**
- `public/standards/` - Sparse coding standard definitions (CSS, TS, React)

Dark theme by default: off-white text (`#faf9f5`) on near-black background (`#262624`) with copper accent (`#b87333`).
