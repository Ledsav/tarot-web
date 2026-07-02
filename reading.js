import { DECK } from './deck.js';
import { drawSpread } from './draw.js';

const form = document.getElementById('ask-form');
const drawBtn = document.getElementById('draw-btn');
const questionEl = document.getElementById('question');
const spreadEl = document.getElementById('spread');
const readingZone = document.querySelector('.reading-zone');
const readingEl = document.getElementById('reading');
const statusEl = document.getElementById('reading-status');

let currentSpread = [];

function fallbackText(spread) {
  return spread
    .map(s => `${s.position} — ${s.card.name}${s.orientation === 'reversed' ? ' (reversed)' : ''}: ` +
              `${s.orientation === 'reversed' ? s.card.reversed : s.card.upright}`)
    .join('\n\n');
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
  currentSpread = drawSpread(DECK);
  renderSpread(currentSpread);
  readingZone.hidden = false;
  statusEl.textContent = '';
  readingEl.textContent = fallbackText(currentSpread);
});
