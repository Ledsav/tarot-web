# Mobile reading-page fixes + share button content

## Problem

On mobile, the `/reading/` page (`reading.css` / `reading.js`) has:
- The whole page reads as off-center / has stray horizontal scroll room.
- Too much vertical spacing/scroll between sections.
- Text sizing that isn't well tuned for narrow (360–390px) viewports.

Separately, the share button (`shareBtn` in `reading.js`) builds a summary
that includes each card's name/position and the final conclusion, but not
each card's individual reading paragraph — so a shared reading is missing
most of its content.

## Root cause: off-center / overflow

`.glow` (`reading.css:40-47`) is `width: min(640px, 120vw)`, absolutely
positioned inside `.reading-page`. On narrow viewports this is wider than
the actual content column. Only `body` has `overflow-x: hidden`, not
`html` — a known mobile Safari gap where the scrollable/viewport element
can still gain real horizontal scroll room from an oversized descendant,
even though nothing appears to justify scrolling. That extra scroll room
reads as "the page is off-center."

## Fixes

1. **Overflow containment**: add `overflow-x: hidden` to `html` in
   addition to `body`, and cap `.glow`'s width so it can't exceed the
   viewport (`min(640px, 100vw)` instead of `120vw`).
2. **Mobile spacing**: add a `@media (max-width: 480px)` block reducing
   `.reading-page`'s top padding and its `2.75rem` section gap, plus
   tightening `.stage` / `.conclusion-zone` gaps, to cut dead scroll
   distance between sections.
3. **Text sizing**: lower the minimum end of the `clamp()`s for the
   headline, subtitle, and reading/stage-meaning body copy so nothing
   feels oversized on a ~360–390px-wide screen. Upper bounds (larger
   screens) are unchanged.

These are CSS-only changes; no markup or JS structure changes needed for
the layout fixes.

## Share button fix

`buildSummary()` (`reading.js:245-261`) currently emits, per card, only
`"{position} — {card name}{reversed}"`. It should also include that
card's individual reading paragraph, sourced from `state.parts.cards[i]`
(the AI-written per-card text set by `splitReading`), falling back to the
card's static `upright`/`reversed` meaning if `state.parts` isn't
populated yet (mirrors the existing `fallbackText()` fallback logic used
elsewhere in the file).

Output shape becomes, per card:
```
{position} — {card name}{, reversed}
{card's reading paragraph}
```
followed by a blank line, then the conclusion, then the "Read yours at
{url}" line — same overall structure as today, just with the per-card
paragraph inserted.

## Testing

Manual only: resize/emulate a ~375px-wide viewport and confirm no
horizontal scroll and reasonable spacing/text sizing; run through a full
reading and use the share button (clipboard fallback path) to confirm
the copied text includes all three card paragraphs plus the conclusion.
No existing automated tests cover CSS or `reading.js`'s DOM-driven share
flow, and this doesn't warrant adding a browser test harness for a
small styling + text-assembly fix.
