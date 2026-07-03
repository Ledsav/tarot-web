# LUX Apps Script proxy — setup

1. Open your waitlist Google Sheet ▸ **Extensions ▸ Apps Script**.
2. Replace the script contents with `Code.gs` from this folder.
3. **Project Settings ▸ Script Properties ▸ Add script property**:
   - Name: `GROQ_API_KEY`
   - Value: your key from https://console.groq.com (free tier).
4. **Deploy ▸ Manage deployments ▸ Edit** the existing web app (or **New deployment ▸ Web app**):
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the `/exec` URL. It must match `GROQ_ENDPOINT` in `reading.js`
   (it is the same URL as `SHEETS_ENDPOINT` in `main.js`).

The key lives only in Script Properties — it is never served to the browser.
`llama-3.3-70b-versatile` is a Groq free-tier model; swap the `model` string if Groq
retires it.
