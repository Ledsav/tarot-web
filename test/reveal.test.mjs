import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitReading } from '../reveal.js';

test('four paragraphs → three cards + conclusion', () => {
  const out = splitReading('Card one.\n\nCard two.\n\nCard three.\n\nDo this.');
  assert.deepEqual(out.cards, ['Card one.', 'Card two.', 'Card three.']);
  assert.equal(out.conclusion, 'Do this.');
});

test('five+ paragraphs → extras fold into the conclusion', () => {
  const out = splitReading('a\n\nb\n\nc\n\nd\n\ne');
  assert.deepEqual(out.cards, ['a', 'b', 'c']);
  assert.equal(out.conclusion, 'd\n\ne');
});

test('exactly three paragraphs → no conclusion', () => {
  const out = splitReading('a\n\nb\n\nc');
  assert.deepEqual(out.cards, ['a', 'b', 'c']);
  assert.equal(out.conclusion, '');
});

test('fewer than three paragraphs → pad missing card slots with empty strings', () => {
  const out = splitReading('only one');
  assert.deepEqual(out.cards, ['only one', '', '']);
  assert.equal(out.conclusion, '');
});

test('empty / whitespace input → all empty, never throws', () => {
  const out = splitReading('   \n\n  ');
  assert.deepEqual(out.cards, ['', '', '']);
  assert.equal(out.conclusion, '');
});

test('collapses irregular blank-line runs and trims paragraphs', () => {
  const out = splitReading('  a  \n\n\n   b\n \n c \n\n\n\n d ');
  assert.deepEqual(out.cards, ['a', 'b', 'c']);
  assert.equal(out.conclusion, 'd');
});
