export const POSITIONS = ['Past', 'Present', 'Future'];

export function shuffle(array, rng = Math.random) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawSpread(deck, rng = Math.random) {
  const picked = shuffle(deck, rng).slice(0, 3);
  return picked.map((card, i) => ({
    card,
    orientation: rng() >= 0.5 ? 'reversed' : 'upright',
    position: POSITIONS[i],
  }));
}
