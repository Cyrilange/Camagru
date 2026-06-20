let currentPage = 1;
const perPage = 5;

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showAuthMsg(imageId) {
    const msg = document.getElementById(`auth-msg-${imageId}`);
    if (!msg) return;
    msg.textContent = 'You must be logged in!';
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 3000);
}

function shareUrl(filename) {
    return encodeURIComponent(window.location.origin + '/' + filename);
}

function setPagination(total) {
    const pageInfo = document.getElementById('pageInfo');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');

    if (!pageInfo || !prevPage || !nextPage) return;

    const totalPages = Math.max(1, Math.ceil((total || 0) / perPage));
    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage >= totalPages;
}

async function loadPosts(page = 1) {
    currentPage = page;
    const feed = document.querySelector('.feed');
    if (!feed) return;

    const res = await fetch(`/api/gallery?page=${page}&limit=${perPage}`);
    if (!res.ok) {
        feed.innerHTML = '<p class="empty-state">Unable to load the gallery right now.</p>';
        return;
    }

    const data = await res.json().catch(() => ({}));
    const images = Array.isArray(data.images) ? data.images : [];

    feed.innerHTML = '';

    if (images.length === 0) {
        feed.innerHTML = '<p class="empty-state">No posts yet.</p>';
        setPagination(0);
        return;
    }

    feed.insertAdjacentHTML(
        'beforeend',
        images.map(post => `
            <article class="post">
                <div class="post-header">
                    <div class="avatar">${escapeHtml(post.username?.[0]?.toUpperCase() || '?')}</div>
                    <div class="username">${escapeHtml(post.username)}</div>
                </div>

                <img src="${post.filename}" alt="Post image" />

                <div class="actions container-date_likes">
                    <p class="likes" onclick="toggleLike(${post.id}, this)">🩷 ${post.likes}</p>
                    <p class="com" onclick="toggleComments(${post.id}, this)">💬 ${post.comments}</p>
                    <p class="date">${new Date(post.created_at).toLocaleDateString('en-GB')}</p>

                    <div class="share-btns">
                        <button onclick="window.open('https://twitter.com/intent/tweet?url=' + shareUrl('${post.filename}'), '_blank')"><i class="fa-brands fa-x-twitter"></i></button>
                        <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=' + shareUrl('${post.filename}'), '_blank')"><i class="fa-brands fa-facebook"></i></button>
                        <button onclick="window.open('https://wa.me/?text=' + shareUrl('${post.filename}'), '_blank')"><i class="fa-brands fa-whatsapp"></i></button>
                    </div>
                </div>

                <div id="comments-${post.id}" class="comments-section" style="display:none;">
                    <div id="comments-list-${post.id}"></div>
                    <div class="comment-form">
                        <input type="text" id="comment-input-${post.id}" placeholder="Add a comment...">
                        <button onclick="submitComment(${post.id})">Send</button>
                        <p id="auth-msg-${post.id}" style="display:none; color:red;"></p>
                    </div>
                </div>
            </article>
        `).join('')
    );

    setPagination(data.total || 0);
}

const nextPageBtn = document.getElementById('nextPage');
if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        currentPage++;
        loadPosts(currentPage);
    });
}

const prevPageBtn = document.getElementById('prevPage');
if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPosts(currentPage);
        }
    });
}

async function logout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) window.location.href = '/wall.html';
}

async function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout');
    const usernameEl = document.getElementById('username');

    if (!loginBtn || !logoutBtn || !usernameEl) return;

    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        return;
    }

    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';

    const user = await res.json().catch(() => null);
    if (user?.username) {
        usernameEl.textContent = user.username;
    }
}

async function toggleLike(imageId, el) {
    const res = await fetch(`/api/gallery/${imageId}/like`, {
        method: 'POST',
        credentials: 'include'
    });

    if (res.status === 401) {
        showAuthMsg(imageId);
        return;
    }

    if (res.ok) {
        const data = await res.json().catch(() => null);
        const count = parseInt(el.textContent.replace('🩷 ', '')) || 0;
        if (data?.message === 'like added') {
            el.textContent = `🩷 ${count + 1}`;
        } else if (data?.message === 'like deleted') {
            el.textContent = `🩷 ${Math.max(0, count - 1)}`;
        }
    }
}
window.toggleLike = toggleLike;

async function toggleComments(imageId) {
    const section = document.getElementById(`comments-${imageId}`);
    if (!section) return;
    if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadComments(imageId);
    } else {
        section.style.display = 'none';
    }
}
window.toggleComments = toggleComments;

async function loadComments(imageId) {
    const res = await fetch(`/api/gallery/${imageId}/comments`, {
        credentials: 'include'
    });
    if (!res.ok) return;

    const comments = await res.json().catch(() => []);
    const list = document.getElementById(`comments-list-${imageId}`);
    if (!list) return;

    list.innerHTML = comments.map(c => `
        <div class="comment">
            <strong>${escapeHtml(c.username)}</strong> ${escapeHtml(c.content)}
        </div>
    `).join('');
}

async function submitComment(imageId) {
    const input = document.getElementById(`comment-input-${imageId}`);
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    const res = await fetch(`/api/gallery/${imageId}/comment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });

    if (res.status === 401) {
        showAuthMsg(imageId);
        return;
    }

    if (res.ok) {
        input.value = '';
        await loadComments(imageId);
        const section = document.getElementById(`comments-${imageId}`);
        if (!section) return;
        const comEl = section.previousElementSibling?.querySelector('.com');
        if (comEl) {
            const count = parseInt(comEl.textContent.replace('💬 ', '')) || 0;
            comEl.textContent = `💬 ${count + 1}`;
        }
    }
}
window.submitComment = submitComment;

function init() {
    updateAuthUI();
    loadPosts();
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

init();