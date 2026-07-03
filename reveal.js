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
