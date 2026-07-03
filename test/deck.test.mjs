import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DECK } from '../deck.js';

test('deck has 78 unique cards ordered 0..77', () => {
  assert.equal(DECK.length, 78);
  DECK.forEach((c, i) => assert.equal(c.id, i));
  assert.equal(new Set(DECK.map(c => c.name)).size, 78);
});

test('every card has meanings and a correct image path', () => {
  for (const c of DECK) {
    assert.ok(c.upright.length > 0, `${c.name} upright`);
    assert.ok(c.reversed.length > 0, `${c.name} reversed`);
    assert.equal(c.image, `design/assets/cards/${c.id} ${c.name}.jpg`);
  }
});

test('key cards sit at their canonical indices', () => {
  assert.equal(DECK[0].name, 'The Fool');
  assert.equal(DECK[19].name, 'The Sun');
  assert.equal(DECK[22].name, 'Ace of Wands');
  assert.equal(DECK[77].name, 'King of Pentacles');
});
