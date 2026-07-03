import { DECK } from './deck.js';
import { drawSpread } from './draw.js';
import { splitReading } from './reveal.js';

const GROQ_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxzK1XY99_2VTiRve-6czO08UdvZ6Ok2VoO8i1_otCeKEEsK2slhzczX8FKs5a2Ba5X/exec';

const form = document.getElementById('ask-form');
const questionEl = document.getElementById('question');

const stage = document.getElementById('stage');
const pips = [...stage.querySelectorAll('.pip')];
const fan = stage.querySelector('.card-fan');
const tapHint = stage.querySelector('.tap-hint');
const stagePosition = stage.querySelector('.stage-position');
const stageMeaning = stage.querySelector('.stage-meaning');
const nextBtn = stage.querySelector('.stage-next');

const conclusionZone = document.querySelector('.conclusion-zone');
const miniCards = conclusionZone.querySelector('.mini-cards');
const readingEl = document.getElementById('reading');
const retryBtn = document.getElementById('retry-btn');
const shareBtn = document.getElementById('share-btn');

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
const FAN_COUNT = 7;       // face-down cards fanned out at each step
const FAN_SPREAD_DEG = 11; // angle between adjacent cards in the fan

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  spread: [],
  index: 0,
  revealed: false, // has a card been picked & flipped for this position?
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

// Build a fresh fan of face-down cards for the current position. Every card is
// identical (a back); whichever the user picks reveals the pre-drawn card — the
// choice is an illusion, the spread was fixed at draw time.
function renderFan() {
  fan.innerHTML = '';
  for (let i = 0; i < FAN_COUNT; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fan-card';
    btn.setAttribute('aria-label', 'Pick this card');
    const angle = (i - (FAN_COUNT - 1) / 2) * FAN_SPREAD_DEG;
    btn.style.setProperty('--angle', angle + 'deg');
    btn.style.zIndex = String(i); // later cards overlap on top, like a held fan
    btn.innerHTML =
      '<div class="card">' +
        '<div class="card-face card-back"></div>' +
        '<div class="card-face card-front"><img alt=""></div>' +
      '</div>';
    fan.appendChild(btn);
  }
  stagePosition.textContent = '';
  stageMeaning.hidden = true;
  stageMeaning.classList.remove('shimmer');
  stageMeaning.textContent = '';
  nextBtn.hidden = true;
  tapHint.hidden = false;
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

// The user picked a fan card: reveal the current position's card on it, send the
// rest scattering, then flip the chosen one and show its meaning.
function choose(cardBtn) {
  if (state.revealed) return;
  state.revealed = true;
  const { card, orientation, position } = state.spread[state.index];

  const front = cardBtn.querySelector('.card-front');
  const img = cardBtn.querySelector('.card-front img');
  front.classList.toggle('reversed', orientation === 'reversed');
  img.src = card.image; // browser encodes spaces in the path
  img.alt = `${card.name}${orientation === 'reversed' ? ', reversed' : ''}`;

  cardBtn.style.zIndex = '10';
  [...fan.children].forEach((c) => {
    c.classList.add(c === cardBtn ? 'chosen' : 'dismissed');
    c.disabled = true;
  });

  const flip = () => cardBtn.querySelector('.card').classList.add('revealed');
  if (prefersReducedMotion()) flip();
  else setTimeout(flip, 360); // let the card reach center before it turns

  tapHint.hidden = true;
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
    renderFan();
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
  renderFan();
  fetchReading(state.spread); // one request, in the background
  stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Pick any card in the fan (event-delegated, since the fan is rebuilt each step).
fan.addEventListener('click', (e) => {
  const card = e.target.closest('.fan-card');
  if (card && fan.contains(card)) choose(card);
});
nextBtn.addEventListener('click', goNext);

// --- Share a simple text summary of the reading ---
function buildSummary() {
  const q = questionEl.value.trim();
  const cardLines = state.spread.map((s) =>
    `${s.position} — ${s.card.name}${s.orientation === 'reversed' ? ' (reversed)' : ''}`);
  const conclusion = (state.parts && state.parts.conclusion) ||
    'The cards have spoken.';
  const url = location.origin + location.pathname;
  return [
    q ? `My tarot reading on: "${q}"` : 'My tarot reading',
    '',
    ...cardLines,
    '',
    conclusion,
    '',
    `Read yours at ${url}`,
  ].join('\n');
}

function flashCopied() {
  const original = shareBtn.textContent;
  shareBtn.textContent = 'Copied!';
  shareBtn.classList.add('copied');
  setTimeout(() => {
    shareBtn.textContent = original;
    shareBtn.classList.remove('copied');
  }, 1800);
}

async function shareReading() {
  const text = buildSummary();
  try {
    if (navigator.share) {
      await navigator.share({ title: 'My LUX tarot reading', text });
      return;
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return; // user dismissed the share sheet
    // fall through to clipboard on any other share failure
  }
  try {
    await navigator.clipboard.writeText(text);
    flashCopied();
  } catch {
    /* nothing more we can do; leave the button as-is */
  }
}

shareBtn.addEventListener('click', shareReading);

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
