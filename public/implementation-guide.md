# Daily Standup Tarot — Implementation Guide

A weekend project built with Astro SSG on Azure Static Web Apps. One tarot card drawn per day, locked for everyone. Team members submit anonymous fortunes to grow the deck over time.

---

## Phase 2: The Daily Draw Engine

**Goal:** One card + one fortune per day, deterministic, no backend required.
**Astro concepts:** Utility modules, client-side JS in Astro components, static + client hybrid.

### How It Works

Use the current date as a seed for a simple hash function. Same date always produces the same card + fortune index. Everyone who visits on the same day sees the same pull. Think of it like a combination lock where the date *is* the combination.

### Steps

1. Optional: Create an `/archive` page that computes the last 7–14 days of draws by looping backward through dates and displays them as a timeline.

**Checkpoint:** Visit the site, see today's card. Refresh — same card. Come back tomorrow — different card. No server, no database.

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

## Phase 5: Polish

**Goal:** Make it delightful. These are independent of each other — pick and choose.

1. Add a "Copy Today's Fortune" button below the daily card.
2. On click, copy a formatted string to the clipboard: `"🔮 Daily Standup Tarot — The Deploy (VII): 'Your PR will be approved without comments. Savor this omen.'"`
3. Team members paste it into Slack/Teams. Free engagement loop.

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