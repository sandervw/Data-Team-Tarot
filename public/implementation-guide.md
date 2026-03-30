# Daily Standup Tarot — Implementation Guide

A weekend project built with Astro SSG on Azure Static Web Apps. One tarot card drawn per day, locked for everyone. Team members submit anonymous fortunes to grow the deck over time.

---

## Phase 1: Static Foundation

**Goal:** Content rendering. Cards and fortunes exist as browsable collections.
**Astro concepts:** Project scaffolding, content collections, layouts, components.

### Steps

1. Scaffold a new Astro project (`npm create astro@latest`). Pick the minimal/blank template.
2. Create a single base layout in `src/layouts/BaseLayout.astro` with a dark, moody theme (think card-table green or deep purple — this is tarot, not a dashboard).
3. Define two content collections in `src/content/config.ts`:
   - `cards` — schema: `name` (string), `numeral` (string, e.g. "XIII"), `meaning` (short one-liner), `art` (image path or placeholder), `suit` (optional, for Minor Arcana expansion later).
   - `fortunes` — schema: `text` (string), `category` (enum: `standup`, `sprint`, `retro`, `friday`, `general`).
4. Seed the `src/content/cards/` directory with 22 markdown files for the Major Arcana. Rename them to fit the data team theme. Examples:
   - 0 — The Intern
   - I — The Architect
   - II — The Data Steward
   - III — The End User
   - IV — The Stakeholder
   - V — The Domain Expert
   - VI — The Cross-Team Dependency
   - VII — The Sprint
   - VIII — CI/CD
   - IX — The Remote Dev
   - X — The Wheel of Jira
   - XI — The SLA
   - XII — The Hanged Build
   - XIII — Schema Changes
   - XIV — Data Quality
   - XV — The Vendor
   - XVI — The Outage
   - XVII — The Executive Dashboard
   - XVIII — The Legacy System
   - XIX — The Sprint Demo
   - XX — Code Review
   - XXI — The Go-Live
5. Seed `src/content/fortunes/` with 30–40 markdown files, one fortune per file. Keep them short and punchy. Mix categories. Examples:
   - "Your PR will be approved without comments. Savor this omen."
   - "A stakeholder approaches with 'just a quick question.'"
   - "The data you seek is in a CSV. The CSV is in an email. The email is from 2019."
   - "SSIS smiles upon you today. Do not question why."
   - "A merge conflict in your future — but also, a merge conflict in your past."
   - "The sprint board reveals: you were the blocker all along."
   - "Today's standup will end on time. You will be suspicious."
   - "Mercury is in retrograde. So is your staging environment."
   - "You will receive a compliment on your DAX. Accept it graciously."
   - "Beware the 4pm Friday deploy."
6. Build a `Card.astro` component that renders a single card: numeral, name, meaning, art placeholder, and a fortune text slot.
7. Create a `/deck` page that loops over all cards and renders them in a grid. This is your "browse the full deck" view.
8. Verify the build works: `npm run dev`, confirm `/deck` renders all 22 cards.

**Checkpoint:** You can browse all cards and fortunes. No daily logic yet — just content on screen.

---

## Phase 2: The Daily Draw Engine

**Goal:** One card + one fortune per day, deterministic, no backend required.
**Astro concepts:** Utility modules, client-side JS in Astro components, static + client hybrid.

### How It Works

Use the current date as a seed for a simple hash function. Same date always produces the same card + fortune index. Everyone who visits on the same day sees the same pull. Think of it like a combination lock where the date *is* the combination.

### Steps

1. Create a utility file `src/lib/daily-draw.ts`.
2. Implement a simple deterministic hash function that takes a date string (e.g. `"2026-03-30"`) and returns a number. A basic string-to-number hash works fine — nothing cryptographic needed. Something like djb2 or a summed char-code approach.
3. Implement `getDailyDraw(totalCards, totalFortunes, dateString)` that returns `{ cardIndex, fortuneIndex }` using modulo arithmetic on the hash output. Use a different salt or offset for the fortune index so the card-fortune pairing isn't always the same relationship.
4. On the index page (`src/pages/index.astro`), fetch all cards and fortunes from the content collections at build time.
5. Pass the full card and fortune arrays to a client-side component (e.g. `DailyDraw.astro` with `client:load` or a `<script>` block).
6. In the client-side script: get today's date string, call the hash function, index into the arrays, and render today's card + fortune.
7. Add a "Yesterday's Card" link or small preview below the main card.
8. Optional: Create an `/archive` page that computes the last 7–14 days of draws by looping backward through dates and displays them as a timeline.

**Checkpoint:** Visit the site, see today's card. Refresh — same card. Come back tomorrow — different card. No server, no database.

---

## Phase 3: Card Art

**Goal:** Make the cards look good. Move from placeholders to real visuals.
**Astro concepts:** Asset handling, component props, CSS variables.

### Option A: SVG Card Template (Recommended Starting Point)

1. Design a single SVG card frame: a bordered rectangle with a decorative border, a top area for the numeral, a center area for a symbol, and a bottom area for the card name.
2. Create a `CardArt.astro` component that accepts `numeral`, `name`, and `suit` as props and injects them into the SVG template.
3. Define 4–5 color schemes using CSS variables, one per suit or category (e.g. wands = amber, cups = teal, swords = silver, pentacles = green). Map each card to a scheme.
4. Use a simple unicode symbol or geometric shape in the center of each card as the "illustration." Keep it abstract.

### Option B: AI-Generated Art (Higher Impact, More Upfront Work)

1. Generate 22 card images in a single batch session using an image generator. Prompt for a consistent style (woodcut, pixel art, and flat vector all work well for tarot).
2. Save images to `public/cards/` as PNGs or WebPs.
3. Reference them in each card's frontmatter `art` field.
4. Use a shared card-back image for the flip animation (Phase 5).

### Option C: CSS-Only (Fastest)

1. Use gradient backgrounds, large unicode glyphs, and styled borders.
2. Each card gets a unique gradient based on its index or suit.
3. Looks surprisingly polished with minimal effort.

**Recommendation:** Start with Option A or C for the weekend build. Upgrade to Option B later as a polish pass.

**Checkpoint:** Cards have distinct, consistent visuals. The deck page looks like an actual tarot spread.

---

## Phase 4: Fortune Submission

**Goal:** Team members can anonymously submit new fortunes to grow the deck.
**Astro concepts:** Forms, API routes (if using Azure Functions), or external service integration.

### Choose Your Path

#### Path A — GitHub-Backed Submissions (Best Learning Value)

This approach uses Azure Static Web Apps' built-in API support (a Node.js function) to receive submissions and commit them as new markdown files to your repo via the GitHub API. Fortunes appear in the deck after the next site rebuild.

1. Create an API function in `api/submit-fortune/index.js` (Azure SWA convention).
2. The function accepts a POST request with `{ text, category }`.
3. Validate input: text length (10–200 chars), category is one of the allowed enums, basic sanitization.
4. Use the GitHub API (with a personal access token stored as an Azure app setting) to create a new `.md` file in `src/content/fortunes/` on a `submissions` branch.
5. You review and merge the branch periodically — this is your moderation step.
6. On the frontend, build a simple form component: a textarea, a category dropdown, and a submit button. No login required.
7. Show a confirmation message: "Your fortune has been sealed in the deck."
8. The site rebuilds on push to `main`, and the new fortunes enter the pool.

**Tradeoff:** Most Astro-native. Natural moderation buffer. Slight delay before fortunes go live.

#### Path B — Azure Blob Storage (Fastest Dynamic Option)

1. Create an Azure Function that appends submissions to a `fortunes.json` blob in Azure Blob Storage.
2. On the frontend, the daily draw script fetches this blob at load time and merges it with the static fortunes collection before selecting.
3. No rebuild needed for new fortunes to appear.
4. Moderation is trickier — you'd need a separate admin view or periodic manual review of the blob.

**Tradeoff:** Fortunes appear immediately. Less moderation control. Slightly more Azure plumbing.

#### Path C — Google Form (Zero-Code Fallback)

1. Create a Google Form with two fields: fortune text and category.
2. Link or embed it on a `/submit` page.
3. Periodically copy approved submissions into `src/content/fortunes/` manually.
4. Rebuild and deploy.

**Tradeoff:** Fastest to ship. Manual curation. No integration learning.

**Recommendation:** Path A if this project is about learning Astro + Azure together. Path C if you want to play with the app by Monday.

**Checkpoint:** Team members can submit fortunes. The deck grows over time.

---

## Phase 5: Polish & Fun Extras

**Goal:** Make it delightful. These are independent of each other — pick and choose.

### Card Flip Animation

1. Add a CSS card-flip animation to the daily draw page. Show the card back on load, then flip to reveal after a short delay (1–2 seconds).
2. Use CSS `transform: rotateY(180deg)` with `backface-visibility: hidden` on two child divs (front and back).
3. Trigger the flip via a CSS animation on page load, or on click for a more interactive feel.

### Share Button

1. Add a "Copy Today's Fortune" button below the daily card.
2. On click, copy a formatted string to the clipboard: `"🔮 Daily Standup Tarot — The Deploy (VII): 'Your PR will be approved without comments. Savor this omen.'"`
3. Team members paste it into Slack/Teams. Free engagement loop.

### The Reversed Card

1. Add a 20% chance (seeded by the same daily hash, using a third offset) that today's card appears upside-down.
2. Apply a CSS `transform: rotate(180deg)` to the card art only (not the fortune text).
3. Reversed cards pull from an alternate fortune pool or just prepend "Reversed — " to the fortune for a darker/funnier spin.
4. Add an `isReversed` boolean to the daily draw utility output.

### Fortune Categories by Day

1. Map days of the week to fortune categories: Monday = `standup`, Wednesday = `sprint`, Friday = `friday`, etc.
2. Filter the fortune pool by category before applying the daily hash.
3. This makes Fridays feel different from Mondays and encourages submitting category-specific fortunes.

### Stats Page

1. Create a `/stats` page showing: total fortunes in the deck, breakdown by category, number of days since launch, number of unique cards drawn so far.
2. All computable at build time from the content collections and a launch date constant. No database.

### Streak Tracker (Client-Side)

1. Use `localStorage` to track how many consecutive days a user has visited.
2. Display a small "🔥 3-day streak" badge on the daily draw page.
3. Purely local, no auth needed, adds a small gamification hook.

---

## What You're NOT Building

To keep this a weekend project, explicitly skip:

- User accounts or authentication
- A database
- Server-side rendering (SSR) — keep it fully SSG
- Personal/individual daily draws (everyone gets the same card — that's the point)
- Mobile app wrappers
- A card editor UI — just edit markdown files directly

---

## Suggested Weekend Timeline

| Block              | Phase                          | Estimated Time |
| ------------------ | ------------------------------ | -------------- |
| Saturday morning   | Phase 1 — Scaffold + content   | 2–3 hours      |
| Saturday afternoon | Phase 2 — Daily draw engine    | 2–3 hours      |
| Saturday evening   | Phase 3 — Card art             | 1–2 hours      |
| Sunday morning     | Phase 4 — Fortune submission   | 2–3 hours      |
| Sunday afternoon   | Phase 5 — Polish (pick 2–3)    | 2–3 hours      |
| Sunday evening     | Deploy to Azure SWA, share URL | 30 min         |

**Total: ~10–15 hours across a weekend.**

---

## File Structure (Approximate)

```
daily-standup-tarot/
├── src/
│   ├── content/
│   │   ├── config.ts              # Collection schemas
│   │   ├── cards/
│   │   │   ├── 00-the-intern.md
│   │   │   ├── 01-the-architect.md
│   │   │   └── ... (22 files)
│   │   └── fortunes/
│   │       ├── fortune-001.md
│   │       ├── fortune-002.md
│   │       └── ... (30-40 seed files)
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   ├── Card.astro
│   │   ├── CardArt.astro
│   │   ├── DailyDraw.astro
│   │   └── SubmitFortune.astro
│   ├── lib/
│   │   └── daily-draw.ts          # Hash + draw logic
│   └── pages/
│       ├── index.astro            # Today's card
│       ├── deck.astro             # Browse all cards
│       ├── archive.astro          # Past draws
│       ├── submit.astro           # Fortune submission form
│       └── stats.astro            # Deck stats
├── public/
│   └── cards/                     # Card art assets
├── api/                           # Azure SWA functions (if using Path A)
│   └── submit-fortune/
│       └── index.js
├── astro.config.mjs
└── package.json
```
