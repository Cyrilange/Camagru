async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/wall.html';
}

async function loadProfile() {
    const res = await fetch('/api/user/load', { credentials: 'include' });
    if (!res.ok) return window.location.href = '/login.html';

    const user = await res.json().catch(() => null);
    if (!user) return;

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const notifyInput = document.getElementById('notify_comments');

    if (usernameInput) usernameInput.placeholder = user.username || '';
    if (emailInput) emailInput.placeholder = user.email || '';
    if (notifyInput) notifyInput.checked = !!user.notify_comments;
}

document.getElementById('save-btn')?.addEventListener('click', async () => {
    const body = {};
    const username = document.getElementById('username')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value.trim();
    const notify_comments = document.getElementById('notify_comments')?.checked;
    const msg = document.getElementById('msg');

    if (username) body.username = username;
    if (email) body.email = email;
    if (password) body.password = password;
    body.notify_comments = !!notify_comments;

    const res = await fetch('/api/user/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!msg) return;

    if (res.ok) {
        msg.textContent = 'Saved!';
        msg.style.color = 'green';
        const passwordInput = document.getElementById('password');
        if (passwordInput) passwordInput.value = '';
    } else {
        try {
            const err = await res.json();
            msg.textContent = 'Error: ' + (err.error || 'Unable to save changes.');
        } catch {
            msg.textContent = 'Error: Unable to save changes.';
        }
        msg.style.color = 'red';
    }
});

loadProfile();