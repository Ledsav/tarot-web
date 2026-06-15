# LUX — Tarot Landing Page Design Spec

**Date:** 2026-06-15  
**Platform:** GitHub Pages (static HTML/CSS/JS, no build step)  
**Goal:** Waitlist email capture — readings not yet open

---

## Overview

A single-screen, mobile-first landing page for **LUX**, a tarot reading service. The page opens veiled in parchment-toned smoke that slowly parts to reveal the content beneath — an editorial headline, a short subtitle directing to the CTA, and an email waitlist form. The visual language is minimal and magical: warm parchment tones, oxblood red, gold accents, and a red-gloved arm holding The Sun tarot card.

---

## Layout

### Desktop
Mirrors the `hf.png` reference exactly:
- Full-viewport parchment background (`background.png`)
- **Left column (~55% width):** wordmark, headline, body copy, email form — vertically centered in the viewport
- **Right column (~45% width):** `harm.png` arm composited into the frame, right-edge cropped, bleeding to the edge of the viewport
- No navigation, no footer, no scroll

### Mobile
Mirrors the `mobile.png` reference:
- Single column, full viewport
- Top: wordmark `LUX`
- Below: headline, body copy, email form stacked
- `harm.png` arm peeks from the bottom-right corner, partially cropped — anchored to the viewport bottom-right

---

## Copy

| Element | Text |
|---|---|
| Wordmark | `LUX` |
| Headline | `Do you dare to` *`know`*`?` |
| Body | `Readings open soon. Leave your email and you'll be the first to receive yours.` |
| Input placeholder | `your@email.com` |
| Button label | `JOIN →` |

The word *know* is styled in Playfair Display italic. The rest of the headline is Playfair Display regular.

---

## Visual Assets

| File | Usage |
|---|---|
| `design/assets/background.png` | Full-viewport background, `object-fit: cover` |
| `design/assets/harm.png` | Hero arm — transparent PNG, composited right (desktop) / bottom-right (mobile) |
| `design/assets/smoke_background_removed_1.png` | Large L-shaped corner cloud — entrance animation + residual atmospheric layer |
| `design/assets/smoke_background_removed_2.png` | Wide horizontal cloud — entrance animation |
| `design/assets/smoke_background_removed_3.png` | Vertical pillar cloud — entrance animation |
| `design/assets/smoke_background_removed_4.png` | Round puff cloud — entrance animation + residual atmospheric layer |

All smoke PNGs have transparent backgrounds and are warm parchment/beige toned — they blend naturally with the background.

---

## Color Palette

Sourced from `mood.png` reference:

| Name | Hex | Usage |
|---|---|---|
| Parchment | `#F2E8D5` | Background base, body text areas |
| Warm Ivory | `#EDE0C4` | Secondary backgrounds |
| Oxblood | `#6B1A1A` | Button background, italic headline accent |
| Gold | `#C9A84C` | Wordmark `LUX`, subtle decorative accents |
| Ink | `#1A1412` | Headline text, body text |
| Terracotta | `#B85C38` | Hover states |

---

## Typography

Loaded from Google Fonts:

| Role | Font | Weight/Style |
|---|---|---|
| Wordmark `LUX` | Playfair Display | 700, tracked (`letter-spacing: 0.25em`) |
| Headline | Playfair Display | 700 regular + 700 italic for *know* |
| Body copy | Inter | 400, 16px / 1.6 line-height |
| Input + button | Inter | 400 |

Headline size: `clamp(2.8rem, 6vw, 5rem)` — scales fluidly across breakpoints.

---

## Entrance Animation

Total duration: ~3 seconds. All easing uses `cubic-bezier(0.25, 0.46, 0.45, 0.94)`.

### Layer stack (bottom to top)
1. `background.png` — base layer
2. Smoke cloud PNGs — positioned as absolute overlays
3. `harm.png` arm — above background, below text
4. Text content + form — top layer

### Sequence

| Time | Event |
|---|---|
| 0s | Background fades in from black (`opacity: 0 → 1`, 0.8s) |
| 0.2s | All 4 smoke clouds are visible at `opacity: 0.8`, covering the center |
| 0.8s | Clouds begin slow drift outward + fade (`opacity: 0.8 → 0`, translation varies per cloud, duration 1.4s each) |
| 1.0s | `LUX` wordmark fades in + drifts up 8px (`opacity: 0 → 1`, 0.6s) |
| 1.2s | Headline line 1 fades in + drifts up 8px |
| 1.4s | Headline line 2 fades in + drifts up 8px |
| 1.6s | Body copy fades in |
| 1.8s | Email form fades in + drifts up 6px |
| 1.8s | Arm slides in from right edge (desktop) / bottom-right (mobile), `translateX(40px) → translateX(0)`, 0.7s |
| After 2.2s | `_1` and `_4` smoke clouds settle at residual `opacity: 0.08` for permanent atmospheric depth |

### Cloud positioning (desktop)
- `_1` (L-shape): anchored top-left corner, drifts `translate(-60px, -40px)` on exit
- `_2` (horizontal): center-bottom, drifts `translateY(80px)` on exit
- `_3` (vertical pillar): right-center, drifts `translate(60px, -30px)` on exit
- `_4` (round puff): bottom-right, drifts `translate(40px, 60px)` on exit

### Cloud positioning (mobile)
- `_1`: top-left, smaller scale (~60%)
- `_4`: bottom-right, behind arm, smaller scale (~50%)
- `_2` and `_3`: omitted on mobile to avoid clutter

---

## Email Form Behavior

- On submit: input + button replaced by confirmation text: *"You're on the list. The cards will find you."*
- No backend required at launch — form submission handled by a free tier of [Formspree](https://formspree.io) or similar static-form service
- Basic client-side validation: non-empty, contains `@`

---

## File Structure

```
tarot-web/
├── index.html
├── style.css
├── main.js
└── design/
    └── assets/
        ├── background.png
        ├── harm.png
        ├── smoke_background_removed_1.png
        ├── smoke_background_removed_2.png
        ├── smoke_background_removed_3.png
        └── smoke_background_removed_4.png
```

Single HTML file + one CSS + one JS. No build step, no dependencies beyond Google Fonts. Deployable directly to GitHub Pages.

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| < 640px | Mobile layout: single column, arm bottom-right corner |
| 640px–1024px | Transition: arm scales down, text column widens |
| > 1024px | Full desktop split layout |

---

## Accessibility

- `alt` text on all images
- Form `<label>` associated with input
- Color contrast: Ink on Parchment passes WCAG AA at all text sizes
- Reduced motion: if `prefers-reduced-motion`, skip all animation transitions — content appears immediately at final state
