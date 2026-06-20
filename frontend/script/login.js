function showError(message) {
  const box = document.getElementById('login-error');
  if (!box) return;
  box.textContent = message;
}

function showRegisterPrompt() {
  const box = document.getElementById('login-error');
  if (!box) return;

  box.innerHTML = `
    Invalid credentials.<br>
    <button id="go-register" style="margin-top:10px;">
      Do you want to register?
    </button>
  `;

  const goRegister = document.getElementById('go-register');
  if (goRegister) {
    goRegister.addEventListener('click', () => {
      window.location.href = '/register.html';
    });
  }
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = new FormData(e.target);
  const data = {
    email: form.get('email'),
    password: form.get('password')
  };

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });

  if (res.ok) {
    window.location.href = '/wall.html';
    return;
  }

  let errorMessage = 'Unable to login.';
  try {
    const err = await res.json();
    if (err?.error) errorMessage = err.error;
  } catch {}

  showError(errorMessage);
  showRegisterPrompt();
});

document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = new FormData(e.target);
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: form.get('email') })
  });

  const msg = document.getElementById('msg');
  if (!msg) return;

  if (res.ok) {
    msg.textContent = 'Reset link sent to your email.';
  } else {
    try {
      const err = await res.json();
      msg.textContent = err?.error || 'Email not found.';
    } catch {
      msg.textContent = 'Email not found.';
    }
  }
});