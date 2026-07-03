# Gamified Sequential Card Reveal — Design

**Date:** 2026-07-03
**Status:** Approved, ready for implementation plan
**Scope:** Reading page only (`/reading/`). Backend `Code.gs` unchanged.

## Problem

Today the reading page draws all three cards at once, flips them together, and
renders the entire AI reading as one block of text. It works but lands flat: no
pacing, no suspense, and a wall of text. We want a paced, game-like reveal that
walks the querent through the spread one card at a time.

Advertising was the original motivation ("watch an ad to unlock each card"), but
with no ad network, affiliations, or traffic yet, real ads make no sense now and
placeholder ad boxes would only add friction for zero revenue. **Decision: build
the sequential reveal now with no ads; design each step so a future ad break can
slot into the "Next" transition without a rebuild.**

## Experience

Mobile-first, single-card focus. The **same focused view on web**, just scaled up
and centered (no separate desktop spread layout).

After the user submits the question and taps **Draw your spread**, the ask-form
and static 3-card spread are replaced by a one-card-at-a-time journey:

1. **Progress pips** at the top — three markers labeled Past · Present · Future —
   show which position is active and which are done.
2. One large **face-down card floats** in the center with a "Tap to reveal" hint.
3. **User taps the card** → it flips (reuse existing `.card.revealed` flip) →
   the card name + orientation appear → the card's **meaning paragraph fades in**
   below → a **Next** button appears.
4. **Next** animates the current card away (shrinks toward its progress pip); the
   next face-down card floats in. Repeat for cards 2 and 3.
5. After card 3, the button reads **"Reveal what they say together"** → the three
   mini-cards line up above, and the **conclusion paragraph** fades in, followed
   by the existing **"Ask the cards again"** retry button.

### Reveal mechanic
- Tapping the **card itself** performs the flip (the tap *is* the reveal — most
  tactile/game-like). A separate **Next** button advances to the following card.

### Ad seam
- The transition triggered by **Next** (between finishing one card and the next
  card floating in) is the single, clean insertion point for a future ad break.
  Nothing fake is shown now — the seam is structural only.

## Data flow

- **One** background reading request fires the moment the user draws — no extra
  API calls. Four per reading would blow the Groq rate limits (10/min, 80/day).
- The backend already returns 3 card paragraphs + 1 conclusion paragraph. The
  frontend splits on blank lines and maps: paragraph[0]→card 1, [1]→card 2,
  [2]→card 3, [3]→conclusion.
- The request runs while the user taps/reads, so text is normally ready by the
  time each card is revealed. If a card's paragraph is not yet available on
  reveal, its meaning area shows a **shimmer** placeholder, then fills when the
  response lands.
- The curated **offline fallback** (`fallbackText`) already emits one block per
  card joined by blank lines, so the same splitter maps it cleanly.

### Defensive handling
- **≠ 4 paragraphs from the model:** degrade gracefully — never crash. If fewer
  than 4, show whatever paragraphs exist against cards in order and put any
  remainder (or a sensible default) in the conclusion; if more, fold extras into
  the conclusion.
- **Text not ready on reveal:** shimmer placeholder until it arrives.
- **Request fails entirely:** reveal proceeds using the curated fallback text,
  and the retry button appears at the end (as today).
- **`prefers-reduced-motion`:** skip the float and slide transitions; keep the
  card flip (or cross-fade) so the reveal is still legible without motion.

## Visual direction

Apply the `frontend-design` and `ui-ux-pro-max` skills during build for:
- the floating/idle motion of the face-down card,
- the flip and slide-to-pip transitions,
- progress-pip styling and active/done states,
- meaning-paragraph fade-in and the shimmer placeholder,
- typography and spacing consistent with the existing LUX aesthetic
  (Playfair Display / Inter, the current dark, warm palette).

Reuse existing assets and styles wherever possible — card art, the flip animation,
fonts, the reading typography, and the sound toggle all stay.

## Files touched

- `reading/index.html` — new single-card view markup + progress pips; keep the
  ask-form; the old always-visible 3-slot spread is replaced by the staged view.
- `reading.js` — a small reveal **state machine** (current index, per-step
  reveal, Next handling, background-fetch coordination, shimmer, fallback split).
- `reading.css` — single-card layout, progress pips, float/flip/slide
  transitions, shimmer, reduced-motion handling.
- `docs/apps-script/Code.gs` — **unchanged.**

## Out of scope (YAGNI)

- Any real or placeholder advertising units.
- Per-card separate API calls.
- A distinct desktop multi-card spread layout.
- Backend/prompt changes.

## Success criteria

- On mobile and web, cards reveal one at a time by tapping the card; Next advances.
- Each card's meaning appears with that card; the conclusion appears after card 3.
- No additional API calls beyond today's single reading request.
- Loading, model-format variance, network failure, and reduced-motion are all
  handled without a broken or blank state.
- The Next transition is a clean, documented seam for a future ad break.
