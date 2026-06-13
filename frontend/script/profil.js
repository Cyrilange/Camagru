async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/wall.html";
}

async function loadProfile() {
    const res = await fetch('/api/user/load', { credentials: 'include' });
    if (!res.ok) return window.location.href = '/login.html';
    const user = await res.json();

    document.getElementById('username').placeholder = user.username;
    document.getElementById('email').placeholder = user.email;
    document.getElementById('notify_comments').checked = !!user.notify_comments;
}

document.getElementById('save-btn').addEventListener('click', async () => {
    const body = {};
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const notify_comments = document.getElementById('notify_comments').checked;

    if (username) body.username = username;
    if (email) body.email = email;
    if (password) body.password = password;
    body.notify_comments = notify_comments;

    const res = await fetch('/api/user/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const msg = document.getElementById('msg');
    if (res.ok) {
        msg.textContent = 'Sauvegardé !';
        msg.style.color = 'green';
        document.getElementById('password').value = '';
    } else {
        const err = await res.json();
        msg.textContent = 'Erreur: ' + err.error;
        msg.style.color = 'red';
    }
});

loadProfile();