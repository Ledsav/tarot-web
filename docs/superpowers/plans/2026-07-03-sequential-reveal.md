# Gamified Sequential Card Reveal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the reading page's all-at-once card dump with a paced, one-card-at-a-time reveal (tap a face-down card to flip it, read its meaning, tap Next for the following card, then a synthesis conclusion).

**Architecture:** Extract the "split one reading blob into per-card parts" logic into a pure, unit-tested module (`reveal.js`). Rewrite `reading.js` as a small reveal state machine driving a new single-card DOM view. One background reading request fires on draw; its paragraphs are revealed in step, with a shimmer covering any not-yet-arrived text. Backend and prompt are unchanged. Each **Next** transition is a structural seam where a future ad break can slot in.

**Tech Stack:** Vanilla ES modules, plain CSS, `node:test` for the pure logic. Static site served by `python -m http.server` (`npm start`). No build step, no new dependencies.

## Global Constraints

- No new runtime dependencies; vanilla ES modules only (`"type": "module"`).
- **No extra API calls** — exactly one reading request per draw (Groq limits: 10/min, 80/day). Never call the endpoint per-card.
- Backend `docs/apps-script/Code.gs` and the Groq prompt are **unchanged**.
- Mobile-first; the **same** focused single-card view scales up on web (no separate desktop layout).
- Reuse existing assets/styles: card art, flip animation (`.card.revealed` → `rotateY(180deg)`), fonts (Playfair Display / Inter), palette (`--parchment`, `--oxblood`, `--gold`, `--ink`), sound toggle.
- Honor `prefers-reduced-motion`: skip float/slide/shimmer/pulse animations; keep the reveal legible (instant flip / cross-fade).
- Card object shape (from `deck.js`): `{ id, name, image, upright, reversed }`.
- No `Co-Authored-By` trailer in commits.

---

### Task 1: Pure reading splitter (`reveal.js`)

Extract the defensive "one blob → per-card parts" logic as a pure function so it can be unit-tested in Node without a DOM.

**Files:**
- Create: `reveal.js`
- Test: `test/reveal.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `splitReading(text: string) => { cards: [string, string, string], conclusion: string }`
  - Splits `text` on blank lines into trimmed, non-empty paragraphs.
  - `cards` is always exactly length 3 (missing slots are `''`).
  - `conclusion` is the 4th-and-beyond paragraphs joined by `\n\n`, else `''`.

- [ ] **Step 1: Write the failing test**

Create `test/reveal.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitReading } from '../reveal.js';

test('four paragraphs → three cards + conclusion', () => {
  const out = splitReading('Card one.\n\nCard two.\n\nCard three.\n\nDo this.');
  assert.deepEqual(out.cards, ['Card one.', 'Card two.', 'Card three.']);
  assert.equal(out.conclusion, 'Do this.');
});

test('five+ paragraphs → extras fold into the conclusion', () => {
  const out = splitReading('a\n\nb\n\nc\n\nd\n\ne');
  assert.deepEqual(out.cards, ['a', 'b', 'c']);
  assert.equal(out.conclusion, 'd\n\ne');
});

test('exactly three paragraphs → no conclusion', () => {
  const out = splitReading('a\n\nb\n\nc');
  assert.deepEqual(out.cards, ['a', 'b', 'c']);
  assert.equal(out.conclusion, '');
});

test('fewer than three paragraphs → pad missing card slots with empty strings', () => {
  const out = splitReading('only one');
  assert.deepEqual(out.cards, ['only one', '', '']);
  assert.equal(out.conclusion, '');
});

test('empty / whitespace input → all empty, never throws', () => {
  const out = splitReading('   \n\n  ');
  assert.deepEqual(out.cards, ['', '', '']);
  assert.equal(out.conclusion, '');
});

test('collapses irregular blank-line runs and trims paragraphs', () => {
  const out = splitReading('  a  \n\n\n   b\n \n c \n\n\n\n d ');
  assert.deepEqual(out.cards, ['a', 'b', 'c']);
  assert.equal(out.conclusion, 'd');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '.../reveal.js'` (or "splitReading is not a function").

- [ ] **Step 3: Write minimal implementation**

Create `reveal.js`:

```js
// Pure helpers for turning one reading blob into per-card parts.
// No DOM here — this module is unit-tested in Node.

// The backend is prompted for 3 card paragraphs + 1 conclusion, but models
// don't always comply, so this degrades instead of crashing:
//   - cards is always length 3 (missing slots become '')
//   - anything past the 3rd paragraph becomes the conclusion
export function splitReading(text) {
  const paras = String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const cards = [paras[0] || '', paras[1] || '', paras[2] || ''];
  const conclusion = paras.length > 3 ? paras.slice(3).join('\n\n') : '';
  return { cards, conclusion };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — all `reveal.test.mjs` tests green (plus the existing deck/draw tests still green).

- [ ] **Step 5: Commit**

```bash
git add reveal.js test/reveal.test.mjs
git commit -m "feat: pure splitReading helper for per-card reading parts"
```

---

### Task 2: Single-card stage markup + styles

Replace the always-visible 3-card spread and the single reading block with the staged single-card view and a separate conclusion zone. Add all layout, pips, transitions, shimmer, and reduced-motion CSS. No behavior yet — the state machine (Task 3) wires it up.

**Files:**
- Modify: `reading/index.html` (replace `<section id="spread">` and `<section class="reading-zone">`, lines 43–62)
- Modify: `reading.css` (replace the `/* Spread */` and `/* Reading */` blocks, lines 67–91; extend the reduced-motion block, lines 107–110)

**Interfaces:**
- Consumes: `splitReading` (used in Task 3, not here).
- Produces the exact DOM contract Task 3 queries:
  - `#stage` (section, starts `hidden`) containing:
    - `.pips` `<ol>` with three `.pip` `<li>` items (order: Past, Present, Future)
    - `.stage-card-wrap` wrapping `button.stage-card` → `.card` → `.card-back` + `.card-front > img`
    - `.tap-hint` `<p>`
    - `.stage-position` `<p>`
    - `.stage-meaning` `<div>` (starts `hidden`)
    - `button.stage-next` (starts `hidden`)
  - `.conclusion-zone` (section, starts `hidden`) containing `.mini-cards` `<div>`, `#reading` `<div>`, `#retry-btn` `<button>`
  - CSS: `.pip.active`, `.pip.done`, `.stage-card-wrap.floating`, `.stage-meaning.shimmer`, `.mini-card.reversed`, `.card-front.reversed` (existing) drive the visual states Task 3 toggles.

- [ ] **Step 1: Replace the spread + reading-zone markup**

In `reading/index.html`, replace lines 43–62 (the `<section id="spread">…</section>` and `<section class="reading-zone">…</section>` blocks) with:

```html
    <section id="stage" class="stage" hidden>
      <ol class="pips" aria-hidden="true">
        <li class="pip" data-label="Past"></li>
        <li class="pip" data-label="Present"></li>
        <li class="pip" data-label="Future"></li>
      </ol>

      <div class="stage-card-wrap">
        <button type="button" class="stage-card" aria-label="Reveal the card">
          <div class="card">
            <div class="card-face card-back"></div>
            <div class="card-face card-front"><img alt=""></div>
          </div>
        </button>
      </div>
      <p class="tap-hint">Tap the card to reveal it</p>

      <p class="stage-position"></p>
      <div class="stage-meaning" aria-live="polite" hidden></div>

      <button type="button" class="stage-next" hidden></button>
    </section>

    <section class="conclusion-zone" hidden>
      <div class="mini-cards" aria-hidden="true"></div>
      <div id="reading" class="reading"></div>
      <button id="retry-btn" type="button" class="retry-btn">Ask the cards again</button>
    </section>
```

- [ ] **Step 2: Replace the Spread + Reading CSS blocks**

In `reading.css`, replace lines 67–91 (from `/* Spread */` through the `.retry-btn` rule at the end of the `/* Reading */` block) with:

```css
/* Staged single-card reveal */
.stage {
  display: flex; flex-direction: column; align-items: center; gap: 1.4rem;
}

/* Progress pips */
.pips { list-style: none; display: flex; gap: 0.75rem; align-items: center; }
.pip {
  width: 10px; height: 10px; border-radius: 999px;
  border: 1px solid var(--gold); background: transparent;
  transition: transform 0.3s var(--ease-out), background 0.3s var(--ease-out);
}
.pip.done { background: rgba(201, 168, 76, 0.55); }
.pip.active { background: var(--gold); transform: scale(1.5); box-shadow: 0 0 10px rgba(201, 168, 76, 0.6); }

/* The one big card */
.stage-card-wrap { width: 100%; max-width: 300px; perspective: 1200px; }
.stage-card-wrap.floating { animation: float 3.2s ease-in-out infinite; }
.stage-card {
  display: block; width: 100%; padding: 0; border: 0; background: none;
  cursor: pointer;
}
.stage-card:disabled { cursor: default; }
.stage-card .card {
  width: 100%; aspect-ratio: 300 / 520;
  transform-style: preserve-3d; transition: transform 0.7s var(--ease-out);
}
.stage-card .card.revealed { transform: rotateY(180deg); }
.card-face {
  position: absolute; inset: 0; backface-visibility: hidden;
  border-radius: 8px; overflow: hidden; border: 1px solid rgba(201, 168, 76, 0.5);
}
/* .card must be positioned for the absolutely-placed faces */
.stage-card .card { position: relative; }
.card-back { background: url('design/assets/cards/card-back.svg') center / cover no-repeat; }
.card-front { transform: rotateY(180deg); background: var(--ink); }
.card-front img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card-front.reversed img { transform: rotate(180deg); }

.tap-hint {
  color: var(--gold); font-style: italic; font-size: 0.9rem;
  animation: pulse 2s ease-in-out infinite;
}
.tap-hint[hidden] { display: none; }

.stage-position {
  font-family: 'Playfair Display', serif; color: var(--gold);
  font-size: 0.95rem; letter-spacing: 0.15em; text-transform: uppercase;
  text-align: center;
}

.stage-meaning {
  font-size: 1.05rem; line-height: 1.7; text-align: center;
  max-width: 52ch; animation: fadeInUp 0.6s var(--ease-out) both;
}
.stage-meaning[hidden] { display: none; }
.stage-meaning.shimmer {
  min-height: 4.5rem; width: 100%; border-radius: 6px; animation: none;
  background: linear-gradient(100deg,
    rgba(242, 232, 213, 0.05) 30%,
    rgba(242, 232, 213, 0.16) 50%,
    rgba(242, 232, 213, 0.05) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.stage-next {
  cursor: pointer; background: var(--oxblood); color: var(--parchment);
  border: 1px solid var(--gold); font-family: 'Playfair Display', serif;
  letter-spacing: 0.12em; padding: 0.85rem 1.6rem; border-radius: 4px;
  animation: fadeInUp 0.5s var(--ease-out) both;
  transition: background 0.25s var(--ease-out), transform 0.25s var(--ease-out);
}
.stage-next:hover { background: #7f2020; transform: translateY(-2px); }
.stage-next[hidden] { display: none; }

/* Conclusion */
.conclusion-zone { display: flex; flex-direction: column; align-items: center; gap: 1.4rem; }
.mini-cards { display: flex; gap: 0.6rem; justify-content: center; }
.mini-card {
  width: 64px; aspect-ratio: 300 / 520; object-fit: cover;
  border-radius: 6px; border: 1px solid rgba(201, 168, 76, 0.5);
  animation: fadeInUp 0.5s var(--ease-out) both;
}
.mini-card.reversed { transform: rotate(180deg); }
.reading { font-size: 1.05rem; line-height: 1.7; text-align: center; max-width: 52ch; }
.reading p { margin-bottom: 0.9rem; }
.retry-btn { align-self: center; }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
```

- [ ] **Step 3: Extend the reduced-motion block**

In `reading.css`, replace the existing reduced-motion block (lines 107–110) with:

```css
@media (prefers-reduced-motion: reduce) {
  .card, .stage-card .card { transition: none; }
  #draw-btn, .retry-btn, .stage-next, .pip { transition: none; }
  .stage-card-wrap.floating,
  .tap-hint,
  .stage-meaning,
  .stage-meaning.shimmer,
  .stage-next,
  .mini-card { animation: none; }
}
```

- [ ] **Step 4: Verify the layout renders**

Run: `npm start`, open `http://localhost:8000/reading/` in a browser.
In DevTools console, temporarily reveal the stage:
```js
document.getElementById('stage').hidden = false;
document.querySelector('.stage-card-wrap').classList.add('floating');
```
Expected: three pips in a row, one large floating face-down card, "Tap the card to reveal it" hint pulsing, no console errors, page does not scroll horizontally. Then reload to restore the hidden state. (Full behavior is wired in Task 3.)

- [ ] **Step 5: Commit**

```bash
git add reading/index.html reading.css
git commit -m "feat: single-card stage markup and styles for sequential reveal"
```

---

### Task 3: Reveal state machine (`reading.js`)

Rewrite `reading.js` to drive the staged view: draw → show card 1 face-down + fire one background reading request → tap to flip + show meaning (shimmer if not yet loaded) → Next advances → after card 3, show the conclusion. Keep the sound toggle and prompt chips exactly as they are.

**Files:**
- Modify: `reading.js` (full rewrite of everything below the sound-toggle/chips wiring; keep those parts)

**Interfaces:**
- Consumes: `DECK` (`deck.js`), `drawSpread` (`draw.js`), `splitReading` (`reveal.js`, Task 1). DOM contract from Task 2.
- Produces: user-facing behavior only (no exports).

- [ ] **Step 1: Rewrite `reading.js`**

Replace the entire contents of `reading.js` with:

```js
import { DECK } from './deck.js';
import { drawSpread } from './draw.js';
import { splitReading } from './reveal.js';

const GROQ_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxzK1XY99_2VTiRve-6czO08UdvZ6Ok2VoO8i1_otCeKEEsK2slhzczX8FKs5a2Ba5X/exec';

const form = document.getElementById('ask-form');
const questionEl = document.getElementById('question');

const stage = document.getElementById('stage');
const pips = [...stage.querySelectorAll('.pip')];
const stageCardWrap = stage.querySelector('.stage-card-wrap');
const stageCard = stage.querySelector('.stage-card');
const cardEl = stage.querySelector('.card');
const cardFront = stage.querySelector('.card-front');
const cardImg = stage.querySelector('.card-front img');
const tapHint = stage.querySelector('.tap-hint');
const stagePosition = stage.querySelector('.stage-position');
const stageMeaning = stage.querySelector('.stage-meaning');
const nextBtn = stage.querySelector('.stage-next');

const conclusionZone = document.querySelector('.conclusion-zone');
const miniCards = conclusionZone.querySelector('.mini-cards');
const readingEl = document.getElementById('reading');
const retryBtn = document.getElementById('retry-btn');

const audio = document.getElementById('bg-audio');
const soundToggle = document.getElementById('sound-toggle');

// --- Sound toggle (unchanged behavior) ---
let soundOn = localStorage.getItem('lux-sound') === 'on';

function reflectSound() {
  soundToggle.textContent = soundOn ? '♪ on' : '♪ off';
  soundToggle.setAttribute('aria-pressed', String(soundOn));
  if (soundOn) audio.play().catch(() => {});
  else audio.pause();
}
soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  localStorage.setItem('lux-sound', soundOn ? 'on' : 'off');
  reflectSound();
});
function startAudioIfEnabled() { if (soundOn) audio.play().catch(() => {}); }
reflectSound();

// --- Reveal state machine ---
const state = {
  spread: [],
  index: 0,
  revealed: false, // is the current card flipped?
  parts: null,     // { cards, conclusion } once the reading (or fallback) is ready
};

// Curated offline fallback: one block per card, joined by blank lines so
// splitReading maps it exactly like a real reading.
function fallbackText(spread) {
  return spread
    .map((s) => `${s.position} — ${s.card.name}${s.orientation === 'reversed' ? ' (reversed)' : ''}: ` +
                `${s.orientation === 'reversed' ? s.card.reversed : s.card.upright}`)
    .join('\n\n');
}

async function fetchReading(spread) {
  const payload = {
    type: 'reading',
    question: questionEl.value.trim(),
    cards: spread.map((s) => ({
      name: s.card.name,
      orientation: s.orientation,
      position: s.position,
      meaning: s.orientation === 'reversed' ? s.card.reversed : s.card.upright,
    })),
  };
  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // simple request → no CORS preflight
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.reading) throw new Error(data.error || 'No reading returned');
    onPartsReady(splitReading(data.reading));
  } catch (err) {
    // Silent, graceful: the reveal continues on the curated meanings.
    onPartsReady(splitReading(fallbackText(spread)));
  }
}

function onPartsReady(parts) {
  state.parts = parts;
  // If the current card is revealed and still shimmering, fill it now.
  if (state.revealed && stageMeaning.classList.contains('shimmer')) showMeaning();
}

function updatePips() {
  pips.forEach((pip, i) => {
    pip.classList.toggle('done', i < state.index);
    pip.classList.toggle('active', i === state.index);
  });
}

function renderCurrentCard() {
  const { card, orientation } = state.spread[state.index];
  cardEl.classList.remove('revealed');
  stageCardWrap.classList.add('floating');
  cardFront.classList.toggle('reversed', orientation === 'reversed');
  cardImg.src = card.image; // browser encodes spaces in the path
  cardImg.alt = `${card.name}${orientation === 'reversed' ? ', reversed' : ''}`;
  stagePosition.textContent = '';
  stageMeaning.hidden = true;
  stageMeaning.classList.remove('shimmer');
  stageMeaning.textContent = '';
  nextBtn.hidden = true;
  tapHint.hidden = false;
  stageCard.disabled = false;
  stageCard.setAttribute('aria-label', 'Reveal the card');
  state.revealed = false;
  updatePips();
}

function showMeaning() {
  stageMeaning.hidden = false;
  if (state.parts) {
    stageMeaning.classList.remove('shimmer');
    stageMeaning.textContent = state.parts.cards[state.index] || '';
    // Re-trigger the fade-in each time text lands.
    stageMeaning.style.animation = 'none';
    void stageMeaning.offsetWidth;
    stageMeaning.style.animation = '';
  } else {
    stageMeaning.classList.add('shimmer'); // reading not back yet
    stageMeaning.textContent = '';
  }
}

function revealCurrent() {
  if (state.revealed) return;
  state.revealed = true;
  const { card, orientation, position } = state.spread[state.index];
  cardEl.classList.add('revealed');
  stageCardWrap.classList.remove('floating');
  tapHint.hidden = true;
  stageCard.disabled = true;
  stageCard.setAttribute('aria-label', `${position}: ${card.name}`);
  stagePosition.textContent =
    `${position} · ${card.name}${orientation === 'reversed' ? ' (reversed)' : ''}`;
  showMeaning();
  const isLast = state.index === state.spread.length - 1;
  nextBtn.textContent = isLast ? 'Reveal what they say together' : 'Next →';
  nextBtn.hidden = false;
}

function goNext() {
  // The seam: a future ad break slots in here, before advancing.
  if (state.index < state.spread.length - 1) {
    state.index += 1;
    renderCurrentCard();
    stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    showConclusion();
  }
}

function showConclusion() {
  pips.forEach((pip) => { pip.classList.add('done'); pip.classList.remove('active'); });

  miniCards.innerHTML = '';
  state.spread.forEach(({ card, orientation }) => {
    const img = document.createElement('img');
    img.src = card.image;
    img.alt = '';
    img.className = 'mini-card' + (orientation === 'reversed' ? ' reversed' : '');
    miniCards.appendChild(img);
  });

  const conclusion = (state.parts && state.parts.conclusion) ||
    'The cards have spoken — let their images settle in you.';
  readingEl.innerHTML = '';
  conclusion.split(/\n\s*\n/).forEach((para) => {
    const p = document.createElement('p');
    p.textContent = para.trim();
    readingEl.appendChild(p);
  });

  stage.hidden = true;
  conclusionZone.hidden = false;
  conclusionZone.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  startAudioIfEnabled();

  state.spread = drawSpread(DECK);
  state.index = 0;
  state.parts = null;
  state.revealed = false;

  form.hidden = true;
  conclusionZone.hidden = true;
  stage.hidden = false;
  renderCurrentCard();
  fetchReading(state.spread); // one request, in the background
  stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

stageCard.addEventListener('click', revealCurrent);
nextBtn.addEventListener('click', goNext);

retryBtn.addEventListener('click', () => {
  stage.hidden = true;
  conclusionZone.hidden = true;
  form.hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Preset question chips: clicking one fills the question field.
document.querySelectorAll('.prompt-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    questionEl.value = chip.textContent.trim();
    questionEl.focus();
  });
});
```

- [ ] **Step 2: Verify the existing unit tests still pass**

Run: `npm test`
Expected: PASS — deck, draw, and reveal tests all green (this task adds no tests but must not break the suite).

- [ ] **Step 3: Verify the happy path in the browser**

Run: `npm start`, open `http://localhost:8000/reading/`.
- Type a question (or click a chip), click **Draw your spread**.
- Expected: the form disappears; a floating face-down card appears with pip 1 active and the "Tap the card to reveal it" hint.
- Tap the card. Expected: it flips, `Past · <Card Name>` shows, a meaning paragraph fades in (or a shimmer that fills within a moment), and a **Next →** button appears.
- Tap **Next**. Expected: pip 1 marked done, pip 2 active, a fresh floating face-down card. Repeat through card 3, where the button reads **Reveal what they say together**.
- Tap it. Expected: the stage is replaced by three mini-cards and the conclusion paragraph; **Ask the cards again** returns to the form.

- [ ] **Step 4: Verify the failure + reduced-motion paths**

- In DevTools, set **Network: Offline**, then draw and reveal. Expected: no error surfaces to the user; each card shows its curated meaning (from `fallbackText`) and the flow completes normally through the conclusion.
- In DevTools rendering settings, emulate `prefers-reduced-motion: reduce`, then draw. Expected: no floating/shimmer/pulse animation, but the card still flips/reveals and every meaning + the conclusion are readable.

- [ ] **Step 5: Commit**

```bash
git add reading.js
git commit -m "feat: sequential tap-to-reveal state machine on the reading page"
```

---

## Self-Review

**Spec coverage:**
- Sequential single-card reveal, tap-to-flip, Next advances → Task 3. ✔
- Same focused view on mobile + web → Task 2 CSS (single `max-width` card, no desktop-only layout). ✔
- Progress pips (Past/Present/Future, active/done) → Task 2 markup + CSS, Task 3 `updatePips`. ✔
- Conclusion after card 3 with mini-cards → Task 3 `showConclusion`. ✔
- One background request, no per-card calls → Task 3 `fetchReading` (single call on submit). ✔
- Reuse single reading split into parts → Task 1 `splitReading`. ✔
- Shimmer when text not yet ready → Task 3 `showMeaning` + Task 2 `.shimmer`. ✔
- Model returns ≠4 paragraphs → Task 1 defensive split + tests. ✔
- Network failure → curated fallback, flow continues → Task 3 `fetchReading` catch + Step 4 verify. ✔
- `prefers-reduced-motion` → Task 2 reduced-motion block + Task 3 Step 4 verify. ✔
- Ad seam at Next → Task 3 `goNext` comment. ✔
- Backend/prompt unchanged → no task touches `Code.gs`. ✔

**Placeholder scan:** No TBD/TODO; every code step shows full content. ✔

**Type consistency:** `splitReading` returns `{ cards, conclusion }` in Task 1, consumed identically in Task 3 (`state.parts.cards[i]`, `state.parts.conclusion`). DOM selectors declared in Task 2's Interfaces match every query in Task 3. Card fields (`name`, `image`, `upright`, `reversed`, `orientation`, `position`) match `deck.js`/`draw.js`. ✔
