import { DECK } from './deck.js';
import { drawSpread } from './draw.js';

const form = document.getElementById('ask-form');
const drawBtn = document.getElementById('draw-btn');
const questionEl = document.getElementById('question');
const spreadEl = document.getElementById('spread');
const readingZone = document.querySelector('.reading-zone');
const readingEl = document.getElementById('reading');
const statusEl = document.getElementById('reading-status');

const audio = document.getElementById('bg-audio');
const soundToggle = document.getElementById('sound-toggle');

const GROQ_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxzK1XY99_2VTiRve-6czO08UdvZ6Ok2VoO8i1_otCeKEEsK2slhzczX8FKs5a2Ba5X/exec';

const retryBtn = document.getElementById('retry-btn');

let soundOn = localStorage.getItem('lux-sound') === 'on';

function reflectSound() {
  soundToggle.textContent = soundOn ? '♪ on' : '♪ off';
  soundToggle.setAttribute('aria-pressed', String(soundOn));
  if (soundOn) {
    audio.play().catch(() => {}); // ignored until a user gesture has occurred
  } else {
    audio.pause();
  }
}

soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  localStorage.setItem('lux-sound', soundOn ? 'on' : 'off');
  reflectSound();
});

function startAudioIfEnabled() {
  if (soundOn) audio.play().catch(() => {});
}

reflectSound();

let currentSpread = [];

function fallbackText(spread) {
  return spread
    .map(s => `${s.position} — ${s.card.name}${s.orientation === 'reversed' ? ' (reversed)' : ''}: ` +
              `${s.orientation === 'reversed' ? s.card.reversed : s.card.upright}`)
    .join('\n\n');
}

async function requestReading(spread) {
  statusEl.textContent = 'The cards are speaking…';
  readingEl.textContent = '';
  retryBtn.hidden = true;
  drawBtn.disabled = true;

  const payload = {
    type: 'reading',
    question: questionEl.value.trim(),
    cards: spread.map(s => ({
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
    statusEl.textContent = '';
    renderReading(data.reading);
  } catch (err) {
    const busy = /rate_limited/i.test(err && err.message);
    statusEl.textContent = busy
      ? 'The cards are in high demand right now — here is what they show plainly.'
      : 'The connection to the cards faltered — here is what they show plainly.';
    renderReading(fallbackText(spread));
    retryBtn.hidden = false;
  } finally {
    drawBtn.disabled = false;
  }
}

function renderReading(text) {
  readingEl.innerHTML = '';
  text.split(/\n\s*\n/).forEach(para => {
    const p = document.createElement('p');
    p.textContent = para.trim();
    readingEl.appendChild(p);
  });
}

function renderSpread(spread) {
  const slots = spreadEl.querySelectorAll('.card-slot');
  spreadEl.hidden = false;
  slots.forEach((slot, i) => {
    const { card, orientation, position } = spread[i];
    const cardEl = slot.querySelector('.card');
    const front = slot.querySelector('.card-front');
    const img = slot.querySelector('.card-front img');
    front.classList.toggle('reversed', orientation === 'reversed');
    img.src = card.image;                       // browser encodes the spaces in the path
    img.alt = `${card.name}${orientation === 'reversed' ? ', reversed' : ''}`;
    slot.querySelector('.card-position').textContent = position;
    cardEl.classList.remove('revealed');
    // Stagger the flip so cards reveal one after another.
    setTimeout(() => cardEl.classList.add('revealed'), 200 + i * 260);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  startAudioIfEnabled();
  currentSpread = drawSpread(DECK);
  renderSpread(currentSpread);
  readingZone.hidden = false;
  requestReading(currentSpread);
});

retryBtn.addEventListener('click', () => requestReading(currentSpread));
