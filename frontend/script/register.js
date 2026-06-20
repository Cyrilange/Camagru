document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = new FormData(e.target);
  const data = {
    username: form.get('username'),
    email: form.get('email'),
    password: form.get('password')
  };

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const goodDiv = document.getElementById('good-message');
  const errorDiv = document.getElementById('error-message');

  if (res.ok) {
    if (goodDiv) {
      goodDiv.textContent = 'Account created! Check your email to verify your account.';
    }
    if (errorDiv) {
      errorDiv.textContent = '';
    }
    return;
  }

  let message = 'Error during registration. Please verify your information.';
  try {
    const err = await res.json();
    if (err?.error) message = err.error;
  } catch {}

  if (errorDiv) {
    errorDiv.textContent = message;
  }
});