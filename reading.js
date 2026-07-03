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
  cardImg.alt = '';
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
  cardImg.alt = `${card.name}${orientation === 'reversed' ? ', reversed' : ''}`;
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
