# LUX — Tarot Waitlist

A minimal, magical, mobile-first landing page for **LUX**, a tarot reading service. Visitors leave their email to join the waitlist. Built as a pure static site (HTML/CSS/JS, no build step) and deployed on GitHub Pages.

**Live:** https://ledsav.github.io/tarot-web/

## Features

- Mobile-first, responsive layout (single column on mobile, 55/45 split on desktop)
- Animated "parting mist" entrance — smoke clouds drift away to reveal the page
- Staggered content reveal and a red-gloved arm rising with fanned tarot cards
- Editorial typography: Playfair Display (display) + Inter (UI)
- Email capture wired to a Google Sheet via a Google Apps Script webhook
- Respects `prefers-reduced-motion`

## Project Structure

```
tarot-web/
├── index.html              # Page markup
├── style.css               # All styling + animations (mobile-first)
├── main.js                 # Email form handler (posts to Google Sheets)
├── design/
│   └── assets/             # Background, arm, smoke, and card images
├── docs/
│   └── superpowers/        # Design spec and implementation plan
└── README.md
```

## Running Locally

No build step. Either open `index.html` directly, or serve it (recommended, so relative paths and fetch behave like production):

```bash
# Python 3
python -m http.server 8000
# then visit http://localhost:8000
```

## Email Backend

Submissions are sent from `main.js` to a Google Apps Script web app (`SHEETS_ENDPOINT`), which appends each email as a row in a Google Sheet.

The request uses `mode: 'no-cors'`, so the browser cannot read the response — the UI always shows success after the request fires. The endpoint URL is public by design; it only accepts POSTs that append a row.

To point at your own sheet:

1. Create a Google Sheet.
2. **Extensions → Apps Script**, add a `doPost(e)` handler that appends `JSON.parse(e.postData.contents).email`.
3. **Deploy → New deployment → Web app**, set access to "Anyone", and copy the `/exec` URL.
4. Replace `SHEETS_ENDPOINT` at the top of `main.js`.

## Deployment

Hosted on GitHub Pages from the `main` branch root. Every push to `main` redeploys automatically:

```bash
git add -A
git commit -m "your message"
git push
```

Allow ~30–60s after a push, then hard-refresh (Ctrl+Shift+R) to bypass the browser cache.

To enable Pages the first time: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
