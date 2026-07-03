import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, drawSpread, POSITIONS } from '../draw.js';
import { DECK } from '../deck.js';

// Deterministic rng that cycles through given values.
const seq = (values) => { let i = 0; return () => values[i++ % values.length]; };

test('shuffle does not mutate input and keeps all elements', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, seq([0.1, 0.5, 0.9, 0.3]));
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
});

test('drawSpread returns 3 distinct cards with valid positions', () => {
  const spread = drawSpread(DECK, seq([0.42]));
  assert.equal(spread.length, 3);
  assert.deepEqual(spread.map(s => s.position), POSITIONS);
  const ids = spread.map(s => s.card.id);
  assert.equal(new Set(ids).size, 3);
});

test('orientation is always upright or reversed, over many draws', () => {
  for (let i = 0; i < 200; i++) {
    const spread = drawSpread(DECK);
    for (const s of spread) {
      assert.ok(s.orientation === 'upright' || s.orientation === 'reversed');
      assert.ok(s.card && typeof s.card.name === 'string');
    }
  }
});

test('reversed orientation is chosen when rng >= 0.5', () => {
  // After 77 shuffle calls, calls 78-80 return values[5,0,1]. Need all >= 0.5.
  const spread = drawSpread(DECK, seq([0.9, 0.9, 0, 0, 0, 0.9]));
  assert.ok(spread.every(s => s.orientation === 'reversed'));
});
