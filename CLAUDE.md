# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Team Tarot -- a daily standup fortune predictor built with Astro 6 (SSG). One tarot card drawn per day (deterministic, same for everyone), with a data-team-themed Major Arcana deck. Intended for Azure Static Web Apps deployment.

The implementation plan lives at `public/implementation-guide.md`. It defines 5 phases: static foundation, daily draw engine, card art, fortune submission, and polish features. The project is in early Phase 1.

## Commands

- `npm run dev` -- start dev server
- `npm run build` -- production build
- `npm run preview` -- preview production build

No test runner or linter is configured yet.

## Code Standards ("Sparse" Rules)

This project follows a custom constraint system called "Sparse", defined in `public/standards/`. These are strict rules, not suggestions. Key constraints:

### CSS (`public/standards/Sparse.css.md`)
- Max 5 of any CSS variable type
- No hardcoded numeric values -- only CSS variables
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

- **Astro 6 SSG** -- no SSR, fully static site generation
- `src/pages/index.astro` -- homepage (will become daily draw page)
- `src/layouts/BaseLayout.astro` -- base HTML shell
- `src/content/Cards.md` -- card list for the 22 Major Arcana (data-team themed)
- `src/styles/sparse.css` -- core utility-first CSS framework following Sparse rules
- `src/styles/classic.css` -- layout layer (navbar, sidebar, page, footer, drawer) on top of sparse.css
- `public/standards/` -- Sparse coding standard definitions (CSS, TS, React)

Dark theme by default: off-white text (`#faf9f5`) on near-black background (`#262624`) with copper accent (`#b87333`).
