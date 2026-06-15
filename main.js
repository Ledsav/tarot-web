const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

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
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      form.style.display = 'none';
      successEl.textContent = "You're on the list. The cards will find you.";
      successEl.classList.add('visible');
    } else {
      const data = await res.json().catch(() => ({}));
      const msg = data.errors?.[0]?.message || 'Something went wrong. Please try again.';
      errorEl.textContent = msg;
      btn.disabled = false;
      btn.textContent = 'JOIN →';
    }
  } catch {
    errorEl.textContent = 'Unable to connect. Please try again.';
    btn.disabled = false;
    btn.textContent = 'JOIN →';
  }
});
