const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxzK1XY99_2VTiRve-6czO08UdvZ6Ok2VoO8i1_otCeKEEsK2slhzczX8FKs5a2Ba5X/exec';

const form = document.getElementById('waitlist-form');
const emailInput = document.getElementById('email');
const errorEl = document.getElementById('form-error');
const successEl = document.getElementById('form-success');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const email = emailInput.value.trim();
  if (!email || !email.includes('@')) {
    errorEl.textContent = 'Please enter a valid email address.';
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    await fetch(SHEETS_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ email })
    });
    form.style.display = 'none';
    successEl.textContent = "You're on the list. The cards will find you.";
    successEl.classList.add('visible');
  } catch {
    errorEl.textContent = 'Unable to connect. Please try again.';
    btn.disabled = false;
    btn.textContent = 'JOIN →';
  }
});
