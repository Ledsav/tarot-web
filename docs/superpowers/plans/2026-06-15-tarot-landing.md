# LUX Tarot Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-screen, mobile-first waitlist landing page for LUX tarot readings, deployable directly to GitHub Pages with no build step.

**Architecture:** Pure static site — one `index.html`, one `style.css`, one `main.js`. Assets already exist in `design/assets/`. CSS keyframe animations handle the smoke entrance effect with staggered content reveals. Vanilla JS handles form submission via Formspree.

**Tech Stack:** HTML5, CSS3 (custom properties, keyframe animations, CSS Grid), Vanilla JS (Fetch API), Google Fonts (Playfair Display + Inter), Formspree (free tier static form backend)

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Page structure: background div, 4 smoke layers, content column, arm container |
| `style.css` | All styling: reset, CSS variables, layout, typography, smoke positioning, all animations, responsive breakpoints, reduced motion |
| `main.js` | Form validation, Formspree AJAX submission, success/error state |
| `design/assets/background.png` | Full-viewport parchment background (already exists) |
| `design/assets/harm.png` | Hero arm — transparent PNG (already exists) |
| `design/assets/smoke_background_removed_1.png` | L-shape corner cloud (already exists) |
| `design/assets/smoke_background_removed_2.png` | Horizontal cloud (already exists) |
| `design/assets/smoke_background_removed_3.png` | Vertical pillar cloud (already exists) |
| `design/assets/smoke_background_removed_4.png` | Round puff cloud (already exists) |

---

### Task 1: HTML scaffold

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LUX — Tarot Readings</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="bg" aria-hidden="true"></div>

  <img class="smoke smoke-1" src="design/assets/smoke_background_removed_1.png" alt="" aria-hidden="true">
  <img class="smoke smoke-2" src="design/assets/smoke_background_removed_2.png" alt="" aria-hidden="true">
  <img class="smoke smoke-3" src="design/assets/smoke_background_removed_3.png" alt="" aria-hidden="true">
  <img class="smoke smoke-4" src="design/assets/smoke_background_removed_4.png" alt="" aria-hidden="true">

  <main class="page">
    <section class="content">
      <p class="wordmark">LUX</p>
      <h1 class="headline">Do you dare to <em>know</em>?</h1>
      <p class="body-copy">
        Readings open soon. Leave your email and you'll be the first to receive yours.
      </p>
      <form class="email-form" id="waitlist-form" novalidate>
        <label for="email" class="form-label">Reserve your place</label>
        <div class="form-row">
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            required
            autocomplete="email"
          >
          <button type="submit">JOIN →</button>
        </div>
        <p class="form-error" id="form-error" role="alert"></p>
      </form>
      <p class="form-success" id="form-success" role="status"></p>
    </section>

    <div class="arm-wrap" aria-hidden="true">
      <img class="arm-img" src="design/assets/harm.png" alt="">
    </div>
  </main>

  <script src="main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Open in browser and verify structure**

Open `index.html` in Chrome. Expect: unstyled text on a white background, broken layout. This is expected — no CSS yet.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add HTML scaffold"
```

---

### Task 2: CSS reset, variables, and background fade-in

**Files:**
- Create: `style.css`

- [ ] **Step 1: Create `style.css`**

```css
/* ===== RESET ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ===== VARIABLES ===== */
:root {
  --parchment: #F2E8D5;
  --oxblood: #6B1A1A;
  --gold: #C9A84C;
  --ink: #1A1412;
  --terracotta: #B85C38;
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* ===== BASE ===== */
html, body {
  height: 100%;
}

body {
  font-family: 'Inter', sans-serif;
  background: #1A1412;
  color: var(--ink);
  overflow: hidden;
}

/* ===== BACKGROUND ===== */
.bg {
  position: fixed;
  inset: 0;
  background-image: url('design/assets/background.png');
  background-size: cover;
  background-position: center;
  z-index: 0;
  opacity: 0;
  animation: bg-fade 0.8s var(--ease-out) forwards;
}

@keyframes bg-fade {
  to { opacity: 1; }
}
```

- [ ] **Step 2: Verify in browser**

Hard-reload (`Ctrl+Shift+R`). Expect: dark screen fades to the parchment/floral texture over 0.8s. Unstyled text visible on top.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add CSS reset, variables, and background fade-in"
```

---

### Task 3: Layout grid (desktop + mobile)

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Append layout rules to `style.css`**

```css
/* ===== LAYOUT ===== */
.page {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 55fr 45fr;
  min-height: 100vh;
  align-items: center;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(2rem, 5vw, 5rem);
}

.arm-wrap {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

/* ===== MOBILE ===== */
@media (max-width: 640px) {
  body {
    overflow: auto;
  }

  .page {
    grid-template-columns: 1fr;
    min-height: 100svh;
  }

  .content {
    padding: 2rem 1.5rem 10rem;
  }

  .arm-wrap {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 55vw;
    height: auto;
    overflow: visible;
    z-index: 1;
  }
}
```

- [ ] **Step 2: Verify in browser**

Reload. Expect (desktop): two-column layout, left ~55%, right ~45%. Open DevTools, set viewport to 400px wide: single column, content stacks.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add desktop grid and mobile single-column layout"
```

---

### Task 4: Smoke cloud positioning

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Append smoke base styles to `style.css`**

```css
/* ===== SMOKE CLOUDS ===== */
.smoke {
  position: fixed;
  z-index: 1;
  pointer-events: none;
  opacity: 0.8;
  display: block;
}

/* smoke-1: L-shape — top-left corner */
.smoke-1 {
  top: -5%;
  left: -5%;
  width: 55%;
  max-width: 600px;
}

/* smoke-2: horizontal — center-bottom */
.smoke-2 {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  max-width: 700px;
}

/* smoke-3: vertical pillar — right center */
.smoke-3 {
  top: 15%;
  right: 28%;
  width: 28%;
  max-width: 350px;
}

/* smoke-4: round puff — bottom-right */
.smoke-4 {
  bottom: 8%;
  right: 3%;
  width: 28%;
  max-width: 380px;
}

@media (max-width: 640px) {
  .smoke-3 { display: none; }
  .smoke-2 { width: 85%; }
  .smoke-4 { width: 45%; }
}
```

- [ ] **Step 2: Verify in browser**

Reload. Expect: 4 warm parchment-toned smoke clouds at 80% opacity layered over the page, partially obscuring the content. Mobile: 3 clouds, `smoke-3` hidden.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add smoke cloud layer positioning"
```

---

### Task 5: Smoke entrance animations (parting mist)

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Append smoke exit keyframes and animations to `style.css`**

```css
/* ===== SMOKE ANIMATIONS ===== */

/* smoke-1 settles at opacity 0.08 — permanent atmospheric residue */
@keyframes smoke-1-exit {
  from { opacity: 0.8; transform: translate(0, 0); }
  to   { opacity: 0.08; transform: translate(-60px, -40px); }
}

/* smoke-2 disappears completely */
@keyframes smoke-2-exit {
  from { opacity: 0.8; transform: translateX(-50%) translateY(0); }
  to   { opacity: 0;   transform: translateX(-50%) translateY(80px); }
}

/* smoke-3 disappears completely */
@keyframes smoke-3-exit {
  from { opacity: 0.8; transform: translate(0, 0); }
  to   { opacity: 0;   transform: translate(60px, -30px); }
}

/* smoke-4 settles at opacity 0.08 — permanent atmospheric residue */
@keyframes smoke-4-exit {
  from { opacity: 0.8; transform: translate(0, 0); }
  to   { opacity: 0.08; transform: translate(40px, 60px); }
}

.smoke-1 { animation: smoke-1-exit 1.4s var(--ease-out) 0.80s forwards; }
.smoke-2 { animation: smoke-2-exit 1.4s var(--ease-out) 0.90s forwards; }
.smoke-3 { animation: smoke-3-exit 1.4s var(--ease-out) 0.85s forwards; }
.smoke-4 { animation: smoke-4-exit 1.4s var(--ease-out) 0.80s forwards; }
```

- [ ] **Step 2: Verify smoke animation in browser**

Hard-reload. Expect:
- 0–0.8s: parchment background fades in, 4 smoke clouds visible at 80% opacity
- 0.8–2.2s: clouds drift outward and fade — `smoke-2` and `smoke-3` vanish, `smoke-1` and `smoke-4` settle at barely-visible 8% opacity in their corners

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add smoke parting-mist entrance animation"
```

---

### Task 6: Typography — wordmark, headline, body copy

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Append typography rules to `style.css`**

```css
/* ===== WORDMARK ===== */
.wordmark {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.25em;
  color: var(--gold);
}

/* ===== HEADLINE ===== */
.headline {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  font-size: clamp(2.8rem, 6vw, 5rem);
  line-height: 1.1;
  color: var(--ink);
}

.headline em {
  font-style: italic;
  color: var(--oxblood);
}

/* ===== BODY COPY ===== */
.body-copy {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ink);
  max-width: 36ch;
}
```

- [ ] **Step 2: Verify in browser**

Reload. Expect: `LUX` in small gold tracked caps. Large Playfair Display headline with italic oxblood-red *know*. Readable Inter body copy below. Proportions match the `hf.png` reference.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add wordmark, headline, and body copy typography"
```

---

### Task 7: Email form styles + success state

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Append form styles to `style.css`**

```css
/* ===== EMAIL FORM ===== */
.email-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  color: var(--ink);
  opacity: 0.6;
  text-transform: uppercase;
}

.form-row {
  display: flex;
}

.email-form input[type="email"] {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--ink);
  border-right: none;
  background: rgba(242, 232, 213, 0.5);
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s;
}

.email-form input[type="email"]::placeholder {
  color: rgba(26, 20, 18, 0.35);
}

.email-form input[type="email"]:focus {
  border-color: var(--oxblood);
}

.email-form button[type="submit"] {
  padding: 0.75rem 1.5rem;
  background: var(--ink);
  color: var(--parchment);
  border: 1.5px solid var(--ink);
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, border-color 0.2s;
}

.email-form button[type="submit"]:hover {
  background: var(--oxblood);
  border-color: var(--oxblood);
}

.email-form button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  font-size: 0.8rem;
  color: var(--oxblood);
  min-height: 1.2em;
}

/* ===== SUCCESS STATE ===== */
.form-success {
  display: none;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ink);
  font-style: italic;
}

.form-success.visible {
  display: block;
  animation: content-reveal 0.6s var(--ease-out) forwards;
}
```

- [ ] **Step 2: Verify in browser**

Reload. Expect: inline input + JOIN → button matching `hf.png`. Hover the button: turns oxblood. Click input: oxblood border appears. Error line is reserved below row but empty.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add email form styles and success state"
```

---

### Task 8: Hero arm — positioning and reveal animation

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Append arm styles to `style.css`**

```css
/* ===== HERO ARM ===== */
.arm-img {
  position: absolute;
  top: 50%;
  right: -5%;
  height: 88vh;
  width: auto;
  object-fit: contain;
  object-position: right center;
  opacity: 0;
  animation: arm-reveal 0.7s var(--ease-out) 1.8s both;
}

@keyframes arm-reveal {
  from { opacity: 0; transform: translateY(-50%) translateX(40px); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0); }
}

/* Medium breakpoint: arm scales down slightly */
@media (min-width: 641px) and (max-width: 1024px) {
  .arm-img {
    height: 70vh;
  }
}

@media (max-width: 640px) {
  .arm-img {
    position: static;
    width: 100%;
    height: auto;
    opacity: 0;
    animation: arm-reveal-mobile 0.7s var(--ease-out) 1.8s both;
  }

  @keyframes arm-reveal-mobile {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
}
```

- [ ] **Step 2: Verify arm in browser**

Hard-reload. Expect (desktop): at 1.8s the arm slides in from right, vertically centered in the right column, slightly clipped at the right edge. Expect (mobile DevTools at 400px): arm appears fixed at bottom-right, sliding from right at 1.8s, partially cropped.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add hero arm positioning and slide-in animation"
```

---

### Task 9: Content reveal — staggered fade-in animations

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Append content reveal keyframe and staggered delays to `style.css`**

```css
/* ===== CONTENT REVEAL ===== */
@keyframes content-reveal {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.wordmark {
  opacity: 0;
  animation: content-reveal 0.6s var(--ease-out) 1.0s both;
}

.headline {
  opacity: 0;
  animation: content-reveal 0.6s var(--ease-out) 1.2s both;
}

.body-copy {
  opacity: 0;
  animation: content-reveal 0.6s var(--ease-out) 1.5s both;
}

.email-form {
  opacity: 0;
  animation: content-reveal 0.6s var(--ease-out) 1.7s both;
}
```

- [ ] **Step 2: Verify full entrance sequence**

Hard-reload. Confirm the complete sequence:

| Time | What appears |
|---|---|
| 0s | Dark ink background |
| 0–0.8s | Parchment background fades in; smoke at 80% opacity covers center |
| 0.8–2.2s | Smoke drifts outward and fades |
| 1.0s | `LUX` wordmark fades up |
| 1.2s | Headline fades up |
| 1.5s | Body copy fades up |
| 1.7s | Email form fades up |
| 1.8s | Arm slides in from right |

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add staggered content reveal animations"
```

---

### Task 10: Form submission JS

**Files:**
- Create: `main.js`

> **Before testing end-to-end:** Create a free account at https://formspree.io, create a new form, and copy the endpoint URL (e.g. `https://formspree.io/f/xpwzgkrb`). Replace `YOUR_FORM_ID` below with your actual ID.

- [ ] **Step 1: Create `main.js`**

```javascript
const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

const form = document.getElementById('waitlist-form');
const emailInput = document.getElementById('email');
const errorEl = document.getElementById('form-error');
const successEl = document.getElementById('form-success');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const email = emailInput.value.trim();
  if (!email || !email.includes('@')) {
    errorEl.textContent = 'Please enter a valid email address.';
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      form.style.display = 'none';
      successEl.textContent = "You're on the list. The cards will find you.";
      successEl.classList.add('visible');
    } else {
      const data = await res.json().catch(() => ({}));
      const msg = data.errors?.[0]?.message || 'Something went wrong. Please try again.';
      errorEl.textContent = msg;
      btn.disabled = false;
      btn.textContent = 'JOIN →';
    }
  } catch {
    errorEl.textContent = 'Unable to connect. Please try again.';
    btn.disabled = false;
    btn.textContent = 'JOIN →';
  }
});
```

- [ ] **Step 2: Verify form validation in browser**

Open `index.html`. Test these cases without a real endpoint:

1. Click JOIN with empty field → error: "Please enter a valid email address."
2. Type `notanemail` → same error
3. Type `test@test.com` → button shows `...` and disables (fetch will fail since endpoint is a placeholder — that's expected)

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "feat: add form submission handler with Formspree"
```

---

### Task 11: Reduced motion support

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Append reduced motion overrides to `style.css`**

```css
/* ===== REDUCED MOTION ===== */
@media (prefers-reduced-motion: reduce) {
  .bg,
  .wordmark,
  .headline,
  .body-copy,
  .email-form,
  .arm-img {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .smoke-1,
  .smoke-4 {
    animation: none !important;
    opacity: 0.08 !important;
    transform: translate(-60px, -40px) !important;
  }

  .smoke-2,
  .smoke-3 {
    animation: none !important;
    opacity: 0 !important;
  }
}
```

- [ ] **Step 2: Verify in browser**

In Chrome DevTools → Rendering panel → set "Emulate CSS media feature: prefers-reduced-motion: reduce". Hard-reload. Expect: all content appears immediately at full opacity, no transitions, faint smoke residue in corners only.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add prefers-reduced-motion support"
```

---

### Task 12: GitHub Pages deployment

**Files:**
- No code changes

- [ ] **Step 1: Confirm all asset paths are relative**

Check `index.html`:
- `src="design/assets/smoke_background_removed_1.png"` ✓
- `src="design/assets/harm.png"` ✓
- `href="style.css"` ✓
- `src="main.js"` ✓

Check `style.css`:
- `url('design/assets/background.png')` ✓

No absolute paths. No `localhost`. No `file://`. ✓

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 3: Enable GitHub Pages**

In the GitHub repo: Settings → Pages → Source: "Deploy from a branch" → Branch: `main`, Folder: `/ (root)` → Save.

- [ ] **Step 4: Verify live page**

After ~30–60 seconds, open `https://<your-username>.github.io/<repo-name>/`. Confirm:
- Parchment background loads
- Smoke entrance animation plays
- Content reveals in sequence
- Arm slides in
- JOIN button hover turns oxblood
- On a real phone: single column, arm at bottom-right corner
